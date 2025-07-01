import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail, Ingredient, RecipeCategory } from '../types';

interface RecipeReferencePaneProps {
  currentRecipeId?: number;
}

const RecipeReferencePane: React.FC<RecipeReferencePaneProps> = ({ currentRecipeId }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<RecipeDetail[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesData, ingredientsData, categoriesData] = await Promise.all([
          apiService.getRecipes(),
          apiService.getIngredients(),
          apiService.getRecipeCategories()
        ]);

        setRecipes(recipesData.filter(recipe => recipe.recipe_id !== currentRecipeId));
        setIngredients(ingredientsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentRecipeId]);

  const handleRecipeSelect = async (recipe: Recipe) => {
    if (selectedRecipe?.recipe_id === recipe.recipe_id) {
      setSelectedRecipe(null);
      setSelectedRecipeDetails([]);
      return;
    }

    setSelectedRecipe(recipe);
    setDetailsLoading(true);
    
    try {
      const details = await apiService.getRecipeDetails(recipe.recipe_id);
      setSelectedRecipeDetails(details);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setSelectedRecipeDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.recipe_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || recipe.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIngredientName = (ingredientId: number) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient ? ingredient.recipe_display_name : '不明な原料';
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return '';
    const category = categories.find(c => c.category_id === categoryId);
    return category ? `${category.category}${category.sub_category ? ` - ${category.sub_category}` : ''}` : '';
  };

  if (loading) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="flex justify-center items-center h-32">
          <div className="text-sm text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">参照用レシピ</h2>
        
        {/* Search and Filter */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="レシピを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全カテゴリ</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category} {category.sub_category && `- ${category.sub_category}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecipes.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchTerm || selectedCategory ? '条件に一致するレシピがありません' : 'レシピがありません'}
          </div>
        ) : (
          <div className="p-2">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.recipe_id}
                onClick={() => handleRecipeSelect(recipe)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRecipe?.recipe_id === recipe.recipe_id
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white hover:bg-gray-100 border-gray-200'
                } border`}
              >
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {recipe.recipe_name}
                </div>
                <div className="text-xs text-gray-600">
                  {getCategoryName(recipe.category_id)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  更新: {new Date(recipe.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Details */}
      {selectedRecipe && (
        <div className="border-t border-gray-200 bg-white">
          <div className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              {selectedRecipe.recipe_name}の詳細
            </h3>
            
            {detailsLoading ? (
              <div className="text-xs text-gray-600">読み込み中...</div>
            ) : (
              <div className="space-y-3">
                {/* Basic Info */}
                <div className="text-xs">
                  <div className="text-gray-600">バッチサイズ: {selectedRecipe.batch_size} {selectedRecipe.batch_unit}</div>
                  <div className="text-gray-600">出来高: {selectedRecipe.yield_per_batch} {selectedRecipe.yield_unit}</div>
                  {selectedRecipe.complexity && (
                    <div className="text-gray-600">難易度: {selectedRecipe.complexity}/5</div>
                  )}
                  {selectedRecipe.effort && (
                    <div className="text-gray-600">作業量: {selectedRecipe.effort}/5</div>
                  )}
                </div>

                {/* Ingredients */}
                {selectedRecipeDetails.length > 0 && (
                  <div>
                    <div className="font-medium text-xs text-gray-900 mb-2">配合</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedRecipeDetails
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((detail, index) => (
                          <div key={index} className="text-xs text-gray-600 flex justify-between">
                            <span>{getIngredientName(detail.ingredient_id)}</span>
                            <span>{detail.usage_amount} {detail.usage_unit}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeReferencePane;