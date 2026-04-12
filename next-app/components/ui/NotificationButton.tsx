import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';

interface Notification {
  id: number;
  message: string;
}

const NotificationButton: React.FC<{ className: string }> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: 'You have a new message!' },
    { id: 2, message: 'Your invoice has been processed.' },
    { id: 3, message: 'New customer added to your dashboard.' },
  ]);

  const popupRef = useRef<HTMLDivElement>(null);

  // Toggle Popup Visibility
  const togglePopup = () => setIsOpen(!isOpen);

  // Close Popup on Outside Click
  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Simulate fetching notifications from an API
    const fetchNotifications = () => {
      setTimeout(() => {
        setNotifications((prev) => [
          ...prev,
          { id: prev.length + 1, message: 'Another notification arrived!' },
        ]);
      }, 15000); // Add a new notification every 5 seconds
    };

    fetchNotifications();
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={togglePopup}
        className={`relative p-2 bg-gray-200 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none`}
        aria-label="Notifications"
      >
        <FaBell className="text-gray-700 dark:text-gray-300" size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Backdrop for Popup */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notification Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-scale-up"
          role="dialog"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h3>
            <ul className="mt-2 space-y-2">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="flex items-start text-xs text-gray-600 dark:text-gray-400"
                >
                  <span className="font-bold mr-2">{notification.id}.</span>
                  <span>{notification.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
