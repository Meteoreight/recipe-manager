import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail, Ingredient } from '../types';
import CostCalculator from '../components/CostCalculator';

const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'cost'>('details');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setError('');
        const [recipeData, detailsData, ingredientsData] = await Promise.all([
          apiService.getRecipe(Number(id)),
          apiService.getRecipeDetails(Number(id)),
          apiService.getIngredients()
        ]);

        setRecipe(recipeData);
        setRecipeDetails(detailsData);
        setIngredients(ingredientsData);
      } catch (error) {
        console.error('Error fetching recipe details:', error);
        setError('レシピの詳細を取得できませんでした。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getIngredientName = (ingredientId: number) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient ? ingredient.recipe_display_name : '不明';
  };

  const formatEggType = (eggType?: string) => {
    switch (eggType) {
      case 'whole_egg': return '全卵';
      case 'egg_white': return '卵白';
      case 'egg_yolk': return '卵黄';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '下書き';
      case 'active': return '有効';
      case 'archived': return 'アーカイブ';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">レシピ詳細</h1>
          <Link
            to="/recipes"
            className="text-gray-600 hover:text-gray-900"
          >
            一覧に戻る
          </Link>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'レシピが見つかりません。'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{recipe.recipe_name}</h1>
          <p className="text-sm text-gray-600 mt-1">レシピ詳細と原価計算</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/recipes/${recipe.recipe_id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            編集
          </Link>
          <Link
            to="/recipes"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            一覧に戻る
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            レシピ詳細
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cost'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            原価計算
          </button>
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Recipe Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                基本情報
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">バージョン</dt>
                  <dd className="mt-1 text-sm text-gray-900">v{recipe.version}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(recipe.status)}`}>
                      {getStatusLabel(recipe.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">難易度</dt>
                  <dd className="mt-1 text-sm text-gray-900">{recipe.complexity || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作業量</dt>
                  <dd className="mt-1 text-sm text-gray-900">{recipe.effort || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">バッチサイズ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{recipe.batch_size} {recipe.batch_unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">出来高</dt>
                  <dd className="mt-1 text-sm text-gray-900">{recipe.yield_per_batch} {recipe.yield_unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(recipe.created_at).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(recipe.updated_at).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Ingredients */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                原料配合
              </h3>
              
              {recipeDetails.length === 0 ? (
                <p className="text-gray-500">配合が登録されていません。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          順序
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          原料名
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          使用量
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          単位
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          卵の種別
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recipeDetails.map((detail) => (
                        <tr key={detail.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {detail.display_order}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getIngredientName(detail.ingredient_id)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {detail.usage_amount}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {detail.usage_unit}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {detail.egg_type ? formatEggType(detail.egg_type) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cost' && (
        <CostCalculator recipe={recipe} recipeDetails={recipeDetails} />
      )}
    </div>
  );
};

export default RecipeDetailPage;