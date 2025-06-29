import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-semibold">
                Recipe Manager
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                ホーム
              </Link>
              <Link
                to="/recipes"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/recipes') ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                レシピ
              </Link>
              <Link
                to="/ingredients"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/ingredients') ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                原料
              </Link>
              <Link
                to="/products"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/products') ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                製品
              </Link>
              <Link
                to="/purchase-history"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/purchase-history') ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                仕入れ履歴
              </Link>
              <Link
                to="/egg-master"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/egg-master') ? 'bg-gray-900' : 'hover:bg-gray-700'
                }`}
              >
                卵マスタ
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;