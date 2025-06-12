import { useRef, useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { FaBars, FaTimes, FaBell } from 'react-icons/fa';
import { useInvoiceNotifications } from '@/hooks/useInvoiceNotifications';
import { NotificationPopup } from './NotificationPopup';
import { UserMenu } from './UserMenu';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string; role: string } | null>(null);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notifications = useInvoiceNotifications();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('read_notifications');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const unreadCount = notifications.filter(n => !readNotifications.has(n.timestamp)).length;

  const markAsRead = (timestamp: string) => {
    setReadNotifications(prev => {
      const newSet = new Set([...prev, timestamp]);
      localStorage.setItem('read_notifications', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const markAllAsRead = () => {
    const allTimestamps = notifications.map(n => n.timestamp);
    setReadNotifications(prev => {
      const newSet = new Set([...prev, ...allTimestamps]);
      localStorage.setItem('read_notifications', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (parentRef.current && !parentRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get(`/auth/profile`);
      setUserInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const getUserInitials = () => {
    if (userInfo && userInfo.username) {
      return userInfo.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      {/* Left Side */}
      <div className="flex items-center pl-2 sm:pl-4 md:pl-8 lg:pl-16">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white hidden sm:block truncate">
          Dashboard
        </h1>
        <span className="sm:hidden text-gray-800 dark:text-white text-sm sm:text-base truncate">
          Xnet Billing
        </span>
      </div>

      {/* Right Side Controls */}
      <div className="relative" ref={parentRef}>
        {/* Mobile Menu Button */}
        <button
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes className="text-gray-600 dark:text-gray-300" /> : <FaBars className="text-gray-600 dark:text-gray-300" />}
        </button>

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              aria-label="Notifications"
            >
              <FaBell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            <NotificationPopup
              isOpen={isNotificationOpen}
              notifications={notifications}
              readNotifications={readNotifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onViewAll={() => navigate('/notifications')}
            />
          </div>

          {/* Dark Mode Toggle */}
          <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <DarkModeToggle className="w-6 h-6" />
          </div>

          {/* User Avatar */}
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm md:text-base font-medium text-white">
              {getUserInitials()}
            </span>
          </div>
        </div>

        <UserMenu
          isOpen={isMenuOpen}
          userInfo={userInfo}
          onLogout={handleLogout}
          onNavigate={navigate}
          getUserInitials={getUserInitials}
        />
      </div>
    </nav>
  );
};

export default Navbar;
