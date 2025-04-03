'use client';

import { useState } from 'react';

export default function LoginTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function testHealth() {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setResult({ endpoint: 'health', data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function testDatabase() {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/db-test');
      const data = await response.json();
      setResult({ endpoint: 'db-test', data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    try {
      setLoading(true);
      setError(null);
      
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      setResult({
        endpoint: 'login',
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">API Testing</h1>
      
      <div className="space-y-2 mb-6">
        <button 
          onClick={testHealth}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          disabled={loading}
        >
          Test Health
        </button>
        
        <button 
          onClick={testDatabase}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Database
        </button>
      </div>
      
      <div className="border-t border-gray-200 pt-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Login Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <button 
            onClick={handleLogin}
            className="bg-indigo-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Test Login'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Result from {result.endpoint}:</h3>
          {result.status && (
            <p className="mb-2">Status: {result.status} {result.statusText}</p>
          )}
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60 text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}