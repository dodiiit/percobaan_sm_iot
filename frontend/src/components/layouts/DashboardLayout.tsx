import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Sidebar from '../navigation/Sidebar';

const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <Navbar showUserMenu={true} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggleCollapse={toggleSidebar}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div>
                © 2025 IndoWater. All rights reserved.
              </div>
              <div className="flex items-center space-x-4">
                <span>Status: Online</span>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;