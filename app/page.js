'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard or login
    const token = localStorage.getItem('token');
    console.log("Token on home/layout:", token);
    
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}