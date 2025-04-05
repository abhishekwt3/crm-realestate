// app/components/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: '📊' 
  },
  { 
    name: 'Properties', 
    href: '/properties', 
    icon: '🏠' 
  },
  { 
    name: 'Contacts', 
    href: '/contacts', 
    icon: '👤' 
  },
  { 
    name: 'Organizations', 
    href: '/organizations', 
    icon: '🏢' 
  },
  { 
    name: 'Deals', 
    href: '/deals', 
    icon: '💼' 
  },
  { 
    name: 'Team Members', 
    href: '/team', 
    icon: '👥' 
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-64 bg-white border-r min-h-screen p-4">
      <div className="flex flex-col space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center p-2 rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}