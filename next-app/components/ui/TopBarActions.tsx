"use client";

import { useRef, useState, useEffect } from "react";
import DarkModeToggle from "./DarkModeToggle";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiClient } from "@/api/client";
import { FaBell } from "react-icons/fa";
import { useNotificationInboxStore } from "@/store/notificationInboxStore";
import { NotificationPopup } from "./NotificationPopup";
import { UserMenu } from "./UserMenu";
import HeaderAlertWidget from "./HeaderAlertWidget";

const TopBarActions: React.FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string; role: string } | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notifications = useNotificationInboxStore((s) => s.items);
  const markReadInbox = useNotificationInboxStore((s) => s.markRead);
  const markAllReadInbox = useNotificationInboxStore((s) => s.markAllRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get(`/auth/profile`);
      setUserInfo(response.data.data);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const getUserInitials = () => {
    if (userInfo?.username) {
      return userInfo.username.slice(0, 2).toUpperCase();
    }
    return "U";
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
    const handleClickOutside = (event: MouseEvent) => {
      if (parentRef.current && !parentRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex shrink-0 items-center gap-1 sm:gap-2" ref={parentRef}>
      <HeaderAlertWidget />

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <FaBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[1.125rem] rounded-full bg-destructive px-1 py-px text-center text-[10px] font-medium leading-tight text-destructive-foreground shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <NotificationPopup
          isOpen={isNotificationOpen}
          notifications={notifications.slice(0, 12)}
          onMarkAsRead={(id) => markReadInbox(id)}
          onMarkAllAsRead={() => markAllReadInbox()}
          onViewAll={() => {
            setIsNotificationOpen(false);
            navigate("/notifications");
          }}
        />
      </div>

      <DarkModeToggle compact className="sm:hidden" />
      <DarkModeToggle className="hidden sm:inline-flex" />

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
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white sm:text-sm">
          {getUserInitials()}
        </span>
      </div>

      <UserMenu
        isOpen={isMenuOpen}
        userInfo={userInfo}
        onLogout={handleLogout}
        onNavigate={navigate}
        getUserInitials={getUserInitials}
      />
    </div>
  );
};

export default TopBarActions;
