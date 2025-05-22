import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">About RADIUS Pro</h1>
        <p className="text-gray-600 mt-2">Your comprehensive RADIUS server management solution</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
          <p className="text-gray-600 mb-4">
            RADIUS Pro is a modern, feature-rich management interface for RADIUS servers. It provides
            comprehensive tools for authentication, authorization, and accounting (AAA) management.
          </p>
          <p className="text-gray-600">
            Built with the latest web technologies, RADIUS Pro offers a seamless experience for
            system administrators and network managers.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Key Features</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time monitoring and statistics
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              User and group management
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Advanced authentication policies
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Detailed logging and reporting
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Technical Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-700 font-medium">Version:</span>
              <span className="text-gray-600 ml-2">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Framework:</span>
              <span className="text-gray-600 ml-2">React + Vite</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">UI Framework:</span>
              <span className="text-gray-600 ml-2">Tailwind CSS</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">License:</span>
              <span className="text-gray-600 ml-2">MIT</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Support</h2>
          <p className="text-gray-600 mb-4">
            For technical support, feature requests, or bug reports, please visit our support
            channels:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li>
              <a
                href="https://github.com/your-repo/radius-pro"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository
              </a>
            </li>
            <li>
              <a
                href="mailto:support@radiuspro.com"
                className="text-blue-600 hover:underline"
              >
                Email Support
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;