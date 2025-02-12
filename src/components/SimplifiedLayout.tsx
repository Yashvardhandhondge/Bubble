import React, { useState } from 'react';
import { PanelToggleIcon } from './icons/PanelToggleIcon';

interface SimplifiedLayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

const SimplifiedLayout: React.FC<SimplifiedLayoutProps> = ({ children, rightPanel }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Separator Line */}
      <div className="w-[3px] bg-[#8A8A8A]/30" />

      {/* Right Panel */}
      <div 
        className={`relative transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0' : 'w-[340px]'
        } flex flex-col`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-6 top-20 text-xl p-1.5   
            text-gray-400 "
        >
          <PanelToggleIcon isCollapsed={isCollapsed} />
        </button>

        <div className="flex-1 h-full max-w-full overflow-hidden">
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLayout;