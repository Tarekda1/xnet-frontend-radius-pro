import React, { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  toggleCollapse: () => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed(prev => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileMenuOpen,
        toggleCollapse,
        toggleMobileMenu,
        setMobileMenuOpen,
        setIsCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
