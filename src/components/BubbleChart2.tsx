import  { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import './bubble.css';
import {Wget} from './Wget'; 
import Modal from './Modal';

const CONTAINER_HEIGHT = window.innerHeight * 0.85; // Adjusted to 85% of viewport height
const PADDING_TOP = 80;
const PADDING_BOTTOM = 60;
const EFFECTIVE_HEIGHT = CONTAINER_HEIGHT - (PADDING_TOP + PADDING_BOTTOM); // Reduced padding to extend chart
const BUBBLE_MIN_SIZE = 20; // Smaller minimum size
const BUBBLE_MAX_SIZE = 30; // Smaller maximum size
const BUBBLE_PADDING = 2; // Reduced padding between bubbles


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

interface BitcoinRiskChartProps {
  onBubbleClick: (data: DataItem) => void;
  selectedRange: string;
  isCollapsed?: boolean;
}

const BubbleChart: React.FC<BitcoinRiskChartProps> = ({ onBubbleClick, selectedRange, isCollapsed }) => {
  const { filteredData, loading, filters } = useData();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<DataItem, undefined> | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showWidget, setShowWidget] = useState(false); // State to conditionally render Wget
  const [showModal, setShowModal] = useState(false);

  // Dynamic container width adjustment
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      const newWidth = containerRef.current.clientWidth - (isCollapsed ? 24 : 48);
      setContainerWidth(newWidth);
    }
  }, [isCollapsed]);

  useEffect(() => {
    updateContainerWidth();
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [updateContainerWidth]);

  // Filter and process data
  const rangeFilteredData = useMemo<DataItem[]>(() => {
    if (!filteredData.length) return [];
    const [start, end] = selectedRange !== "Top 100" 
      ? selectedRange.split(" - ").map(n => parseInt(n))
      : [1, 100];
    return filteredData.slice(start - 1, end)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .map(item => ({ ...item } as DataItem));
  }, [filteredData, selectedRange, filters]);

  // Updated color calculation function with more distinct bands
  const calculateBubbleColor = (risk: number) => {
    // For high risk (red) colors
    if (risk > 90) {
      return {
        border: 'rgba(255, 0, 0, 0.95)',
        background: 'rgba(255, 0, 0, 0.4)',
        gradient: 'rgba(255, 0, 0, 0.6)'
      };
    }
    if (risk > 80) {
      return {
        border: 'rgba(255, 30, 30, 0.9)',
        background: 'rgba(255, 30, 30, 0.35)',
        gradient: 'rgba(255, 30, 30, 0.5)'
      };
    }
    if (risk > 70) {
      return {
        border: 'rgba(255, 60, 60, 0.85)',
        background: 'rgba(255, 60, 60, 0.3)',
        gradient: 'rgba(255, 60, 60, 0.4)'
      };
    }
    if (risk > 60) {
      return {
        border: 'rgba(255, 90, 90, 0.8)',
        background: 'rgba(255, 90, 90, 0.25)',
        gradient: 'rgba(255, 90, 90, 0.35)'
      };
    }
    if (risk > 50) {
      return {
        border: 'rgba(255, 120, 120, 0.75)',
        background: 'rgba(255, 120, 120, 0.2)',
        gradient: 'rgba(255, 120, 120, 0.3)'
      };
    }
    // For low risk (green) colors
    if (risk > 40) {
      return {
        border: 'rgba(120, 255, 120, 0.75)',
        background: 'rgba(120, 255, 120, 0.2)',
        gradient: 'rgba(120, 255, 120, 0.3)'
      };
    }
    if (risk > 30) {
      return {
        border: 'rgba(90, 255, 90, 0.8)',
        background: 'rgba(90, 255, 90, 0.25)',
        gradient: 'rgba(90, 255, 90, 0.35)'
      };
    }
    if (risk > 20) {
      return {
        border: 'rgba(60, 255, 60, 0.85)',
        background: 'rgba(60, 255, 60, 0.3)',
        gradient: 'rgba(60, 255, 60, 0.4)'
      };
    }
    // Most undervalued (darkest green)
    return {
      border: 'rgba(30, 255, 30, 0.9)',
      background: 'rgba(30, 255, 30, 0.35)',
      gradient: 'rgba(30, 255, 30, 0.5)'
    };
  };

  // Updated getRiskBand function for more precise positioning
  const getRiskBand = (risk: number) => {
    // Normalize risk to the visible range (10-100)
    const normalizedRisk = Math.max(10, Math.min(100, risk));
    // Calculate position as percentage of effective height (inverted)
    return PADDING_TOP + (EFFECTIVE_HEIGHT * (1 - (normalizedRisk - 10) / 90)); // Adjust for 10-100 range
  };

  // Update createBubbleHTML to enhance text visibility
  const createBubbleHTML = (d: DataItem) => {
    const colors = calculateBubbleColor(d.risk || 0);
    const iconSize = `${d.radius * 0.6}px`;
    const symbolFontSize = `${d.radius * 0.35}px`; // Slightly larger
    const percentFontSize = `${d.radius * 0.3}px`; // Slightly larger
  
    return `
      <div class="bubble">
        <div class="relative rounded-full transition-transform hover:scale-105"
             style="width: ${d.radius * 2}px; height: ${d.radius * 2}px;">
          <div class="absolute inset-0 rounded-full"
               style="border: 4px solid ${colors.border}; background: ${colors.background};">
            <div class="absolute inset-0 rounded-full"
                 style="background: radial-gradient(circle at center, ${colors.gradient}, transparent);">
            </div>
          </div>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer">
            ${d.icon ? `
              <img 
                src="${d.icon}" 
                alt="${d.symbol}" 
                style="width: ${iconSize}; height: ${iconSize}; object-fit: contain; margin-bottom: 4px;"
                loading="lazy"
              />
            ` : ''}
            <span 
              class="font-extrabold tracking-wider"
              style="
                font-size: ${symbolFontSize}; 
                color: rgba(255, 255, 255, 1);
                text-shadow: 0 0 4px rgba(0, 0, 0, 0.9),
                           0 0 2px rgba(0, 0, 0, 1);
                letter-spacing: 0.05em;
              "
            >
              ${d.symbol}
            </span>
            <span 
              class="font-black"
              style="
                font-size: ${percentFontSize}; 
                color: rgba(255, 255, 255, 1);
                text-shadow: 0 0 4px rgba(0, 0, 0, 0.9),
                           0 0 2px rgba(0, 0, 0, 1);
              "
            >
              ${d.risk?.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    `;
  };


  const handleBubbleClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  

  // Initialize and update simulation
  useEffect(() => {
    if (!containerRef.current || !rangeFilteredData.length || !containerWidth) {
      return;
    }
    
    // Stop previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const bubbleContainer = container
      .append("div")
      .attr("class", "bubbles-wrapper");

    const initializedData = rangeFilteredData.map((d) => ({
      ...d,
      x: containerWidth / 2 + (Math.random() - 0.5) * containerWidth * 0.4, // Reduced spread
      y: getRiskBand(d.risk ?? 50),
      radius: Math.max(
        BUBBLE_MIN_SIZE, 
        Math.min(BUBBLE_MAX_SIZE, d.bubbleSize ? d.bubbleSize * 20 : 20)
      )
    }));

    const simulation = d3.forceSimulation<DataItem>(initializedData)
      .force("x", d3.forceX<DataItem>((d) => {
        // Group bubbles by risk percentage bands
        // const riskBand = Math.floor((d.risk || 0) / 10) * 10;
        const bandOffset = ((d.risk || 0) % 10) / 10;
        const spread = containerWidth * 0.3; // Reduced spread
        return containerWidth / 2 + (bandOffset - 0.5) * spread;
      }).strength(0.1)) // Increased strength for tighter grouping
      .force("y", d3.forceY<DataItem>((d) => getRiskBand(d.risk ?? 50))
        .strength(0.99)) // Increased strength for better alignment
      .force("collide", d3.forceCollide<DataItem>()
        .radius(d => d.radius + BUBBLE_PADDING)
        .strength(1)) // Maximum strength for collision
      .force("charge", d3.forceManyBody<DataItem>()
        .strength(d => -Math.pow(d.radius, 2) * 0.3)) // Radius-based repulsion
      .alphaDecay(0.02)
      .velocityDecay(0.3);
    simulationRef.current = simulation;

    const bubbles = bubbleContainer.selectAll<HTMLDivElement, DataItem>(".bubble-container")
      .data(initializedData)
      .enter()
      .append("div")
      .attr("class", "bubble-container")
      .style("opacity", "0")
      .html(createBubbleHTML)
      .on("click", handleBubbleClick);

    // Add immediate transition for bubble appearance
    bubbles.transition()
      .duration(600)
      .style("opacity", "1");

    simulation.on("tick", () => {
      bubbles
        .style("left", d => `${Math.max(d.radius, Math.min(containerWidth - d.radius, d.x))}px`)
        .style("top", d => {
          const yPos = Math.max(PADDING_TOP + d.radius, Math.min(CONTAINER_HEIGHT - PADDING_BOTTOM - d.radius, d.y));
          return `${yPos}px`;
        })
        .style("transform", "translate(-50%, -50%)")
        .style("position", "absolute"); // Ensure absolute positioning
    });

    return () => {
      simulation.stop();
    };
  }, [rangeFilteredData, containerWidth, onBubbleClick, selectedRange, isCollapsed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!loading && (!filteredData.length || !rangeFilteredData.length)) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-white">No data available for the selected filters</p>
      </div>
    );
  }

  
  if (showWidget) {
    return <Wget />;
  }

  return (
    <>
      <div className="relative w-full overflow-visible" style={{ 
        height: CONTAINER_HEIGHT,
        maxHeight: '900px' 
      }}>
        <div className="relative bg-black h-full overflow-visible">
          <div className="absolute left-0 top-0 flex flex-col text-sm text-white h-full" style={{ zIndex: 1 }}>
            {[
              { range: '100', position: 0 },
              { range: '80', position: 25 },
              { range: '60', position: 50 },
              { range: '40', position: 75 },
              { range: '20', position: 87.5 },
              { range: '10', position: 100 },
            ].map(({ range, position }) => (
              <div 
                key={range}
                className="absolute w-full"
                style={{ 
                  top: `${position}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                <span className="text-xs whitespace-nowrap">{range} -</span>
                <div 
                  className="absolute w-[calc(100vw-32px)] h-[1px] left-[30px]" 
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    zIndex: 1
                  }}
                />
              </div>
            ))}
          </div>

          {/* Labels */}
          <div className="absolute left-10 top-2 text-lg font-semibold text-white" style={{ zIndex: 2 }}>
            Risk Levels
          </div>
          <div className="absolute bottom-2 right-10 text-white font-medium" style={{ zIndex: 2 }}>
            UNDERVALUED
          </div>
          <div className="absolute top-2 right-10 text-white font-medium" style={{ zIndex: 2 }}>
            OVERVALUED
          </div>

          {/* Bubble container */}
          <div 
            ref={containerRef}
            className="custom-div ml-7" 
            style={{ 
              position: 'relative',
              height: '100%',
              width: '100%',
              paddingTop: `${PADDING_TOP}px`,
              paddingBottom: `${PADDING_BOTTOM}px`,
              zIndex: 10  // Add this
            }}
          />
        </div>
      </div>
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <Wget />
      </Modal>
    </>
  );
}

export default BubbleChart;

