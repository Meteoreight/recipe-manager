import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const GlobalLoading: React.FC = () => {
  const { globalLoading } = useAppContext();

  if (!globalLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-gray-700 font-medium">処理中...</div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoading;