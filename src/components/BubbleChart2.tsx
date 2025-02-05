import { useEffect, useMemo, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import './bubble.css';

interface BitcoinRiskChartProps {
  onBubbleClick: (crypto: any) => void;
  selectedRange: string;
  isCollapsed?: boolean;
}

const CONTAINER_HEIGHT = 600;
const CONTAINER_WIDTH = 1100;

export default function BitcoinRiskChart({ onBubbleClick, selectedRange, isCollapsed }: BitcoinRiskChartProps) {
  const { filteredData, loading, error } = useData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(CONTAINER_WIDTH);
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);

  // Handle container width updates
  useEffect(() => {
    const updateWidth = () => {
      console.log("Filtwered Data", filteredData);
      
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth - (isCollapsed ? 24 : 48);
        setContainerWidth(newWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed]);

  const rangeFilteredData = useMemo(() => {
    // If no data or loading, return empty array
    if (!filteredData.length) return [];

    let start = 0;
    let end = 100;

    if (selectedRange !== "Top 100") {
      const [startStr, endStr] = selectedRange.split(" - ");
      start = parseInt(startStr) - 1;
      end = parseInt(endStr);
    }

    return filteredData.slice(Math.max(0, start), Math.min(filteredData.length, end));
  }, [filteredData, selectedRange]);

  const calculateBubbleColor = (risk: number) => {
    if (risk >= 50 && risk <= 55) return 'hsl(0, 0%, 10%)'; // Grey for 50-55
    
    if (risk < 50) {
      // Green gradient: 0 (dark green) -> 50 (light green)
      const intensity = (risk / 50) * 100;
      return `hsl(${120 - (intensity * 0.5)}, ${70 - (intensity * 0.3)}%, ${30 + (intensity * 0.4)}%)`;
    }
    
    // Red gradient: 55 (light red) -> 100 (dark red)
    const intensity = ((risk - 55) / 45) * 100;
    return `hsl(0, ${50 + (intensity * 0.5)}%, ${50 - (intensity * 0.3)}%)`;
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

  // Initialize and update simulation
  useEffect(() => {
    if (!containerRef.current || !rangeFilteredData.length || !containerWidth) {
      // Clear existing visualization if no data
      if (containerRef.current) {
        const container = d3.select(containerRef.current);
        container.selectAll("*").remove();
      }
      return;
    }

    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const bubbleContainer = container
      .append("div")
      .attr("class", "bubbles-wrapper")
      .style("position", "absolute")
      .style("inset", "0")
      .style("overflow", "visible")
      .style("pointer-events", "none");

    const initializedData = rangeFilteredData.map(d => ({
      ...d,
      x: containerWidth / 2 + (Math.random() - 0.5) * containerWidth * 0.6, // Reduced spread from 0.8 to 0.6
      y: getRiskBand(d.risk || 0),
      radius: Math.max(20, Math.min(30, d.bubbleSize ? d.bubbleSize * 25 : 30)) // Increased sizes
    }));

    const simulation = d3.forceSimulation<any>(initializedData)
      .force("x", d3.forceX(d => {
        const index = initializedData.indexOf(d as any);
        const spread = containerWidth * 0.4; // Reduced spread from 0.8 to 0.6
        const offset = (index / initializedData.length - 0.5) * spread;
        return containerWidth / 2 + offset;
      }).strength(0.08)) // Slightly increased strength for better positioning
      //@ts-ignore
      .force("y", d3.forceY(d => getRiskBand(d.risk || 50)).strength(0.5))
      //@ts-ignore
      .force("collide", d3.forceCollide().radius(d => d.radius + 3).strength(0.8))
      .force("charge", d3.forceManyBody().strength(-40)) // Reduced repulsion slightly
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    simulationRef.current = simulation;

    
    const bubbles = bubbleContainer.selectAll(".bubble-container")
      .data(initializedData)
      .enter()
      .append("div")
      .attr("class", "bubble-container")
      .style("position", "absolute")
      .style("transform-origin", "center")  // Add this line
      .style("pointer-events", "auto")
      .style("opacity", "0") // Start with opacity 0
      .html(d => `
        <div class="bubble">
          <div class="rounded-full bg-black/20 backdrop-blur-sm shadow-lg transition-transform hover:scale-105"
               style="width: ${d.radius * 2}px; height: ${d.radius * 2}px;  background-color: ${calculateBubbleColor(d.risk)}">  
            <div class="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center group cursor-pointer">
            ${d.icon ? `<img src="${d.icon}" alt="${d.symbol}" class="w-1/3 h-1/3 object-contain mb-1" loading="lazy" />` : ''}
            <span class="text-xs font-medium text-white">${d.symbol}</span>
            <span class="text-xs font-bold text-white">${d.risk?.toFixed(1)}%</span>
          </div>
        </div>
      `)
      .on("click", (_, d) => onBubbleClick(d));

    // Fade in bubbles
    bubbles.transition()
      .duration(500)
      .style("opacity", "0.9");

    // Update the tick function to add bounds checking
    simulation.on("tick", () => {
      bubbles
        .style("left", d => `${Math.max(d.radius, Math.min(containerWidth - d.radius, d.x))}px`)
        .style("top", d => `${Math.max(d.radius, Math.min(CONTAINER_HEIGHT - d.radius, d.y))}px`)
        .style("transform", d => `translate(-50%, -50%)`);
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [rangeFilteredData, containerWidth, onBubbleClick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Add check for empty data
  if (!loading && (!filteredData.length || !rangeFilteredData.length)) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-white">No data available for the selected filters</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4">
        <p className="text-red-600">Error loading data: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-100 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
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

        <div className="absolute left-10 top-2 text-lg font-semibold z-10  text-white">Risk Levels</div>
        <div className="absolute bottom-2 right-10 text-white z-50  font-medium">UNDERVALUED</div>
        <div className="absolute top-2 right-10 text-white z-50 font-medium">OVERVALUED</div>

        <div 
          ref={containerRef}
          className="custom-div ml-7" 
          style={{ 
            position: 'relative',
            height: `${CONTAINER_HEIGHT}px`,
            padding: '20px 0'
          }}
        />
      </div>
    </div>
  );
}