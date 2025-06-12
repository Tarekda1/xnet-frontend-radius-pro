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

const Sidebar: React.FC = () => {
  const {
    isCollapsed,
    isMobileMenuOpen,
    toggleCollapse,
    toggleMobileMenu,
    setMobileMenuOpen,
  } = useSidebar();
  const isMobile = useIsMobile();

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
    <div className="flex items-center p-4">
      {/* Show toggle button only on desktop */}
      {isMobile === false && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          className={`text-gray-300 hover:text-white focus:outline-none transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'
            }`}
          aria-label="Toggle Sidebar"
        >
          <FaBars size={20} />
        </button>
      )}
      <span
        className={`ml-3 text-lg font-semibold whitespace-nowrap transition-opacity duration-300 ${!isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100 w-auto'
          }`}
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
        isAdmin: true, // Set this to false if all users should see it
      },
      { to: '/profiles/list', label: 'Profiles', icon: FaCreditCard },
      { to: '/nas', label: 'NAS', icon: FaServer }, // Add this new line for NAS

      //{ to: '/reports', label: 'Reports', icon: FaChartLine },
      // { to: '/payments', label: 'Payments', icon: FaCreditCard },
      { to: '/settings', label: 'Settings', icon: FaCogs },
      //{ to: '/support', label: 'Help/Support', icon: FaLifeRing },
    ];

    return (
      <nav className="flex-grow">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 space-x-3 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-600'
              }`
            }
            onClick={() => isMobile && setMobileMenuOpen(false)}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span
              className={`whitespace-nowrap transition-all duration-300 ${!isMobile && isCollapsed
                ? 'w-0 overflow-hidden opacity-0'
                : 'w-auto opacity-100'
                }`}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    );
  };

  const SidebarFooter = () => (
    <div className="p-4 mt-auto">
      {!isCollapsed && !isMobile && (
        <p className="text-sm text-gray-400">
          © 2024 MyApp. All rights reserved.
        </p>
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
        className={`z-1000 fixed xs:mt-[20px] sm:mt-[0px] h-screen bg-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col z-40 ${isMobile
          ? isMobileMenuOpen
            ? 'left-0 w-64 shadow-2xl'
            : '-left-full'
          : isCollapsed
            ? 'w-20'
            : 'w-64'
          } md:relative`}
      >
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </div>
    </>
  );
};

export default Sidebar;
