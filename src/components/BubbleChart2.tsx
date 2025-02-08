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
  const { filteredData, loading, error } = useData();
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
  }, [filteredData, selectedRange]);

  // Calculate bubble colors based on risk level
  const calculateBubbleColor = (risk: number) => {
    if (risk > 50) {
      // Red theme for overvalued
      return {
        border: 'rgba(255, 0, 0, 0.8)',
        background: 'rgba(255, 0, 0, 0.2)',
        gradient: 'rgba(255, 0, 0, 0.3)'
      };
    } else {
      // Green theme for undervalued
      return {
        border: 'rgba(0, 255, 0, 0.8)',
        background: 'rgba(0, 255, 0, 0.2)',
        gradient: 'rgba(0, 255, 0, 0.3)'
      };
    }
  };

  // Calculate vertical position based on risk level
  const getRiskBand = (risk:any) => {
    const padding = CONTAINER_HEIGHT * 0.05;
    const normalizedRisk = Math.max(0, Math.min(100, risk));
    return CONTAINER_HEIGHT * (1 - normalizedRisk / 100) * 0.8 + padding;
  };

  // Create bubble HTML with dynamic sizing
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
      x: containerWidth / 2 + (Math.random() - 0.5) * containerWidth * 0.5,
      y: getRiskBand(d.risk ?? 50),
      radius: Math.max(MIN_BUBBLE_SIZE, 
        Math.min(MAX_BUBBLE_SIZE, (d.bubbleSize ?? 1) * 30))
    }));

    const simulation = d3.forceSimulation<DataItem>(initializedData)
      .force("x", d3.forceX<DataItem>((d) => {
        const index = initializedData.indexOf(d);
        const spread = containerWidth * 0.35;
        return containerWidth / 2 + (index / initializedData.length - 0.5) * spread;
      }).strength(0.1))
      .force("y", d3.forceY<DataItem>((d) => getRiskBand(d.risk ?? 50)).strength(0.6))
      .force("collide", d3.forceCollide<DataItem>().radius(d => d.radius + BUBBLE_PADDING).strength(0.85))
      .force("charge", d3.forceManyBody<DataItem>().strength(-35))
      .alphaDecay(0.018)
      .velocityDecay(0.35);
    simulationRef.current = simulation;

    const bubbles = bubbleContainer.selectAll<HTMLDivElement, DataItem>(".bubble-container")
      .data(initializedData)
      .enter()
      .append("div")
      .attr("class", "bubble-container")
      .style("opacity", isInitialRender ? "0" : "1")
      .html(createBubbleHTML)
      .on("click", handleBubbleClick);

    // Fade in animation only for initial render
    if (isInitialRender) {
      bubbles.transition()
        .duration(600)
        .style("opacity", "0.95");
      
      setIsInitialRender(false);
    }

    // Update positions on simulation tick
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

  // Conditionally render the Wget component or the chart
  if (showWidget) {
    return <Wget />;
  }

  return (
    <>
      <div className="relative w-full h-full">
        <div className="relative bg-black" style={{ height: CONTAINER_HEIGHT }}>
          {/* Risk level labels */}
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
              padding: '40px 0 20px 0' // Added top padding of 40px
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