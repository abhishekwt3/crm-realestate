'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response received, status:', response.status);
      
      // Check if response contains a Set-Cookie header
      const hasSetCookie = response.headers.get('set-cookie');
      console.log('Set-Cookie header present:', !!hasSetCookie);
      
      const data = await response.json();
      console.log('Response data received');

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Show success message and prepare for redirect
      setSuccess('Login successful! Redirecting to dashboard...');
      
      // Set cookie manually as a fallback
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=${60*60*24*7}`;
        console.log('Token cookie set manually');
      }
      
      // Wait a moment to show success message before redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Simple Login</h1>
          <p className="mt-2 text-gray-600">No frills login page</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to regular login
            </Link>
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm">
            <Link href="/api/auth/test" className="text-blue-600 hover:underline" target="_blank">
              Test Authentication Status
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}