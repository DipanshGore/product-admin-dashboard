'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductsLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      router.replace('/login');
    } else {
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Ignore parse errors if data is corrupted
        }
      }
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  // Prevent UI flash with a clean loader while evaluating authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-500 font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/products" className="text-xl font-bold text-gray-900 tracking-tight">
              Admin<span className="text-blue-600">Hub</span>
            </Link>
            <nav className="hidden sm:flex space-x-4">
              <Link
                href="/products"
                className="text-sm font-medium text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md transition-colors"
              >
                Products
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 border-r border-gray-200 pr-4">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.username || 'User avatar'}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}