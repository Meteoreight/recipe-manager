import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail } from '../types';
import CostCalculator from '../components/CostCalculator';

const CostCalculationPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesData = await apiService.getRecipes();
        setRecipes(recipesData);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setError('レシピの取得中にエラーが発生しました。');
      }
    };

    fetchRecipes();
  }, []);

  const handleRecipeSelect = async (recipe: Recipe) => {
    setLoading(true);
    setError('');
    try {
      const details = await apiService.getRecipeDetails(recipe.recipe_id);
      setSelectedRecipe(recipe);
      setRecipeDetails(details);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('レシピ詳細の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedRecipe(null);
    setRecipeDetails([]);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">原価計算</h1>
        {selectedRecipe && (
          <button
            onClick={clearSelection}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            レシピ選択に戻る
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!selectedRecipe ? (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              原価計算するレシピを選択してください
            </h3>
            
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  レシピが登録されていません。先にレシピを作成してください。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.recipe_id}
                    onClick={() => handleRecipeSelect(recipe)}
                    className="cursor-pointer p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {recipe.recipe_name}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>バッチサイズ: {recipe.batch_size} {recipe.batch_unit}</p>
                      {recipe.yield_per_batch > 0 && (
                        <p>出来高: {recipe.yield_per_batch} {recipe.yield_unit}</p>
                      )}
                      <p>複雑度: {recipe.complexity_level}</p>
                      {recipe.category && (
                        <p>カテゴリー: {recipe.category}</p>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        原価計算
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-sm text-gray-600">レシピ詳細を読み込み中...</div>
            </div>
          ) : (
            <CostCalculator recipe={selectedRecipe} recipeDetails={recipeDetails} />
          )}
        </div>
      )}
    </div>
  );
};

export default CostCalculationPage;