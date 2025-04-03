'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './providers/AuthProvider';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Define public routes that don't require authentication or layout
  const publicRoutes = ['/login', '/register', '/onboarding/create-organization'];

  // Check if current route is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Render layout for authenticated routes
  const renderAuthenticatedLayout = () => (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );

  // Render layout for public routes
  const renderPublicLayout = () => (
    <div className={`${inter.className} min-h-screen bg-gray-100`}>
      {children}
    </div>
  );

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {isPublicRoute ? renderPublicLayout() : renderAuthenticatedLayout()}
        </AuthProvider>
      </body>
    </html>
  );
}