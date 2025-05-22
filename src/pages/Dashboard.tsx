import { useOnlineMetrics } from '@/hooks/useOnlineMetrics';
import React from 'react';

const Dashboard: React.FC = () => {

  const { totalOnlineUsers, totalActiveUsers } = useOnlineMetrics();
  return (
    <div className="w-full py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm font-medium">Online Users</h3>
          <p className="text-2xl font-bold text-blue-600">{totalOnlineUsers}</p>
          <span className="text-green-600 text-sm">Real-time data</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
          <p className="text-2xl font-bold text-green-600">{totalActiveUsers}</p>
          <span className="text-green-600 text-sm">Real-time data</span>
        </div>


        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm font-medium">Authentication Requests</h3>
          <p className="text-2xl font-bold text-gray-900">1.2M</p>
          <span className="text-blue-600 text-sm">Past 24 hours</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm font-medium">Failed Attempts</h3>
          <p className="text-2xl font-bold text-gray-900">145</p>
          <span className="text-red-600 text-sm">↑ 3% from yesterday</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-gray-500 text-sm font-medium">Server Uptime</h3>
          <p className="text-2xl font-bold text-gray-900">99.9%</p>
          <span className="text-green-600 text-sm">Last 30 days</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {/* Activity items */}
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">User authentication successful</p>
              <p className="text-xs text-gray-400">2 minutes ago</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm text-gray-600">Failed login attempt</p>
              <p className="text-xs text-gray-400">15 minutes ago</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">New user added</p>
              <p className="text-xs text-gray-400">1 hour ago</p>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CPU Usage</span>
              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Disk Space</span>
              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;