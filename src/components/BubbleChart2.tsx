import  { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import './bubble.css';
import {Wget} from './Wget'; 
import Modal from './Modal';

const CONTAINER_HEIGHT = 600;
const CONTAINER_WIDTH = 1100;
const BUBBLE_PADDING = 5;
const MIN_BUBBLE_SIZE = 25;
const MAX_BUBBLE_SIZE = 40;
const BASE_BUBBLE_RATIO = 0.04; // Base bubble size as percentage of container width
const MIN_SEPARATION_RATIO = 1.2; // Minimum space between bubbles

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

export default function BitcoinRiskChart({
  onBubbleClick,
  selectedRange,
  isCollapsed
}: BitcoinRiskChartProps) {
  const { filteredData, loading, error, filters } = useData();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<DataItem, undefined> | null>(null);
  const [containerWidth, setContainerWidth] = useState(CONTAINER_WIDTH);
  const [isInitialRender, setIsInitialRender] = useState(true);
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

  // Calculate bubble colors based on risk level
  const calculateBubbleColor = (risk: number) => {
    if (risk > 50) {
      // Red theme for overvalued with intensity based on risk level
      const intensity = (risk - 50) / 50; // 0 to 1 scale for risks 50-100
      return {
        border: `rgba(255, ${Math.round(100 - intensity * 100)}, ${Math.round(100 - intensity * 100)}, 0.8)`,
        background: `rgba(255, ${Math.round(100 - intensity * 100)}, ${Math.round(100 - intensity * 100)}, 0.2)`,
        gradient: `rgba(255, ${Math.round(100 - intensity * 100)}, ${Math.round(100 - intensity * 100)}, 0.3)`
      };
    } else {
      // Green theme for undervalued with intensity based on risk level
      const intensity = (50 - risk) / 50; // 0 to 1 scale for risks 0-50
      return {
        border: `rgba(${Math.round(100 - intensity * 100)}, 255, ${Math.round(100 - intensity * 100)}, 0.8)`,
        background: `rgba(${Math.round(100 - intensity * 100)}, 255, ${Math.round(100 - intensity * 100)}, 0.2)`,
        gradient: `rgba(${Math.round(100 - intensity * 100)}, 255, ${Math.round(100 - intensity * 100)}, 0.3)`
      };
    }
  };

  // Update the getRiskBand function to be more precise
  const getRiskBand = (risk: number) => {
    const bandPadding = CONTAINER_HEIGHT * 0.05; // 5% padding
    if (risk >= 80) return CONTAINER_HEIGHT * 0.1 + bandPadding;
    if (risk >= 60) return CONTAINER_HEIGHT * 0.3 + bandPadding;
    if (risk >= 40) return CONTAINER_HEIGHT * 0.5 + bandPadding;
    if (risk >= 20) return CONTAINER_HEIGHT * 0.7 + bandPadding;
    return CONTAINER_HEIGHT * 0.9 - bandPadding;
  };

  const createBubbleHTML = (d: DataItem) => {
    const colors = calculateBubbleColor(d.risk || 0);
    const iconSize = `${d.radius * 0.6}px`;
    const symbolFontSize = `${d.radius * 0.3}px`;
    const percentFontSize = `${d.radius * 0.25}px`;

    return `
      <div class="bubble">
        <div class="relative rounded-full transition-transform hover:scale-105 "
             style="width: ${d.radius * 2}px; height: ${d.radius * 2}px;">
          <!-- Outer border -->
          <div class="absolute inset-0 rounded-full"
               style="border: 3px solid ${colors.border}; background: ${colors.background};">
            <!-- Content background with gradient -->
            <div class="absolute inset-0 rounded-full"
                 style="background: radial-gradient(circle at center, ${colors.gradient}, transparent);">
            </div>
          </div>
          <!-- Content -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer">
            ${d.icon ? `
              <img 
                src="${d.icon}" 
                alt="${d.symbol}" 
                style="width: ${iconSize}; height: ${iconSize}; object-fit: contain; margin-bottom: 2px;"
                loading="lazy"
              />
            ` : ''}
            <span 
              class="text-white font-bold" 
              style="font-size: ${symbolFontSize};"
            >
              ${d.symbol}
            </span>
            <span 
              class="text-white font-semibold" 
              style="font-size: ${percentFontSize};"
            >
              ${d.risk?.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    `;
  };

  // Create handlers for modal
  const handleBubbleClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Helper function to calculate optimal bubble size
  const calculateOptimalBubbleSize = (
    containerWidth: number, 
    containerHeight: number, 
    itemCount: number
  ): { minSize: number; maxSize: number } => {
    // Calculate available area and target bubble area
    const availableArea = containerWidth * containerHeight * 0.7; // Use 70% of space
    const targetBubbleArea = availableArea / (itemCount * 2); // Divide by 2 for spacing
    const baseBubbleSize = Math.sqrt(targetBubbleArea / Math.PI);
    
    // Scale based on container dimensions
    const widthBasedSize = containerWidth * BASE_BUBBLE_RATIO;
    const heightBasedSize = containerHeight * BASE_BUBBLE_RATIO;
    
    // Use the smaller of the calculated sizes
    const optimalSize = Math.min(baseBubbleSize, widthBasedSize, heightBasedSize);
    
    return {
      minSize: Math.max(15, optimalSize * 0.8), // Never smaller than 15px
      maxSize: Math.min(40, optimalSize * 1.2) // Never larger than 40px
    };
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
      x: containerWidth / 2 + (Math.random() - 0.5) * containerWidth * 0.6, // Reduced spread
      y: getRiskBand(d.risk ?? 50),
      radius: Math.max(20, Math.min(30, d.bubbleSize ? d.bubbleSize * 25 : 30)) // Adjusted sizes
    }));

    const simulation = d3.forceSimulation<DataItem>(initializedData)
      .force("x", d3.forceX<DataItem>((d) => {
        const index = initializedData.indexOf(d);
        // Adjust spread only when sidebar is collapsed (full width)
        const spreadMultiplier = isCollapsed ? 0.6 : 0.4; // Increased spread when collapsed
        const spread = containerWidth * spreadMultiplier;
        const offset = (index / initializedData.length - 0.5) * spread;
        return containerWidth / 2 + offset;
      }).strength(0.08))
      .force("y", d3.forceY<DataItem>((d) => getRiskBand(d.risk ?? 50) + 10).strength(0.5)) 
      .force("collide", d3.forceCollide<DataItem>()
        .radius(d => d.radius + 3).strength(0.8)) 
      .force("charge", d3.forceManyBody<DataItem>()
        .strength(-40)) 
      .alphaDecay(0.02) 
      .velocityDecay(0.3);
    simulationRef.current = simulation;

    const bubbles = bubbleContainer.selectAll<HTMLDivElement, DataItem>(".bubble-container")
      .data(initializedData)
      .enter()
      .append("div")
      .attr("class", "bubble-container")
      .style("opacity", isInitialRender ? "0" : "1")
      .html(createBubbleHTML)
      .on("click", handleBubbleClick);

    if (isInitialRender) {
      bubbles.transition()
        .duration(600)
        .style("opacity", "0.95");
      
      setIsInitialRender(false);
    }
    simulation.on("tick", () => {
      bubbles
        .style("left", d => `${Math.max(d.radius, Math.min(containerWidth - d.radius, d.x))}px`)
        .style("top", d => `${Math.max(d.radius, Math.min(CONTAINER_HEIGHT - d.radius, d.y))}px`)
        .style("transform", "translate(-50%, -50%)");
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
      <div className="relative w-full h-full">
        <div className="relative bg-black" style={{ height: CONTAINER_HEIGHT }}>
         
          <div className="absolute left-0 top-0 flex flex-col text-sm text-white"
              style={{ width: '30px', height: `${CONTAINER_HEIGHT-50}px` }}>
            {[100, 80, 60, 40, 20, 0].map(level => (
              <div 
                key={level}
                className="absolute w-full"
                style={{ 
                  top: `${CONTAINER_HEIGHT * (1 - level / 100)}px`,
                  transform: 'translateY(-10%)'
                }}
              >
                <span className="text-xs">{level} -</span>
                {level > 0 && (
                  <div 
                    className="absolute w-[calc(100vw-32px)] h-[1px] left-[30px]" 
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      zIndex: 1
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="absolute left-10 top-2 text-lg font-semibold z-10 text-white">Risk Levels</div>
          <div className="absolute bottom-2 right-10 text-white z-50 font-medium">UNDERVALUED</div>
          <div className="absolute top-2 right-10 text-white z-50 font-medium">OVERVALUED</div>

          <div 
            ref={containerRef}
            className="custom-div ml-7" 
            style={{ 
              position: 'relative',
              height: `${CONTAINER_HEIGHT}px`,
              padding: '40px 0 20px 0' 
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