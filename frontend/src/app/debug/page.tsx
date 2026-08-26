'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { token, user } = useAuth();
  const [apiStatus, setApiStatus] = useState<{
    status: string;
    code?: number;
    message?: string;
  }>({ status: 'Loading...' });

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('http://localhost:4000/notifications', {
          headers: {
            Authorization: `Bearer ${token || 'no-token'}`,
          },
        });

        setApiStatus({
          status: `HTTP ${response.status}`,
          code: response.status,
          message: response.statusText,
        });
      } catch (error) {
        setApiStatus({
          status: 'Connection Error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    testAPI();
  }, [token]);

  return (
    <div className="p-8 bg-neutral-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Debug Information</h1>

      <div className="bg-neutral-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Auth Status</h2>
        <p className="mb-2">
          <strong>User:</strong> {user?.email || 'Not logged in'}
        </p>
        <p className="mb-2">
          <strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}
        </p>
        <p>
          <strong>Role:</strong> {user?.role || 'N/A'}
        </p>
      </div>

      <div className="bg-neutral-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">API Status</h2>
        <p className="mb-2">
          <strong>Status:</strong> {apiStatus.status}
        </p>
        {apiStatus.code && (
          <p className="mb-2">
            <strong>Code:</strong> {apiStatus.code}
          </p>
        )}
        {apiStatus.message && (
          <p>
            <strong>Message:</strong> {apiStatus.message}
          </p>
        )}
      </div>

      <div className="bg-blue-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">What's Happening</h2>
        <ul className="list-disc pl-6 space-y-2">
          {!user ? (
            <>
              <li>❌ You are not logged in</li>
              <li>❌ No JWT token available</li>
              <li>⚠️ API calls will fail with 401 Unauthorized</li>
              <li>✅ Go to login page and authenticate first</li>
            </>
          ) : (
            <>
              <li>✅ You are logged in as {user.email}</li>
              <li>✅ JWT token is present</li>
              <li>
                {apiStatus.code === 200
                  ? '✅ API is responding correctly'
                  : `⚠️ API returned ${apiStatus.code}`}
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
