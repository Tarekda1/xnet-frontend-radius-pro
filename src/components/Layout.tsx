import React, { useState } from 'react';
import Sidebar from './ui/Sidebar/Sidebar';
import Navbar from './ui/Navbar';
import Breadcrumb from '../components/ui/Breadcrumbs';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  childre?: React.ReactNode;
}

const Layout: React.FC<DashboardLayoutProps> = ({ }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex h-[calc(100vh-64px)]"> {/* 64px is the navbar height */}
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-gray-100",
          "transition-all duration-300 ease-in-out",
          "p-6 mb-[15px] px-8"
        )}>
          {/* Breadcrumb */}
          <Breadcrumb />
          {/* Page Content */}
          <Outlet/>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default Layout;
