'use client';

import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return null; // Middleware will redirect

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="font-bold text-xl text-blue-600">FinTrack</div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:space-x-6 sm:gap-0">
          <Link 
            href="/dashboard" 
            className={`text-sm font-medium ${pathname === '/dashboard' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/transactions" 
            className={`text-sm font-medium ${pathname === '/transactions' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            Transactions
          </Link>
          <Link 
            href="/categories" 
            className={`text-sm font-medium ${pathname === '/categories' ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            Categories
          </Link>
          <div className="text-sm text-gray-500 hidden sm:block px-4 border-l border-gray-200 dark:border-gray-700">
            {user.name} ({user.role})
          </div>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
