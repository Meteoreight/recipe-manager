import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecipeForm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">レシピ作成</h1>
        <button
          onClick={() => navigate('/recipes')}
          className="text-gray-600 hover:text-gray-900"
        >
          一覧に戻る
        </button>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-500">レシピ作成フォームを実装予定です。</p>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;