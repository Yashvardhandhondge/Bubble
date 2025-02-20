import React, { useState, useRef, useEffect } from 'react';

const SettingsPanel: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState("Top 100");
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rangeOptions = [
    "Top 100",
    "101 - 200",
    "201 - 300",
    "301 - 400",
  ];

  // Sample list of agents; filter out the one we don't need.
  const agents = [
    "agent1",
    "agent2",
    "binanace btcc ai-agent",
    "agent3"
  ];
  const filteredAgents = agents.filter(a => a.toLowerCase() !== "binanace btcc ai-agent");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRangeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-white font-bold mb-2">Settings Panel</h2>
      {/* Range Filter Dropdown */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowRangeDropdown(!showRangeDropdown)}
          // Added h-10 class for a fixed height
          className="flex items-center gap-1 px-2 py-1 h-10 bg-black text-white rounded"
        >
          <span>{selectedRange}</span>
        </button>
        {showRangeDropdown && (
          <div ref={dropdownRef} className="absolute mt-1 w-32 bg-black border border-white rounded shadow-lg">
            {rangeOptions.map((range, index) => (
              <div
                key={index}
                onClick={() => { setSelectedRange(range); setShowRangeDropdown(false); }}
                className="px-3 py-1 hover:bg-gray-800 cursor-pointer text-white text-sm"
              >
                {range}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agents List */}
      <div className="mt-4">
        <h3 className="text-white font-semibold mb-2">Agents</h3>
        <ul>
          {filteredAgents.map((agent, index) => (
            <li key={index} className="text-gray-300">
              {agent}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SettingsPanel;
