import React, { useState } from 'react';
import Sidebar from './ui/Sidebar/Sidebar';
import Navbar from './ui/Navbar';
import Breadcrumb from '../components/ui/Breadcrumbs';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom';

interface DashboardLayoutProps {
  childre?: React.ReactNode;
}

const Layout: React.FC<DashboardLayoutProps> = ({ }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div
      className={`grid-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      {/* isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-col flex-grow overflow-y-auto bg-gray-100 p-6 mb-[15px] px-8 main-content">
        {/* Breadcrumb */}
        <Breadcrumb />
        {/* Page Content */}
        <Outlet/>
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default Layout;
