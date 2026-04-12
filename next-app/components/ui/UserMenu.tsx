import { motion, AnimatePresence, type Variants } from 'framer-motion';
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

const menuVariants: Variants = {
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
          className="absolute right-4 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl dark:shadow-[var(--shop-shadow-lg,0_20px_50px_rgba(0,0,0,0.45))]"
        >
          {/* User Info */}
          {userInfo && (
            <div className="mb-4 text-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {getUserInitials()}
                </div>
              </div>
              <div className="space-y-2">
                <p className="flex items-center rounded-lg p-2 transition-colors hover:bg-accent/80">
                  <FaUser className="mr-2 text-blue-500" />
                  <span className="font-semibold">{userInfo.username}</span>
                </p>
                <p className="flex items-center rounded-lg p-2 transition-colors hover:bg-accent/80">
                  <FaEnvelope className="mr-2 text-blue-500" />
                  <span>{userInfo.email}</span>
                </p>
                <p className="flex items-center rounded-lg p-2 transition-colors hover:bg-accent/80">
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
              className="flex w-full items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
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