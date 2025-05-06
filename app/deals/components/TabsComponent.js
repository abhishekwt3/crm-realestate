'use client';

import { useState } from 'react';

export default function TabsComponent({ children, tabs, activeTab = 0, onChange }) {
  const [active, setActive] = useState(activeTab);
  
  const handleTabChange = (index) => {
    setActive(index);
    if (onChange) {
      onChange(index);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                active === index
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={active === index ? 'page' : undefined}
            >
              <div className="flex items-center">
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    active === index
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>
      <div className="p-0">
        {children[active]}
      </div>
    </div>
  );
}