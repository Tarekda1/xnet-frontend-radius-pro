import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to RADIUS Pro</h1>
        <p className="text-xl text-gray-600">Your complete RADIUS server management solution</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">Manage your RADIUS users, groups, and access policies with ease.</p>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Server Status</h2>
          <p className="text-gray-600 mb-4">Monitor your RADIUS server performance and health in real-time.</p>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Status
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reports</h2>
          <p className="text-gray-600 mb-4">Access detailed reports and analytics about your RADIUS server usage.</p>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;