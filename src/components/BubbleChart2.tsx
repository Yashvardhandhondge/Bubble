import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import { useFavorites } from '../context/FavoritesContext';
import './bubble.css';

import Modal from './Modal';
import TokenWidget from './TokenWidget';


const CONTAINER_HEIGHT = window.innerHeight * 0.78; // Adjusted to 85% of viewport height
const PADDING_TOP = 74;
const PADDING_BOTTOM = 60;
const EFFECTIVE_HEIGHT = CONTAINER_HEIGHT - (PADDING_TOP + PADDING_BOTTOM); // Reduced padding to extend chart
const BUBBLE_MIN_SIZE = 15; // Increased from 15
const BUBBLE_MAX_SIZE = 25; // Increased from 25
const BUBBLE_PADDING = 2; 


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
  const { favorites, showOnlyFavorites } = useFavorites();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<DataItem, undefined> | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showWidget, setShowWidget] = useState(false); // State to conditionally render Wget
  const [selectedBubble, setSelectedBubble] = useState<DataItem | null>(null);

  // Debug filtered data
  useEffect(() => {
    // console.log("Filtered data updated:", filteredData.length, filteredData[0]);
  }, [filteredData]);

  // Dynamic container width adjustment
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      // Use clientWidth or fallback to window.innerWidth minus paddings:
      const newWidth = containerRef.current.clientWidth || (window.innerWidth - (isCollapsed ? 24 : 48));
      setContainerWidth(newWidth);
    }
  }, [isCollapsed]);

  useEffect(() => {
    updateContainerWidth();
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [updateContainerWidth]);

  // Replace getRiskBand with a band-based approach
  function getRiskBand(risk: number) {
    // Default to 50 if risk is NaN, null or undefined
    const safeRisk = (risk === null || risk === undefined || isNaN(risk)) ? 50 : risk;
    
    // Ensure risk is between 10 and 100
    const clampedRisk = Math.max(10, Math.min(100, safeRisk));
    
    // For example, 90-100 at top, 80-89 below, etc.
    if (clampedRisk >= 90) {
      return PADDING_TOP + EFFECTIVE_HEIGHT * 0.21;
    } else if (clampedRisk >= 80) {
      return PADDING_TOP + EFFECTIVE_HEIGHT * 0.34;
    } else if (clampedRisk >= 70) {
      return PADDING_TOP + EFFECTIVE_HEIGHT * 0.44;
    } else if (clampedRisk >= 60) {
      return PADDING_TOP + EFFECTIVE_HEIGHT * 0.56;
    }
    return PADDING_TOP + EFFECTIVE_HEIGHT * 0.7;
  }

  // Filter and process data
  const rangeFilteredData = useMemo<DataItem[]>(() => {
    if (!filteredData?.length) {
      // console.log('No filtered data available');
      return [];
    }
    
    const [start, end] = selectedRange !== "Top 100" 
      ? selectedRange.split(" - ").map(n => parseInt(n))
      : [1, 100];

    // console.log(`Processing range ${start}-${end} from ${filteredData.length} items`);
    
    // First apply the base filtering
    let dataToProcess = filteredData.slice(start - 1, end);
    
    // Then apply favorites filter if needed
    if (showOnlyFavorites) {
      dataToProcess = dataToProcess.filter(item => 
        item.symbol && favorites.includes(item.symbol)
      );
    }
    
    const slicedData = dataToProcess.map(item => {
      // Use safeBubbleSize: if item.bubbleSize is invalid, assign random default.
      const safeBubbleSize = (item.bubbleSize !== null && !isNaN(Number(item.bubbleSize)))
        ? Number(item.bubbleSize)
        : Math.random() * 0.5 + 0.5;
      return {
        ...item,
        risk: (item.risk !== null && !isNaN(Number(item.risk))) ? Number(item.risk) : 50,
        // Calculate radius using safeBubbleSize (multiplier kept as 35)
        radius: Math.max(
          BUBBLE_MIN_SIZE,
          Math.min(BUBBLE_MAX_SIZE, safeBubbleSize * 35)
        ),
        x: containerWidth / 2 + (Math.random() - 0.5) * 100,
        y: getRiskBand((item.risk !== null && !isNaN(Number(item.risk)))
              ? Number(item.risk)
              : 50)
      };
    });
      
    // console.log(`Processed ${slicedData.length} items for display`);
    // Validate data for any NaN
    const nanItems = slicedData.filter(item => 
      isNaN(item.x) || isNaN(item.y) || isNaN(item.radius));
    if (nanItems.length > 0) {
      console.error("Found items with NaN position/size:", nanItems.length);
    }
    
    return slicedData;
  }, [filteredData, selectedRange, containerWidth, showOnlyFavorites, favorites]);

  // Replace the previous calculateBubbleColor function with the following:
  const calculateBubbleColor = (risk: number, isFavorite: boolean) => {
    // Default to 50 if risk is NaN, null or undefined
    const safeRisk = (risk === null || risk === undefined || isNaN(risk)) ? 50 : risk;
    
    const clampedRisk = Math.max(10, Math.min(100, safeRisk));
    const t = (clampedRisk - 10) / 90; // normalize risk between 0 and 1
    
    // If it's a favorite, use gold colors
    if (isFavorite) {
      return {
        border: "rgba(255, 215, 0, 0.95)", // Gold border
        background: "rgba(255, 215, 0, 0.35)", // Light gold background
        gradient: "rgba(255, 215, 0, 0.6)" // Gold gradient
      };
    }
    
    // Otherwise use the regular color scale
    const borderColor = d3.interpolateRgb("rgba(30,255,30,0.9)", "rgba(255,0,0,0.95)")(t);
    const backgroundColor = d3.interpolateRgb("rgba(30,255,30,0.35)", "rgba(255,0,0,0.4)")(t);
    const gradientColor = d3.interpolateRgb("rgba(30,255,30,0.5)", "rgba(255,0,0,0.6)")(t);
    
    return {
      border: borderColor,
      background: backgroundColor,
      gradient: gradientColor
    };
  };

  // Update createBubbleHTML to enhance text visibility
  const createBubbleHTML = (d: DataItem) => {
    const safeRisk = (d.risk === null || d.risk === undefined || isNaN(Number(d.risk))) ? 50 : Number(d.risk);
    const isFav = d.symbol ? favorites.includes(d.symbol) : false;
    const colors = calculateBubbleColor(safeRisk, isFav);
    const iconSize = `${d.radius * 0.6}px`;
    const symbolFontSize = `${d.radius * 0.40}px`; // Slightly larger
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
              ${
              d.icon
                ? `<img 
                    src="${d.icon}" 
                    alt="${d.symbol}" 
                    style="width: ${iconSize}; height: ${iconSize}; object-fit: contain; margin-bottom: 4px;"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='/deafult.png';"
                  />`
                : `<img 
                    src="/deafult.png" 
                    alt="${d.symbol}" 
                    style="width: ${iconSize}; height: ${iconSize}; object-fit: contain; margin-bottom: 4px;"
                    loading="lazy"
                  />`
            }
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
              ${safeRisk.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    `;
  };


  const handleBubbleClick = (d: DataItem) => {
    setSelectedBubble(d);
    // onBubbleClick(d);
  };

  const handleCloseWidget = () => {
    setSelectedBubble(null);
  };

  useEffect(() => {
    if (!containerRef.current || !rangeFilteredData.length || !containerWidth) {
      console.warn("Missing container width or data", containerWidth, rangeFilteredData.length);
      return;
    }
    
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    // Append bubble container
    const bubbleContainer = container
      .append("div")
      .attr("class", "bubbles-wrapper");

    // Check the data for any NaN values before using it
    const validData = rangeFilteredData.map(d => {
      // Ensure all required properties are valid numbers
      return {
        ...d,
        x: isNaN(d.x) ? containerWidth / 2 : d.x,
        y: isNaN(d.y) ? CONTAINER_HEIGHT / 2 : d.y,
        radius: isNaN(d.radius) ? BUBBLE_MIN_SIZE : d.radius
      };
    });

    // console.log(`Rendering ${validData.length} bubbles`);

    const calculateStrength = () => {
      const baseStrength = isCollapsed ? 0.07 : 0.12;
      const widthFactor = Math.max(0.5, Math.min(1.5, containerWidth / 1000));
      const dynamicStrength = baseStrength * (1 / widthFactor);
      return Math.min(0.15, Math.max(0.05, dynamicStrength));
    };

    const simulation = d3.forceSimulation<DataItem>(validData)
      .force("x", d3.forceX<DataItem>((d) => {
        const safeRisk = (d.risk === null || d.risk === undefined || isNaN(Number(d.risk))) ? 50 : Number(d.risk);
        const bandOffset = (safeRisk % 10) / 10;
        const spread = containerWidth * 0.07; // Reduced spread
        return containerWidth / 2 + (bandOffset - 0.2) * spread + containerWidth * 0.02;
      }).strength(calculateStrength())) // Dynamic strength based on chart width
      .force("y", d3.forceY<DataItem>((d) => {
        const safeRisk = (d.risk === null || d.risk === undefined || isNaN(Number(d.risk))) ? 50 : Number(d.risk);
        return getRiskBand(safeRisk);
      }).strength(1))
      .force("collide", d3.forceCollide<DataItem>()
        .radius(d => d.radius + BUBBLE_PADDING)
        .strength(1))
      .force("charge", d3.forceManyBody<DataItem>()
        .strength(d => -Math.pow(d.radius, 2) * 0.3))
      // Lower the alphaDecay for a longer simulation period
      .alphaDecay(0.01)
      .velocityDecay(0.3);
    
    simulationRef.current = simulation;

    const bubbles = bubbleContainer.selectAll<HTMLDivElement, DataItem>(".bubble-container")
      .data(validData)
      .enter()
      .append("div")
      .attr("class", "bubble-container")
      .style("opacity", "0")
      .html(createBubbleHTML)
      .on("click", (event, d) => handleBubbleClick(d));

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
        .style("position", "absolute"); 
    });

    return () => {
      simulation.stop();
    };
  }, [rangeFilteredData, containerWidth, onBubbleClick, selectedRange, isCollapsed, favorites]);

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
        <p className="text-white">
          {showOnlyFavorites && rangeFilteredData.length === 0 
            ? "No favorites found. Add some by clicking the star icon in a token's details." 
            : "No data available for the selected filters"}
        </p>
      </div>
    );
  }
  
  // Create grid lines with equal spacing
  const gridLines = [
    { range: '90', position: 0 },    // 90% risk
    { range: '70', position: 25 },   // 70% risk
    { range: '50', position: 50 },   // 50% risk
    { range: '30', position: 75 },   // 30% risk
    { range: '10', position: 100 }   // 10% risk (bottom)
  ];

  return (
    <>
      <div className="relative w-full overflow-visible" style={{ 
        height: CONTAINER_HEIGHT,
        maxHeight: '900px' // Changed from 800px to allow full viewport height
      }}>
        <div className="relative bg-black h-full overflow-visible rounded-xl">
          {/* Update Grid lines positions */}
          <div 
            className="absolute top-0 flex flex-col text-sm text-white h-full" 
            style={{ 
              zIndex: 1, 
              left: '-10px' // shift entire grid container to left
            }}
          >
            {gridLines.map(({ range, position }) => (
              <div 
                key={range}
                className="absolute w-full"
                style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
              >
                <span 
                  className="text-xs whitespace-nowrap" 
                  style={{ marginLeft: "-10px" }} // move tick label further left
                >
                  {range} -
                </span>
                <div 
                  className="absolute h-[1px]" 
                  style={{
                    left: "15px", // tick line starting position shifted to left
                    width: "calc(100% - 15px)",
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
          <div className="absolute bottom-0 right-0 text-white font-medium p-2" style={{ zIndex: 2 }}>
            UNDERVALUED
          </div>
          <div className="absolute top-0 right-0 text-white font-medium p-2" style={{ zIndex: 2 }}>
            OVERVALUED
          </div>

          {/* Bubble container */}
          <div 
            ref={containerRef}
            className="custom-div ml-3" // shifted left: changed from ml-7 to ml-3
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
      {selectedBubble && (
        <TokenWidget 
          tokenData={selectedBubble} 
          onClose={handleCloseWidget}
        />
      )}
    </>
  );
}

export default BubbleChart;