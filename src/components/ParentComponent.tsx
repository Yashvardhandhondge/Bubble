import React, { useState } from 'react';
import Sidebar from './Sidebar';

const ParentComponent = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div>
      <button onClick={() => setIsCollapsed(!isCollapsed)}>
        Toggle Sidebar
      </button>
      <Sidebar isCollapsed={isCollapsed} />
    </div>
  );
};

export default ParentComponent;