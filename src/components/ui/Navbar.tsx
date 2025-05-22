import { useEffect, useRef, useState } from 'react';
import NotificationButton from './NotificationButton';
import DarkModeToggle from './DarkModeToggle';
import { CSSTransition } from 'react-transition-group';
import { useAuth } from '@/context/AuthContext';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { FaEnvelope, FaUser, FaUserTag } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string; role: string } | null>(null);
  const { isAuthenticated, logout,user } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       parentRef.current &&
  //       !parentRef.current.contains(event.target as Node)
  //     ) {
  //       console.log(`outside ismenu :${isMenuOpen}`);
  //       setIsMenuOpen(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);

    // Close Popup on Outside Click
    const handleClickOutside = (event: MouseEvent) => {
      if (parentRef.current && !parentRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

  const fetchUserInfo = async () => {
    try {
      console.log(JSON.stringify(user));
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

  const togglePopup = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="navbar dark:bg-gray-600 shadow-sm p-4 flex justify-between items-center">
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
      <div className="relative">
        {/* Hamburger Icon for Mobile */}
        <button
          className="sm:hidden w-8 h-8 bg-gray-300 rounded-full"
          onClick={togglePopup}
        >
          ☰
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <CSSTransition
            in={isMenuOpen}
            timeout={300}
            ref={parentRef}
            classNames={{
              enter: "transition-opacity ease-out duration-300",
              enterFrom: "opacity-0",
              enterTo: "opacity-100",
              leave: "transition-opacity ease-in duration-300",
              leaveFrom: "opacity-100",
              leaveTo: "opacity-0",
            }}
            unmountOnExit
          >
            <div
              className="absolute top-full right-4 mt-2 bg-white dark:bg-gray-800 shadow-xl rounded-md p-4 w-64 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out"
            >
              {/* User Info */}
              {userInfo && (
                <div className="mb-4 text-sm text-gray-800 dark:text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      {getUserInitials()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <FaUser className="mr-2 text-blue-500" />
                      <span className="font-semibold">{userInfo.username}</span>
                    </p>
                    <p className="flex items-center">
                      <FaEnvelope className="mr-2 text-blue-500" />
                      <span>{userInfo.email}</span>
                    </p>
                    <p className="flex items-center">
                      <FaUserTag className="mr-2 text-blue-500" />
                      <span className="capitalize">{userInfo.role}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                  <DarkModeToggle className="w-10 h-6" />
                </div>

                {/* Logout Button */}
                <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white">
                  Logout
                </Button>
              </div>
            </div>
          </CSSTransition>
        )}

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
          <NotificationButton className="w-8 h-8 sm:w-10 sm:h-10" />
          <DarkModeToggle className="w-8 h-8 sm:w-10 sm:h-10" />
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-600 relative overflow-hidden cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm md:text-base font-medium text-gray-600 dark:text-gray-300">
              {getUserInitials()}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
