import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail, Ingredient, RecipeCategory, PurchaseHistory, EggMaster } from '../types';

interface RecipeReferencePaneProps {
  currentRecipeId?: number;
}

interface RecipeCost {
  current: number;
  min: number;
  max: number;
  avg_3m: number;
  avg_6m: number;
}

const RecipeReferencePane: React.FC<RecipeReferencePaneProps> = ({ currentRecipeId }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<RecipeDetail[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [eggMasters, setEggMasters] = useState<EggMaster[]>([]);
  const [recipeCost, setRecipeCost] = useState<RecipeCost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesData, ingredientsData, categoriesData, purchaseHistoryData, eggMasterData] = await Promise.all([
          apiService.getRecipes(),
          apiService.getIngredients(),
          apiService.getRecipeCategories(),
          apiService.getPurchaseHistory(),
          apiService.getEggMasters()
        ]);

        setRecipes(recipesData.filter(recipe => recipe.recipe_id !== currentRecipeId));
        setIngredients(ingredientsData);
        setCategories(categoriesData);
        setPurchaseHistory(purchaseHistoryData);
        setEggMasters(eggMasterData);
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
      setRecipeCost(null);
      return;
    }

    setSelectedRecipe(recipe);
    setDetailsLoading(true);
    setCostLoading(true);
    
    try {
      const details = await apiService.getRecipeDetails(recipe.recipe_id);
      setSelectedRecipeDetails(details);
      
      // Calculate recipe cost
      const cost = await calculateRecipeCost(recipe, details);
      setRecipeCost(cost);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      setSelectedRecipeDetails([]);
      setRecipeCost(null);
    } finally {
      setDetailsLoading(false);
      setCostLoading(false);
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

  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return '';
    const category = categories.find(c => c.category_id === categoryId);
    return category ? `${category.category}${category.sub_category ? ` - ${category.sub_category}` : ''}` : '';
  };

  const calculateRecipeCost = async (recipe: Recipe, recipeDetails: RecipeDetail[]): Promise<RecipeCost> => {
    let totalCurrent = 0;
    let totalMin = 0;
    let totalMax = 0;
    let totalAvg3m = 0;
    let totalAvg6m = 0;

    for (const detail of recipeDetails) {
      const ingredient = ingredients.find(i => i.ingredient_id === detail.ingredient_id);
      if (!ingredient) continue;

      // Get purchase history for this ingredient
      const purchases = purchaseHistory.filter(p => p.ingredient_id === detail.ingredient_id);
      if (purchases.length === 0) continue;

      // Calculate price statistics
      const prices = purchases.map(p => {
        const price = parseFloat(p.price_excluding_tax);
        const tax = parseFloat(p.tax_rate);
        const discount = parseFloat(p.discount_rate || '0');
        return price * (1 - discount) * (1 + tax);
      });

      const currentPrice = prices[prices.length - 1]; // Latest price
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate 3-month and 6-month averages
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      const recentPurchases3m = purchases.filter(p => new Date(p.purchase_date) >= threeMonthsAgo);
      const recentPurchases6m = purchases.filter(p => new Date(p.purchase_date) >= sixMonthsAgo);

      const avg3mPrice = recentPurchases3m.length > 0 
        ? recentPurchases3m.reduce((sum, p) => {
            const price = parseFloat(p.price_excluding_tax);
            const tax = parseFloat(p.tax_rate);
            const discount = parseFloat(p.discount_rate || '0');
            return sum + price * (1 - discount) * (1 + tax);
          }, 0) / recentPurchases3m.length
        : currentPrice;

      const avg6mPrice = recentPurchases6m.length > 0
        ? recentPurchases6m.reduce((sum, p) => {
            const price = parseFloat(p.price_excluding_tax);
            const tax = parseFloat(p.tax_rate);
            const discount = parseFloat(p.discount_rate || '0');
            return sum + price * (1 - discount) * (1 + tax);
          }, 0) / recentPurchases6m.length
        : currentPrice;

      // Calculate usage amount in grams for cost calculation
      let usageInGrams = parseFloat(detail.usage_amount);
      
      // Handle egg conversions
      if (ingredient.recipe_display_name === '卵' && detail.egg_type && eggMasters.length > 0) {
        const eggMaster = eggMasters[0];
        switch (detail.egg_type) {
          case 'whole_egg':
            usageInGrams = usageInGrams * parseFloat(eggMaster.whole_egg_weight);
            break;
          case 'egg_white':
            usageInGrams = usageInGrams * parseFloat(eggMaster.egg_white_weight);
            break;
          case 'egg_yolk':
            usageInGrams = usageInGrams * parseFloat(eggMaster.egg_yolk_weight);
            break;
        }
      } else {
        // Convert to grams if needed
        switch (detail.usage_unit) {
          case 'kg':
            usageInGrams *= 1000;
            break;
          case 'ml':
            // Assume 1ml = 1g for simplicity
            break;
          case 'l':
            usageInGrams *= 1000;
            break;
        }
      }

      // Get base unit from ingredient
      const baseQuantity = ingredient.quantity;
      const baseUnit = ingredient.quantity_unit;
      let baseInGrams = baseQuantity;

      switch (baseUnit) {
        case 'kg':
          baseInGrams *= 1000;
          break;
        case 'ml':
          // Assume 1ml = 1g for simplicity
          break;
        case 'l':
          baseInGrams *= 1000;
          break;
        case '個':
          if (ingredient.recipe_display_name === '卵') {
            baseInGrams = baseQuantity * 50; // Default egg weight
          }
          break;
      }

      // Calculate cost per usage
      const ratio = usageInGrams / baseInGrams;

      totalCurrent += currentPrice * ratio;
      totalMin += minPrice * ratio;
      totalMax += maxPrice * ratio;
      totalAvg3m += avg3mPrice * ratio;
      totalAvg6m += avg6mPrice * ratio;
    }

    return {
      current: totalCurrent,
      min: totalMin,
      max: totalMax,
      avg_3m: totalAvg3m,
      avg_6m: totalAvg6m
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
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
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-base text-gray-900">
              {selectedRecipe.recipe_name}の詳細
            </h3>
            
            {detailsLoading ? (
              <div className="text-sm text-gray-600">読み込み中...</div>
            ) : (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="text-sm space-y-1">
                  <div className="text-gray-700 font-medium">基本情報</div>
                  <div className="text-gray-600 pl-2 space-y-0.5">
                    <div>バッチサイズ: {selectedRecipe.batch_size} {selectedRecipe.batch_unit}</div>
                    <div>出来高: {selectedRecipe.yield_per_batch} {selectedRecipe.yield_unit}</div>
                    {selectedRecipe.complexity && (
                      <div>難易度: {selectedRecipe.complexity}/5</div>
                    )}
                    {selectedRecipe.effort && (
                      <div>作業量: {selectedRecipe.effort}/5</div>
                    )}
                  </div>
                </div>

                {/* Cost Information */}
                {costLoading ? (
                  <div className="text-sm text-gray-600">原価計算中...</div>
                ) : recipeCost && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-gray-700 mb-2">原価情報</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-600">現在価格</div>
                        <div className="font-bold text-blue-600">{formatPrice(recipeCost.current)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">最安値</div>
                        <div className="font-bold text-green-600">{formatPrice(recipeCost.min)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">3ヶ月平均</div>
                        <div className="font-bold text-purple-600">{formatPrice(recipeCost.avg_3m)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">6ヶ月平均</div>
                        <div className="font-bold text-orange-600">{formatPrice(recipeCost.avg_6m)}</div>
                      </div>
                    </div>
                    {selectedRecipe.yield_per_batch > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="text-xs text-gray-600 text-center">
                          単位あたり: {formatPrice(recipeCost.current / selectedRecipe.yield_per_batch)} / {selectedRecipe.yield_unit}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ingredients */}
                {selectedRecipeDetails.length > 0 && (
                  <div>
                    <div className="font-medium text-sm text-gray-700 mb-2">配合</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                      {selectedRecipeDetails
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((detail, index) => (
                          <div key={index} className="text-sm text-gray-700 flex justify-between py-1">
                            <span className="font-medium">{getIngredientName(detail.ingredient_id)}</span>
                            <span className="text-gray-600">{detail.usage_amount} {detail.usage_unit}</span>
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