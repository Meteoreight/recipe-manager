import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail, Ingredient, PurchaseHistory, EggMaster } from '../types';

interface CostCalculatorProps {
  recipe: Recipe;
  recipeDetails: RecipeDetail[];
}

interface IngredientCost {
  ingredient_id: number;
  ingredient_name: string;
  usage_amount: string;
  usage_unit: string;
  egg_type?: string;
  current_price?: number;
  min_price?: number;
  max_price?: number;
  avg_3m_price?: number;
  avg_6m_price?: number;
  cost_current?: number;
  cost_min?: number;
  cost_max?: number;
  cost_avg_3m?: number;
  cost_avg_6m?: number;
}

const CostCalculator: React.FC<CostCalculatorProps> = ({ recipe, recipeDetails }) => {
  const [ingredientCosts, setIngredientCosts] = useState<IngredientCost[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [eggMasters, setEggMasters] = useState<EggMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [ingredientsData, purchaseHistoryData, eggMasterData] = await Promise.all([
          apiService.getIngredients(),
          apiService.getPurchaseHistory(),
          apiService.getEggMasters()
        ]);

        setIngredients(ingredientsData);
        setEggMasters(eggMasterData);

        // Calculate costs for each recipe detail
        const costs = await Promise.all(
          recipeDetails.map(async (detail) => {
            const ingredient = ingredientsData.find(i => i.ingredient_id === detail.ingredient_id);
            if (!ingredient) {
              return null;
            }

            // Get purchase history for this ingredient
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
                // Add more conversions as needed
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

            return {
              ingredient_id: detail.ingredient_id,
              ingredient_name: ingredient.recipe_display_name,
              usage_amount: detail.usage_amount,
              usage_unit: detail.usage_unit,
              egg_type: detail.egg_type,
              current_price: currentPrice,
              min_price: minPrice,
              max_price: maxPrice,
              avg_3m_price: avg3mPrice,
              avg_6m_price: avg6mPrice,
              cost_current: currentPrice * ratio,
              cost_min: minPrice * ratio,
              cost_max: maxPrice * ratio,
              cost_avg_3m: avg3mPrice * ratio,
              cost_avg_6m: avg6mPrice * ratio
            };
          })
        );

        setIngredientCosts(costs.filter(Boolean) as IngredientCost[]);
      } catch (error) {
        console.error('Error calculating costs:', error);
        setError('コスト計算中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recipe, recipeDetails, eggMasters]);

  const calculateTotalCosts = () => {
    return ingredientCosts.reduce(
      (totals, cost) => ({
        current: totals.current + (cost.cost_current || 0),
        min: totals.min + (cost.cost_min || 0),
        max: totals.max + (cost.cost_max || 0),
        avg_3m: totals.avg_3m + (cost.cost_avg_3m || 0),
        avg_6m: totals.avg_6m + (cost.cost_avg_6m || 0)
      }),
      { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 }
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  const formatEggType = (eggType?: string) => {
    switch (eggType) {
      case 'whole_egg': return '全卵';
      case 'egg_white': return '卵白';
      case 'egg_yolk': return '卵黄';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-sm text-gray-600">コスト計算中...</div>
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

  const totalCosts = calculateTotalCosts();

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            レシピ原価計算: {recipe.recipe_name}
          </h3>
          
          {/* Total Cost Summary */}
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              バッチあたり原価 ({recipe.batch_size} {recipe.batch_unit})
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="text-center">
                <div className="text-xs text-gray-600">現在価格</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatPrice(totalCosts.current)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">最安値</div>
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(totalCosts.min)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">最高値</div>
                <div className="text-lg font-bold text-red-600">
                  {formatPrice(totalCosts.max)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">3ヶ月平均</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatPrice(totalCosts.avg_3m)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">6ヶ月平均</div>
                <div className="text-lg font-bold text-orange-600">
                  {formatPrice(totalCosts.avg_6m)}
                </div>
              </div>
            </div>
          </div>

          {/* Per Unit Cost */}
          {recipe.yield_per_batch > 0 && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                単位あたり原価 (1 {recipe.yield_unit}あたり)
              </h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="text-center">
                  <div className="text-xs text-gray-600">現在価格</div>
                  <div className="text-sm font-medium">
                    {formatPrice(totalCosts.current / recipe.yield_per_batch)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">最安値</div>
                  <div className="text-sm font-medium text-green-600">
                    {formatPrice(totalCosts.min / recipe.yield_per_batch)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">最高値</div>
                  <div className="text-sm font-medium text-red-600">
                    {formatPrice(totalCosts.max / recipe.yield_per_batch)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">3ヶ月平均</div>
                  <div className="text-sm font-medium text-purple-600">
                    {formatPrice(totalCosts.avg_3m / recipe.yield_per_batch)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">6ヶ月平均</div>
                  <div className="text-sm font-medium text-orange-600">
                    {formatPrice(totalCosts.avg_6m / recipe.yield_per_batch)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Ingredient Costs */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    原料名
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    使用量
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
                {ingredientCosts.map((cost) => (
                  <tr key={cost.ingredient_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cost.ingredient_name}
                        {cost.egg_type && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({formatEggType(cost.egg_type)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {cost.usage_amount} {cost.usage_unit}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {cost.cost_current ? formatPrice(cost.cost_current) : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">
                      {cost.cost_min ? formatPrice(cost.cost_min) : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                      {cost.cost_max ? formatPrice(cost.cost_max) : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-purple-600">
                      {cost.cost_avg_3m ? formatPrice(cost.cost_avg_3m) : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-orange-600">
                      {cost.cost_avg_6m ? formatPrice(cost.cost_avg_6m) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ingredientCosts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                原価計算を行うには仕入れ履歴が必要です。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;