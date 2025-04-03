'use client';

import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from './providers/AuthProvider';

// Navigation component
function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Properties', href: '/properties', icon: '🏠' },
    { name: 'Contacts', href: '/contacts', icon: '👤' },
    { name: 'Organizations', href: '/organizations', icon: '🏢' },
    { name: 'Deals', href: '/deals', icon: '💼' },
  ];
  
  return (
    <aside className="hidden w-64 bg-white border-r md:block">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
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
}

// Header component
function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
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
          
          <div className="flex items-center">
            {user ? (
              <>
                <span className="mr-4 text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <Link 
                  href="/login" 
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Main layout component
function MainLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Auth pages don't need navigation
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        {user && <Navigation />}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// Root layout with providers
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}