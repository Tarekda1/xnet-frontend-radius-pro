// Sidebar.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaCogs,
  FaUsers,
  FaCreditCard,
  FaHome,
  FaUserClock,
  FaServer,
  FaUserShield,
  FaBell,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { useSidebar } from './Sidebar.context';
import { useIsMobile } from '../../../hooks/use-mobile';
import { Button } from '../button';
import { FileText, Upload, BarChart3, Receipt, Folder, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { can, canAny } from '@/lib/permissions';

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
  const location = useLocation();

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
    const { user } = useAuth();

    const isUsersRoute = useMemo(() => {
      const p = location.pathname || '';
      return p.startsWith('/users') || p.startsWith('/online-users') || p.startsWith('/profiles');
    }, [location.pathname]);

    const isRadiusSettingsRoute = useMemo(() => {
      const p = location.pathname || '';
      return p.startsWith('/nas') || p.startsWith('/settings');
    }, [location.pathname]);

    const isAdminRoute = useMemo(() => {
      const p = location.pathname || '';
      return p.startsWith('/analytics') || p.startsWith('/alerts') || p.startsWith('/expenses') || p.startsWith('/auth-users');
    }, [location.pathname]);

    const [isUsersGroupOpen, setIsUsersGroupOpen] = useState<boolean>(isUsersRoute);
    const [isRadiusSettingsGroupOpen, setIsRadiusSettingsGroupOpen] = useState<boolean>(isRadiusSettingsRoute);
    const [isAdminGroupOpen, setIsAdminGroupOpen] = useState<boolean>(isAdminRoute);

    // Auto-expand the relevant group when navigating into it.
    useEffect(() => {
      if (isUsersRoute) setIsUsersGroupOpen(true);
    }, [isUsersRoute]);
    useEffect(() => {
      if (isRadiusSettingsRoute) setIsRadiusSettingsGroupOpen(true);
    }, [isRadiusSettingsRoute]);
    useEffect(() => {
      if (isAdminRoute) setIsAdminGroupOpen(true);
    }, [isAdminRoute]);

    const mainItems = [
      { to: '/', label: 'Home', icon: FaHome },
      { to: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    ];

    const adminItems = [
      { to: '/analytics', label: 'Analytics', icon: BarChart3, perm: 'admin.analytics.view' },
      { to: '/alerts', label: 'Alerts', icon: FaBell, perm: 'admin.alerts.view' },
      { to: '/expenses', label: 'Expenses', icon: Receipt, perm: 'admin.expenses.view' },
      { to: '/auth-users', label: 'Auth Users', icon: FaUserShield, perm: 'admin.authUsers.manage' },
      { to: '/access', label: 'Roles & Access', icon: FaUserShield, perm: 'admin.access.manage' },
      { to: '/admin/resellers', label: 'Resellers', icon: FaUsers, perm: 'admin.resellers.manage' },
    ] as const;

    const usersItems = [
      { to: '/users/list', label: 'Users', icon: FaUsers, perms: ['users.view', 'reseller.users.view'] },
      { to: '/online-users', label: 'Live Sessions', icon: FaUserClock, perms: ['users.online.view', 'reseller.users.view'] },
      { to: '/profiles/list', label: 'Profile Plans', icon: FaCreditCard, perms: ['radius.profiles.view'] },
    ] as const;

    const radiusSettingsItems = [
      { to: '/settings', label: 'Settings', icon: FaCogs, perm: 'radius.settings.view' },
      { to: '/nas', label: 'NAS', icon: FaServer, perm: 'radius.nas.view' },
    ] as const;

    const billingItems = [
      { label: 'Upload Invoice', icon: Upload, to: '/invoice-upload', perm: 'billing.invoiceUpload.create' },
      { label: 'External Invoices', to: '/external-invoices', icon: FileText, perm: 'billing.externalInvoices.view' },
      { label: 'Collections', to: '/collections', icon: DollarSign, perm: 'billing.collections.view' },
    ] as const;

    // Resellers use the same pages (dashboard/users/online-users) with scoped data.

    const SectionLabel = ({ children }: { children: React.ReactNode }) => (
      <div className={cn("px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-gray-400", !isMobile && isCollapsed && "hidden")}>
        {children}
      </div>
    );

    const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center px-4 py-3 space-x-3 transition-all duration-200",
            "hover:bg-gray-700/50 rounded-lg mx-2",
            "group relative",
            isActive ? "bg-blue-500/10 text-blue-400" : "text-gray-300 hover:text-white"
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
            !isMobile && isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'
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
    );

    const NavGroup = (props: {
      label: string;
      icon: any;
      isOpen: boolean;
      onToggle: () => void;
      items: Array<{ to: string; label: string; icon: any }>;
    }) => {
      const Icon = props.icon;
      const Chevron = props.isOpen ? FaChevronDown : FaChevronRight;

      return (
        <div className="mx-2">
          <button
            type="button"
            className={cn(
              "w-full flex items-center px-4 py-3 space-x-3 transition-all duration-200",
              "hover:bg-gray-700/50 rounded-lg",
              "text-gray-300 hover:text-white",
              "group relative"
            )}
            onClick={(e) => {
              e.stopPropagation();
              props.onToggle();
            }}
          >
            <Icon size={20} className={cn("flex-shrink-0 transition-transform duration-200", "group-hover:scale-110")} />
            <span
              className={cn(
                "whitespace-nowrap transition-all duration-300 flex-1 text-left",
                !isMobile && isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'
              )}
            >
              {props.label}
            </span>
            <Chevron
              size={14}
              className={cn(
                "flex-shrink-0 opacity-80",
                !isMobile && isCollapsed ? 'hidden' : 'block'
              )}
            />

            {!isMobile && isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 rounded-md text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {props.label}
              </div>
            )}
          </button>

          {props.isOpen && (
            <div className={cn("mt-1 space-y-1", !isMobile && isCollapsed ? 'hidden' : 'block')}>
              {props.items.map(({ to, label, icon }) => (
                <div key={to} className="ml-3">
                  <NavItem to={to} label={label} icon={icon} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    const hasItemAccess = (item: { perms: readonly string[] }) => canAny(user, item.perms as unknown as string[]);

    return (
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 space-y-1">
        {mainItems.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} icon={Icon} />
        ))}

        {canAny(user, adminItems.map((i) => i.perm) as unknown as string[]) ? (
          <NavGroup
            label="Admin"
            icon={FaUserShield}
            isOpen={isAdminGroupOpen}
            onToggle={() => setIsAdminGroupOpen((v) => !v)}
            items={adminItems.filter((i) => can(user, i.perm)).map(({ to, label, icon }) => ({ to, label, icon }))}
          />
        ) : null}

        {canAny(user, usersItems.flatMap((i) => i.perms) as unknown as string[]) ? (
          <NavGroup
            label="Users"
            icon={FaUsers}
            isOpen={isUsersGroupOpen}
            onToggle={() => setIsUsersGroupOpen((v) => !v)}
            items={usersItems.filter((i) => hasItemAccess(i)).map(({ to, label, icon }) => ({ to, label, icon }))}
          />
        ) : null}

        {canAny(user, radiusSettingsItems.map((i) => i.perm) as unknown as string[]) ? (
          <NavGroup
            label="Radius Settings"
            icon={FaCogs}
            isOpen={isRadiusSettingsGroupOpen}
            onToggle={() => setIsRadiusSettingsGroupOpen((v) => !v)}
            items={radiusSettingsItems.filter((i) => can(user, i.perm)).map(({ to, label, icon }) => ({ to, label, icon }))}
          />
        ) : null}

        {canAny(user, billingItems.map((i) => i.perm) as unknown as string[]) ? (
          <>
            <div className="my-2 border-t border-gray-700/50 mx-3" />

            <SectionLabel>
              <span className="inline-flex items-center gap-2">
                <Folder className="h-3.5 w-3.5" /> Billing
              </span>
            </SectionLabel>

            {billingItems
              .filter((i) => can(user, i.perm))
              .map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to} label={label} icon={Icon} />
              ))}
          </>
        ) : null}

        {/* Reseller section removed (scoped in-place) */}
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
