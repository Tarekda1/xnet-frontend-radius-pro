import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const alertClasses = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  const iconMap = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    info: <AlertCircle className="h-5 w-5" />,
  };

  return (
    <div className={`border-l-4 p-4 ${alertClasses[type]} relative`} role="alert">
      <div className="flex items-center">
        <div className="mr-3">
          {iconMap[type]}
        </div>
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-900"
          aria-label="Close"
        >
          <span className="text-2xl">&times;</span>
        </button>
      )}
    </div>
  );
};

export default Alert;