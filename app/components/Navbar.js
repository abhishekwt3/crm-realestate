'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get user from localStorage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local storage
      localStorage.removeItem('user');
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="font-bold text-xl">
              CRM Dashboard
            </Link>
            
            <div className="hidden md:block ml-10">
              <Link href="/dashboard" className="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                Dashboard
              </Link>
              <Link href="/properties" className="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                Properties
              </Link>
              <Link href="/contacts" className="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                Contacts
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center">
                <span className="mr-4">Hello, {user.full_name || user.user_name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-white text-indigo-600 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div>
                <Link href="/login" className="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Login
                </Link>
                <Link href="/register" className="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}