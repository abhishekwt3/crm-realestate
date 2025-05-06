// app/layout.js
'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './providers/AuthProvider';
import { ApolloProviderWrapper } from './providers/ApolloProvider';
import { ApolloWrapper } from './providers/ApolloProvider';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const publicRoutes = ['/login', '/register', '/onboarding/create-organization'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          {/* Your existing AuthProvider and layout */}
          {children}
        </ApolloWrapper>
      </body>
    </html>
  );
}