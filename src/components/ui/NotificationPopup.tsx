import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { InvoiceNotification } from '@/types/notifications';

interface NotificationPopupProps {
  isOpen: boolean;
  notifications: InvoiceNotification[];
  readNotifications: Set<string>;
  onMarkAsRead: (timestamp: string) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
}

const notificationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  notifications,
  readNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={notificationVariants}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.timestamp}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                    !readNotifications.has(notification.timestamp) ? "bg-gray-50 dark:bg-gray-700" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Invoice Update</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!readNotifications.has(notification.timestamp) && (
                      <button
                        onClick={() => onMarkAsRead(notification.timestamp)}
                        className="p-1 text-gray-500 hover:text-blue-500"
                        aria-label="Mark as read"
                      >
                        <FaCheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onViewAll}
              className="w-full text-center text-blue-500 hover:text-blue-600"
            >
              View all notifications
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 