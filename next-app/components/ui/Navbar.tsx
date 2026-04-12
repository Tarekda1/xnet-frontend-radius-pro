import { useRef, useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/api/client';
import { FaBars, FaTimes, FaBell } from 'react-icons/fa';
import { useNotificationInboxStore } from '@/store/notificationInboxStore';
import { NotificationPopup } from './NotificationPopup';
import { UserMenu } from './UserMenu';
import HeaderAlertWidget from './HeaderAlertWidget';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string; role: string } | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notifications = useNotificationInboxStore((s) => s.items);
  const markReadInbox = useNotificationInboxStore((s) => s.markRead);
  const markAllReadInbox = useNotificationInboxStore((s) => s.markAllRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    markReadInbox(id);
  };

  const markAllAsRead = () => {
    markAllReadInbox();
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
    router.replace("/login");
  };

  const navigate = (path: string) => {
    router.push(path);
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
    <nav
      className="navbar z-50 flex items-center justify-between border-b border-border/80 bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sm:px-4 md:px-8 lg:px-10"
      role="navigation"
      aria-label="Primary"
    >
      {/* Left Side */}
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="hidden truncate text-lg font-semibold tracking-tight text-foreground sm:block sm:text-xl md:text-2xl">
          Dashboard
        </h1>
        <span className="truncate text-sm font-semibold tracking-tight text-foreground sm:hidden">
          Xnet Billing
        </span>
      </div>

      {/* Right Side Controls */}
      <div className="relative flex items-center gap-2" ref={parentRef}>
        <DarkModeToggle compact className="sm:hidden" />
        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
        </button>

        {/* Desktop Controls */}
        <div className="hidden items-center gap-1 sm:flex sm:gap-2">
          {/* Alert Widget */}
          <HeaderAlertWidget />
          
          {/* Notification Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Notifications"
            >
              <FaBell className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[1.125rem] rounded-full bg-destructive px-1 py-px text-center text-[10px] font-medium leading-tight text-destructive-foreground shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <NotificationPopup
              isOpen={isNotificationOpen}
              notifications={notifications.slice(0, 12)}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onViewAll={() => {
                setIsNotificationOpen(false);
                navigate('/notifications');
              }}
            />
          </div>

          {/* Theme (aligned with electronic-shop: outlined control + label on sm+) */}
          <DarkModeToggle />

          {/* User Avatar */}
          <div
            className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm ring-2 ring-background ring-offset-2 ring-offset-background transition hover:shadow-md sm:h-10 sm:w-10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsMenuOpen((o) => !o);
              }
            }}
            aria-label="Open account menu"
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
