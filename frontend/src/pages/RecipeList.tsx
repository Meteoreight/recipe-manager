import React from 'react';
import { Link } from 'react-router-dom';

const RecipeList: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">レシピ一覧</h1>
        <Link
          to="/recipes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          新規レシピ作成
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500">レシピが登録されていません。</p>
        </div>
      </div>
    </div>
  );
};

export default RecipeList;