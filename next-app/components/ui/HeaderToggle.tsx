import React from 'react';
import { FaBars } from 'react-icons/fa';
import { useSidebar } from './Sidebar/Sidebar.context';

const HeaderToggle: React.FC = () => {
  const { toggleCollapse } = useSidebar();

  return (
    <button
      onClick={toggleCollapse}
      className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700"
      aria-label="Toggle Sidebar"
    >
      <FaBars size={20} />
    </button>
  );
};

export default HeaderToggle;
