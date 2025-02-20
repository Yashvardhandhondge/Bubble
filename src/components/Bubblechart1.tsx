import React, { useEffect, useMemo, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import Modal from './Modal';
import { Wget } from './Chart';

interface DataItem extends d3.SimulationNodeDatum {
  risk?: number;
  bubbleSize?: number;
  volume?: number;
  symbol?: string;
  icon?: string;
  x: number;
  y: number;
  radius: number;
  price?: number;
  moralisLink?: string;
  warnings?: string[];
  "1mChange"?: number;
  "2wChange"?: number;
  "3mChange"?: number;
}

interface MobileBubbleChartProps {
  selectedRange: string;
}

const MobileBubbleChart: React.FC<MobileBubbleChartProps> = ({ selectedRange }) => {
  const { filteredData, loading, error } = useData();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<DataItem, undefined> | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<DataItem | null>(null);

  // Calculate container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const availableHeight = vh * 0.85; 
      setContainerDimensions({
        width: vw,
        height: availableHeight
      });
    };

    updateDimensions();
    if (window.innerWidth >= 768) {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  // Filter data based on selected range
  const rangeFilteredData = useMemo<DataItem[]>(() => {
    if (!filteredData.length) return [];
    
    let start = 0;
    let end = 100;

    if (selectedRange !== "Top 100") {
      const [startStr, endStr] = selectedRange.split(" - ");
      start = parseInt(startStr) - 1;
      end = parseInt(endStr);
    }

    return filteredData
      .slice(Math.max(0, start), Math.min(filteredData.length, end))
      .map(item => ({ ...item } as DataItem));
  }, [filteredData, selectedRange]);

  // Calculate bubble color based on risk - using the enhanced color scheme from the main component
  const calculateBubbleColor = (risk: number) => {
    const clampedRisk = Math.max(10, Math.min(100, risk || 50));
    const t = (clampedRisk - 10) / 90; // normalize risk between 0 and 1
    
    // Smoothly interpolate from green (low risk) to red (high risk)
    const borderColor = d3.interpolateRgb("rgba(30,255,30,0.9)", "rgba(255,0,0,0.95)")(t);
    const backgroundColor = d3.interpolateRgb("rgba(30,255,30,0.35)", "rgba(255,0,0,0.4)")(t);
    const gradientColor = d3.interpolateRgb("rgba(30,255,30,0.5)", "rgba(255,0,0,0.6)")(t);
    
    return {
      border: borderColor,
      background: backgroundColor,
      gradient: gradientColor
    };
  };

  // Position bubbles vertically by risk level
  const getYPosition = (risk: number, height: number) => {
    const normalizedRisk = Math.max(10, Math.min(100, risk || 50));
    // Invert the position (high risk at top) and adjust to start from the top
    return (height * 0.9) * (1 - (normalizedRisk - 10) / 90) + (height * 0.05);
  };

  // Handle bubble click
  const handleBubbleClick = (data: DataItem) => {
    setSelectedToken(data);
    setShowModal(true);
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedToken(null);
  };


  const createBubbleHTML = (d: DataItem) => {
    const colors = calculateBubbleColor(d.risk || 50);
    const iconSize = Math.max(d.radius * 0.6, 12);
    const symbolFontSize = Math.max(d.radius * 0.35, 10);
    const riskFontSize = Math.max(d.radius * 0.3, 8);
    
    return `
      <div class="bubble">
        <div class="relative rounded-full transition-transform hover:scale-105"
             style="width: ${d.radius * 2}px; height: ${d.radius * 2}px;">
          <div class="absolute inset-0 rounded-full"
               style="border: 3px solid ${colors.border}; background: ${colors.background};">
            <div class="absolute inset-0 rounded-full"
                 style="background: radial-gradient(circle at center, ${colors.gradient}, transparent);">
            </div>
          </div>
          <div class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
            ${d.icon 
              ? `<img src="${d.icon}" alt="${d.symbol}" 
                     style="width: ${iconSize}px; height: ${iconSize}px; object-fit: contain; margin-bottom: 2px;" 
                     loading="lazy" onerror="this.onerror=null;this.src='/default.png';" />`
              : `<div style="width: ${iconSize}px; height: ${iconSize}px; 
                           background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 2px;"></div>`
            }
            <span style="font-size: ${symbolFontSize}px; color: white; font-weight: 700; 
                          text-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1);
                          letter-spacing: 0.05em;">${d.symbol}</span>
            <span style="font-size: ${riskFontSize}px; color: white; font-weight: 600;
                          text-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1);">${d.risk?.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  };

  // Initialize and update the visualization
  useEffect(() => {
    if (!containerRef.current || !rangeFilteredData.length || 
        containerDimensions.width === 0 || containerDimensions.height === 0) {
      return;
    }

    // Stop any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const { width, height } = containerDimensions;
    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const bubbleContainer = container
      .append("div")
      .attr("class", "relative w-full h-full");

    // Calculate bubble size based on device width - adjusted for better visibility
    const minBubbleSize = Math.max(width * 0.05, 10);
    const maxBubbleSize = Math.max(width * 0.08, 20);

    // Determine scale factor for mobile screens
    const scaleFactor = window.innerWidth < 768 ? 0.7 : 1;

    // Mapping data to initialize bubbles with adjusted radius and center
    const initializedData = rangeFilteredData.map((d) => {
      const bubbleRadius = Math.max(
        minBubbleSize,
        Math.min(maxBubbleSize, (d.bubbleSize || 0.5) * 20 * scaleFactor)
      );
      
      return {
        ...d,
        x: window.innerWidth < 768 ? width / 2 : width / 2.2, // center more precisely on mobile
        y: getYPosition(d.risk || 50, height) + (Math.random() - 0.5) * 10,
        radius: bubbleRadius
      };
    });

    // Create force simulation with looser constraints for free-floating effect
    const simulation = d3.forceSimulation<DataItem>(initializedData)
      // Force X: strong centering at mid-width
      .force("x", d3.forceX<DataItem>(width / 2).strength(0.3))
      // Force Y: maintain risk-based vertical positioning
      .force("y", d3.forceY<DataItem>(d => getYPosition(d.risk || 50, height)).strength(0.3))
      // Collision prevention
      .force("collide", d3.forceCollide<DataItem>()
        .radius(d => d.radius + 2)
        .strength(1))
      // Charge for radial repulsion
      .force("charge", d3.forceManyBody<DataItem>()
        .strength(d => -Math.pow(d.radius, 2) * 0.3))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    // Add custom force to adjust top bubbles sideways
    simulation.force("topAdjust", (alpha: number) => {
      const threshold = height * 0.1;
      const centerX = width / 2;
      simulation.nodes().forEach(d => {
        if (d.y < threshold) {
          // Initialize vx if undefined
          if (d.vx === undefined) d.vx = 0.4;
          // Increase horizontal velocity away from the center
          d.vx += ((d.x - centerX) * 0.12) * alpha;
        }
      });
    });

    simulationRef.current = simulation;

    // If on mobile, schedule simulation to stop after it settles (after 5 seconds)
    if (window.innerWidth < 768) {
      setTimeout(() => simulation.stop(), 7000);
    }

    // Create bubbles
    const bubbles = bubbleContainer
      .selectAll<HTMLDivElement, DataItem>(".bubble-container")
      .data(initializedData)
      .enter()
      .append("div")
      .attr("class", "absolute transform -translate-x-1/2 -translate-y-1/2 bubble-container")
      .style("opacity", "0")
      .html(createBubbleHTML)
      .on("click", (event, d) => handleBubbleClick(d));

    // Animate bubbles in
    bubbles.transition()
      .duration(600)
      .delay((d, i) => i * 8)
      .style("opacity", "1");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      bubbles
        .style("left", d => `${Math.max(d.radius, Math.min(width - d.radius, d.x))}px`)
        .style("top", d => {
          const yPos = Math.max(d.radius, Math.min(height - d.radius, d.y));
          return `${yPos}px`;
        })
        .style("transform", "translate(-50%, -50%)")
        .style("position", "absolute"); 
    });

    // Clean up
    return () => {
      simulation.stop();
    };
  }, [rangeFilteredData, containerDimensions, selectedRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[82vh] bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!loading && (!filteredData.length || !rangeFilteredData.length)) {
    return (
      <div className="flex items-center justify-center h-[82vh] bg-black">
        <p className="text-white text-center px-4">No data available for the selected filters</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[82vh] bg-black">
        <div className="bg-red-900/50 p-4 rounded-lg m-4">
          <p className="text-red-200">Error loading data: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-700 rounded text-white hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="w-full h-[76vh] pt-[2vh] relative " 
        style={{ paddingBottom: '10vh' }}
      >
        {/* Matching gradient background from main component */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-yellow-700/10 to-green-900/20 z-0" />

        
        {/* Bubble container */}
        <div 
          ref={containerRef}
          className="relative w-full h-full z-20"
        />
      </div>

      {/* Modal for token details */}
      {showModal && selectedToken && (
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <Wget onClose={handleCloseModal} />
        </Modal>
      )}
    </>
  );
};

export default MobileBubbleChart;