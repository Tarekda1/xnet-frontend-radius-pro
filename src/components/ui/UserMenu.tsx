import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaUserTag, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Button } from './button';

interface UserMenuProps {
  isOpen: boolean;
  userInfo: {
    username: string;
    email: string;
    role: string;
  } | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  getUserInitials: () => string;
}

const menuVariants = {
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

export const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  userInfo,
  onLogout,
  onNavigate,
  getUserInitials
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
          className="absolute top-full right-4 mt-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 w-72 border border-gray-200 dark:border-gray-700"
        >
          {/* User Info */}
          {userInfo && (
            <div className="mb-4 text-sm text-gray-800 dark:text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {getUserInitials()}
                </div>
              </div>
              <div className="space-y-2">
                <p className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FaUser className="mr-2 text-blue-500" />
                  <span className="font-semibold">{userInfo.username}</span>
                </p>
                <p className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FaEnvelope className="mr-2 text-blue-500" />
                  <span>{userInfo.email}</span>
                </p>
                <p className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FaUserTag className="mr-2 text-blue-500" />
                  <span className="capitalize">{userInfo.role}</span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Settings Button */}
            <Button 
              onClick={() => onNavigate('/settings')} 
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              <FaCog />
              Settings
            </Button>

            {/* Logout Button */}
            <Button 
              onClick={onLogout} 
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              <FaSignOutAlt />
              Logout
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 