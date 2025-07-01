import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail } from '../types';
import CostCalculator from '../components/CostCalculator';
import MultiRecipeCostComparison from '../components/MultiRecipeCostComparison';

type ViewMode = 'selection' | 'single' | 'comparison';

const CostCalculationPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>([]);
  const [allRecipeDetails, setAllRecipeDetails] = useState<{ [recipeId: number]: RecipeDetail[] }>({});
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesData = await apiService.getRecipes();
        setRecipes(recipesData as Recipe[]);
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
      setViewMode('single');
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('レシピ詳細の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiRecipeToggle = (recipe: Recipe) => {
    setSelectedRecipes(prev => {
      const isSelected = prev.some(r => r.recipe_id === recipe.recipe_id);
      if (isSelected) {
        return prev.filter(r => r.recipe_id !== recipe.recipe_id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  const handleCompareRecipes = async () => {
    if (selectedRecipes.length < 2) {
      setError('比較するには2つ以上のレシピを選択してください。');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const detailsPromises = selectedRecipes.map(recipe => 
        apiService.getRecipeDetails(recipe.recipe_id)
      );
      const allDetails = await Promise.all(detailsPromises);
      
      const detailsMap: { [recipeId: number]: RecipeDetail[] } = {};
      selectedRecipes.forEach((recipe, index) => {
        detailsMap[recipe.recipe_id] = allDetails[index];
      });
      
      setAllRecipeDetails(detailsMap);
      setViewMode('comparison');
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setError('レシピ詳細の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedRecipe(null);
    setSelectedRecipes([]);
    setRecipeDetails([]);
    setAllRecipeDetails({});
    setViewMode('selection');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">原価計算</h1>
        <div className="flex items-center space-x-3">
          {viewMode !== 'selection' && (
            <button
              onClick={clearSelection}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              レシピ選択に戻る
            </button>
          )}
          {viewMode === 'selection' && selectedRecipes.length >= 2 && (
            <button
              onClick={handleCompareRecipes}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              選択したレシピを比較 ({selectedRecipes.length}件)
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {viewMode === 'selection' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                レシピを選択してください
              </h3>
              <div className="text-sm text-gray-600">
                {selectedRecipes.length > 0 && (
                  <span>選択中: {selectedRecipes.length}件</span>
                )}
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                💡 <strong>使い方:</strong> 
                クリックで単一レシピの詳細原価計算、
                チェックボックスで複数選択して比較分析ができます
              </p>
            </div>
            
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  レシピが登録されていません。先にレシピを作成してください。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => {
                  const isSelected = selectedRecipes.some(r => r.recipe_id === recipe.recipe_id);
                  return (
                    <div
                      key={recipe.recipe_id}
                      className={`relative p-4 border rounded-lg transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMultiRecipeToggle(recipe)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        onClick={() => handleRecipeSelect(recipe)}
                        className="cursor-pointer pr-8"
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
                            詳細原価計算
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'single' && selectedRecipe && (
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

      {viewMode === 'comparison' && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-sm text-gray-600">比較データを計算中...</div>
            </div>
          ) : (
            <MultiRecipeCostComparison recipes={selectedRecipes} allRecipeDetails={allRecipeDetails} />
          )}
        </div>
      )}
    </div>
  );
};

export default CostCalculationPage;