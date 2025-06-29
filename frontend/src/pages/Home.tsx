import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Recipe Manager
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          お菓子のレシピと原価計算を管理するアプリケーション
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/recipes"
          className="group block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
            レシピ管理
          </h3>
          <p className="mt-2 text-gray-600">
            レシピの作成、編集、複製、バージョン管理
          </p>
        </Link>

        <Link
          to="/ingredients"
          className="group block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
            原料管理
          </h3>
          <p className="mt-2 text-gray-600">
            原料マスタの登録・編集
          </p>
        </Link>

        <Link
          to="/products"
          className="group block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
            製品管理
          </h3>
          <p className="mt-2 text-gray-600">
            製品情報の登録・原価計算
          </p>
        </Link>

        <Link
          to="/purchase-history"
          className="group block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
            仕入れ履歴
          </h3>
          <p className="mt-2 text-gray-600">
            仕入れ価格の登録・履歴管理
          </p>
        </Link>

        <div className="group block p-6 bg-white border border-gray-200 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900">
            原価計算
          </h3>
          <p className="mt-2 text-gray-600">
            リアルタイム原価計算・価格分析
          </p>
        </div>

        <div className="group block p-6 bg-white border border-gray-200 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900">
            成分表示
          </h3>
          <p className="mt-2 text-gray-600">
            成分表示の自動生成
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;