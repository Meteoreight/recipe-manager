import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail, Ingredient, PurchaseHistory, EggMaster } from '../types';

interface MultiRecipeCostComparisonProps {
  recipes: Recipe[];
  allRecipeDetails: { [recipeId: number]: RecipeDetail[] };
}

interface RecipeCostSummary {
  recipe: Recipe;
  totalCosts: {
    current: number;
    min: number;
    max: number;
    avg_3m: number;
    avg_6m: number;
  };
  perUnitCosts: {
    current: number;
    min: number;
    max: number;
    avg_3m: number;
    avg_6m: number;
  };
  ingredientCosts: IngredientCost[];
  hasData: boolean;
}

interface IngredientCost {
  ingredient_id: number;
  ingredient_name: string;
  usage_amount: string;
  usage_unit: string;
  egg_type?: string;
  cost_current?: number;
  cost_min?: number;
  cost_max?: number;
  cost_avg_3m?: number;
  cost_avg_6m?: number;
}

const MultiRecipeCostComparison: React.FC<MultiRecipeCostComparisonProps> = ({ 
  recipes, 
  allRecipeDetails 
}) => {
  const [recipeCostSummaries, setRecipeCostSummaries] = useState<RecipeCostSummary[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [eggMasters, setEggMasters] = useState<EggMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDataAndCalculate = async () => {
      if (recipes.length === 0) return;
      
      try {
        setError('');
        setLoading(true);

        const [ingredientsData, purchaseHistoryData, eggMasterData] = await Promise.all([
          apiService.getIngredients(),
          apiService.getPurchaseHistory(),
          apiService.getEggMasters()
        ]);

        setIngredients(ingredientsData);
        setPurchaseHistory(purchaseHistoryData);
        setEggMasters(eggMasterData);

        const summaries = await Promise.all(
          recipes.map(async (recipe) => {
            const recipeDetails = allRecipeDetails[recipe.recipe_id] || [];
            const costSummary = await calculateRecipeCosts(
              recipe,
              recipeDetails,
              ingredientsData,
              purchaseHistoryData,
              eggMasterData
            );
            return costSummary;
          })
        );

        setRecipeCostSummaries(summaries);
      } catch (error) {
        console.error('Error calculating costs:', error);
        setError('コスト計算中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndCalculate();
  }, [recipes, allRecipeDetails]);

  const calculateRecipeCosts = async (
    recipe: Recipe,
    recipeDetails: RecipeDetail[],
    ingredientsData: Ingredient[],
    purchaseHistoryData: PurchaseHistory[],
    eggMasterData: EggMaster[]
  ): Promise<RecipeCostSummary> => {
    const ingredientCosts = await Promise.all(
      recipeDetails.map(async (detail) => {
        const ingredient = ingredientsData.find(i => i.ingredient_id === detail.ingredient_id);
        if (!ingredient) {
          return null;
        }

        const purchases = purchaseHistoryData.filter(p => p.ingredient_id === detail.ingredient_id);
        
        if (purchases.length === 0) {
          return {
            ingredient_id: detail.ingredient_id,
            ingredient_name: ingredient.recipe_display_name,
            usage_amount: detail.usage_amount,
            usage_unit: detail.usage_unit,
            egg_type: detail.egg_type
          };
        }

        const prices = purchases.map(p => {
          const price = parseFloat(p.price_excluding_tax);
          const tax = parseFloat(p.tax_rate);
          const discount = parseFloat(p.discount_rate || '0');
          return price * (1 - discount) * (1 + tax);
        });

        const currentPrice = prices[prices.length - 1];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

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

        let usageInGrams = parseFloat(detail.usage_amount);
        
        if (ingredient.recipe_display_name === '卵' && detail.egg_type && eggMasterData.length > 0) {
          const eggMaster = eggMasterData[0];
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
          switch (detail.usage_unit) {
            case 'kg':
              usageInGrams *= 1000;
              break;
            case 'ml':
              break;
            case 'l':
              usageInGrams *= 1000;
              break;
          }
        }

        const baseQuantity = ingredient.quantity;
        const baseUnit = ingredient.quantity_unit;
        let baseInGrams = baseQuantity;

        switch (baseUnit) {
          case 'kg':
            baseInGrams *= 1000;
            break;
          case 'ml':
            break;
          case 'l':
            baseInGrams *= 1000;
            break;
          case '個':
            if (ingredient.recipe_display_name === '卵') {
              baseInGrams = baseQuantity * 50;
            }
            break;
        }

        const ratio = usageInGrams / baseInGrams;

        return {
          ingredient_id: detail.ingredient_id,
          ingredient_name: ingredient.recipe_display_name,
          usage_amount: detail.usage_amount,
          usage_unit: detail.usage_unit,
          egg_type: detail.egg_type,
          cost_current: currentPrice * ratio,
          cost_min: minPrice * ratio,
          cost_max: maxPrice * ratio,
          cost_avg_3m: avg3mPrice * ratio,
          cost_avg_6m: avg6mPrice * ratio
        };
      })
    );

    const validIngredientCosts = ingredientCosts.filter(Boolean) as IngredientCost[];
    
    const totalCosts = validIngredientCosts.reduce(
      (totals, cost) => ({
        current: totals.current + (cost.cost_current || 0),
        min: totals.min + (cost.cost_min || 0),
        max: totals.max + (cost.cost_max || 0),
        avg_3m: totals.avg_3m + (cost.cost_avg_3m || 0),
        avg_6m: totals.avg_6m + (cost.cost_avg_6m || 0)
      }),
      { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 }
    );

    const perUnitCosts = recipe.yield_per_batch > 0 ? {
      current: totalCosts.current / recipe.yield_per_batch,
      min: totalCosts.min / recipe.yield_per_batch,
      max: totalCosts.max / recipe.yield_per_batch,
      avg_3m: totalCosts.avg_3m / recipe.yield_per_batch,
      avg_6m: totalCosts.avg_6m / recipe.yield_per_batch
    } : { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 };

    const hasData = validIngredientCosts.some(cost => cost.cost_current !== undefined);

    return {
      recipe,
      totalCosts,
      perUnitCosts,
      ingredientCosts: validIngredientCosts,
      hasData
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  const getBestValue = (summaries: RecipeCostSummary[], field: 'current' | 'min' | 'max' | 'avg_3m' | 'avg_6m') => {
    const values = summaries.filter(s => s.hasData).map(s => s.totalCosts[field]);
    return values.length > 0 ? Math.min(...values) : null;
  };

  const getBestPerUnitValue = (summaries: RecipeCostSummary[], field: 'current' | 'min' | 'max' | 'avg_3m' | 'avg_6m') => {
    const values = summaries.filter(s => s.hasData && s.recipe.yield_per_batch > 0).map(s => s.perUnitCosts[field]);
    return values.length > 0 ? Math.min(...values) : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-sm text-gray-600">レシピ比較データを計算中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const bestTotalCurrent = getBestValue(recipeCostSummaries, 'current');
  const bestTotalMin = getBestValue(recipeCostSummaries, 'min');
  const bestTotalMax = getBestValue(recipeCostSummaries, 'max');
  const bestTotalAvg3m = getBestValue(recipeCostSummaries, 'avg_3m');
  const bestTotalAvg6m = getBestValue(recipeCostSummaries, 'avg_6m');

  const bestPerUnitCurrent = getBestPerUnitValue(recipeCostSummaries, 'current');
  const bestPerUnitMin = getBestPerUnitValue(recipeCostSummaries, 'min');
  const bestPerUnitMax = getBestPerUnitValue(recipeCostSummaries, 'max');
  const bestPerUnitAvg3m = getBestPerUnitValue(recipeCostSummaries, 'avg_3m');
  const bestPerUnitAvg6m = getBestPerUnitValue(recipeCostSummaries, 'avg_6m');

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            レシピ原価比較 ({recipeCostSummaries.length}件)
          </h3>
          
          {/* バッチあたり原価比較 */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-700 mb-4">
              バッチあたり原価比較
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      レシピ名
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      バッチサイズ
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      現在価格
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      最安値
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      最高値
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      3ヶ月平均
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      6ヶ月平均
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipeCostSummaries.map((summary) => (
                    <tr key={summary.recipe.recipe_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {summary.recipe.recipe_name}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {summary.recipe.batch_size} {summary.recipe.batch_unit}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.totalCosts.current === bestTotalCurrent 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData ? formatPrice(summary.totalCosts.current) : '-'}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.totalCosts.min === bestTotalMin 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData ? formatPrice(summary.totalCosts.min) : '-'}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.totalCosts.max === bestTotalMax 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData ? formatPrice(summary.totalCosts.max) : '-'}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.totalCosts.avg_3m === bestTotalAvg3m 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData ? formatPrice(summary.totalCosts.avg_3m) : '-'}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.totalCosts.avg_6m === bestTotalAvg6m 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData ? formatPrice(summary.totalCosts.avg_6m) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 単位あたり原価比較 */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-700 mb-4">
              単位あたり原価比較
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      レシピ名
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      出来高
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      現在価格
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      最安値
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      最高値
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      3ヶ月平均
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      6ヶ月平均
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipeCostSummaries.map((summary) => (
                    <tr key={summary.recipe.recipe_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {summary.recipe.recipe_name}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {summary.recipe.yield_per_batch > 0 
                          ? `${summary.recipe.yield_per_batch} ${summary.recipe.yield_unit}`
                          : '-'
                        }
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.recipe.yield_per_batch > 0 && summary.perUnitCosts.current === bestPerUnitCurrent 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData && summary.recipe.yield_per_batch > 0 
                          ? formatPrice(summary.perUnitCosts.current) 
                          : '-'
                        }
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.recipe.yield_per_batch > 0 && summary.perUnitCosts.min === bestPerUnitMin 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData && summary.recipe.yield_per_batch > 0 
                          ? formatPrice(summary.perUnitCosts.min) 
                          : '-'
                        }
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.recipe.yield_per_batch > 0 && summary.perUnitCosts.max === bestPerUnitMax 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData && summary.recipe.yield_per_batch > 0 
                          ? formatPrice(summary.perUnitCosts.max) 
                          : '-'
                        }
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.recipe.yield_per_batch > 0 && summary.perUnitCosts.avg_3m === bestPerUnitAvg3m 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData && summary.recipe.yield_per_batch > 0 
                          ? formatPrice(summary.perUnitCosts.avg_3m) 
                          : '-'
                        }
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        summary.hasData && summary.recipe.yield_per_batch > 0 && summary.perUnitCosts.avg_6m === bestPerUnitAvg6m 
                          ? 'text-green-600 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {summary.hasData && summary.recipe.yield_per_batch > 0 
                          ? formatPrice(summary.perUnitCosts.avg_6m) 
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {recipeCostSummaries.every(s => !s.hasData) && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                原価比較を行うには仕入れ履歴が必要です。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiRecipeCostComparison;