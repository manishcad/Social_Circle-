'use client'
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const pathname = usePathname();
  
  // Don't show navbar on auth pages
  const isAuthPage = pathname === '/auth' || pathname === '/verify-email';
  
  return (
    <div className="min-h-screen">
      {!isAuthPage && <Navbar />}
      <main className={!isAuthPage ? '' : ''}>
        {children}
      </main>
    </div>
  );
} 