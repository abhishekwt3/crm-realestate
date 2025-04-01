'use client';

import './globals.css';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Layout components
const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                CRM App
              </Link>
            </div>
          </div>
          {user && (
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">{user.email}</span>
              <button
                onClick={onLogout}
                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const Sidebar = ({ pathname }) => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Organizations', href: '/organizations', icon: '🏢' },
    { name: 'Team', href: '/team', icon: '👥' },
    { name: 'Properties', href: '/properties', icon: '🏠' },
    { name: 'Contacts', href: '/contacts', icon: '👤' },
    { name: 'Deals', href: '/deals', icon: '💼' },
    { name: 'Meetings', href: '/meetings', icon: '📅' },
    { name: 'Tasks', href: '/tasks', icon: '✓' },
    { name: 'Documents', href: '/documents', icon: '📄' },
  ];

  return (
    <aside className="hidden w-64 bg-white border-r md:block">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-lg ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  // Check for authentication on client side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from cookie
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (token) {
          // Fetch user data
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleLogout = () => {
    // Delete token cookie
    document.cookie = 'token=; path=/; max-age=0';
    // Redirect to login page
    window.location.href = '/login';
  };
  
  // Check if current path is auth related
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  if (loading) {
    return (
      <html lang="en">
        <body className="bg-gray-50">
          <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
          </div>
        </body>
      </html>
    );
  }
  
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {isAuthPage ? (
          children
        ) : (
          <div className="flex flex-col min-h-screen">
            <Header user={user} onLogout={handleLogout} />
            <div className="flex flex-1">
              <Sidebar pathname={pathname} />
              <main className="flex-1 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}