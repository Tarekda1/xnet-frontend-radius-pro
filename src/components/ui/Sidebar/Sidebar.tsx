// Sidebar.tsx
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaCogs,
  FaUsers,
  FaChartLine,
  FaCreditCard,
  FaLifeRing,
  FaDashcube,
  FaHome,
  FaUserClock,
  FaServer,
  FaUserShield,
} from 'react-icons/fa';
import { useSidebar } from './Sidebar.context';
import { useIsMobile } from '../../../hooks/use-mobile';
import { Button } from '../button';
import { FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const {
    isCollapsed,
    isMobileMenuOpen,
    toggleCollapse,
    toggleMobileMenu,
    setMobileMenuOpen,
    setIsCollapsed,
  } = useSidebar();
  const isMobile = useIsMobile();

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCollapsed]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (isMobile && isMobileMenuOpen && sidebar && !sidebar.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen, setMobileMenuOpen]);

  // Internal helper components
  const SidebarHeader = () => (
    <div className="flex items-center p-4 border-b border-gray-700/50">
      {/* Show toggle button only on desktop */}
      {isMobile === false && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          className={cn(
            "text-gray-300 hover:text-white focus:outline-none transition-all duration-300",
            "p-2 rounded-lg hover:bg-gray-700/50",
            isCollapsed ? '' : 'rotate-180'
          )}
          aria-label="Toggle Sidebar"
        >
          <FaBars size={20} />
        </button>
      )}
      <span
        className={cn(
          "ml-3 text-lg font-semibold whitespace-nowrap transition-all duration-300",
          "bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent",
          !isMobile && isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'
        )}
      >
        Xnet Billing
      </span>
    </div>
  );

  const SidebarContent = () => {
    const navItems = [
      { to: '/', label: 'Home', icon: FaHome },
      { to: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
      { to: '/auth-users', label: 'Auth Users', icon: FaUserShield },
      { to: '/users/list', label: 'Users', icon: FaUsers },
      { to: '/online-users', label: 'Online Users', icon: FaUserClock },
      {
        label: 'Upload Invoice',
        icon: Upload,
        to: '/invoice-upload',
      },
      {
        label: "External Invoices",
        to: "/external-invoices",
        icon: FileText,
        isAdmin: true,
      },
      { to: '/profiles/list', label: 'Profiles', icon: FaCreditCard },
      { to: '/nas', label: 'NAS', icon: FaServer },
      { to: '/settings', label: 'Settings', icon: FaCogs },
    ];

    return (
      <nav className="flex-grow py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 space-x-3 transition-all duration-200",
                "hover:bg-gray-700/50 rounded-lg mx-2",
                "group relative",
                isActive 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "text-gray-300 hover:text-white"
              )
            }
            onClick={() => isMobile && setMobileMenuOpen(false)}
          >
            <Icon 
              size={20} 
              className={cn(
                "flex-shrink-0 transition-transform duration-200",
                "group-hover:scale-110"
              )} 
            />
            <span
              className={cn(
                "whitespace-nowrap transition-all duration-300",
                !isMobile && isCollapsed
                  ? 'w-0 overflow-hidden opacity-0'
                  : 'w-auto opacity-100'
              )}
            >
              {label}
            </span>
            {!isMobile && isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 rounded-md text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    );
  };

  const SidebarFooter = () => (
    <div className="p-4 mt-auto border-t border-gray-700/50">
      {!isCollapsed && !isMobile && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            © 2024 Xnet Billing
          </p>
          <p className="text-xs text-gray-500">
            All rights reserved
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile === true && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            toggleMobileMenu();
          }}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white shadow-lg hover:bg-gray-700 transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </Button>
      )}

      {/* Sidebar Container */}
      <div
        id="sidebar"
        className={cn(
          "h-screen bg-gray-800 text-white",
          "transition-all duration-300 ease-in-out flex flex-col",
          "border-r border-gray-700/50",
          // Mobile styles
          isMobile && "fixed z-40",
          isMobile && (isMobileMenuOpen ? 'left-0 w-64 shadow-2xl' : '-left-full'),
          // Desktop styles
          !isMobile && "sticky top-0",
          !isMobile && (isCollapsed ? 'w-20' : 'w-64')
        )}
      >
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </div>
    </>
  );
};

export default Sidebar;
