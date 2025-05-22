import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface ServerSettings {
  serverHost: string;
  authPort: string;
  accountingPort: string;
  secretKey: string;
}

interface UserPreferences {
  enableNotifications: boolean;
  darkMode: boolean;
  language: string;
}

const Setting: React.FC = () => {
  const [serverSettings, setServerSettings] = useState<ServerSettings>({
    serverHost: 'localhost',
    authPort: '1812',
    accountingPort: '1813',
    secretKey: '',
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    enableNotifications: true,
    darkMode: false,
    language: 'en',
  });

  const handleServerSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setServerSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setUserPreferences((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement settings update logic
    console.log('Server Settings:', serverSettings);
    console.log('User Preferences:', userPreferences);
  };

  return (
    <div className="w-full py-5">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your RADIUS server configurations and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Server Settings Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Server Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="serverHost" className="block text-sm font-medium text-gray-700">
                Server Host
              </label>
              <input
                type="text"
                id="serverHost"
                name="serverHost"
                value={serverSettings.serverHost}
                onChange={handleServerSettingsChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="authPort" className="block text-sm font-medium text-gray-700">
                Authentication Port
              </label>
              <input
                type="text"
                id="authPort"
                name="authPort"
                value={serverSettings.authPort}
                onChange={handleServerSettingsChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="accountingPort" className="block text-sm font-medium text-gray-700">
                Accounting Port
              </label>
              <input
                type="text"
                id="accountingPort"
                name="accountingPort"
                value={serverSettings.accountingPort}
                onChange={handleServerSettingsChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
                Secret Key
              </label>
              <input
                type="password"
                id="secretKey"
                name="secretKey"
                value={serverSettings.secretKey}
                onChange={handleServerSettingsChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* User Preferences Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableNotifications"
                name="enableNotifications"
                checked={userPreferences.enableNotifications}
                onChange={handlePreferencesChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-700">
                Enable Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="darkMode"
                name="darkMode"
                checked={userPreferences.darkMode}
                onChange={handlePreferencesChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700">
                Dark Mode
              </label>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={userPreferences.language}
                onChange={handlePreferencesChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            variant={"outline"}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Setting;