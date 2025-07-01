import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { RecipeDetail, Ingredient, PurchaseHistory, EggMaster } from '../types';

interface RecipeCostSummaryProps {
  recipeDetails: RecipeDetail[];
  batchSize: number;
  batchUnit: string;
  yieldPerBatch: number;
  yieldUnit: string;
}

interface CostSummary {
  current: number;
  min: number;
  max: number;
  avg_3m: number;
  avg_6m: number;
}

const RecipeCostSummary: React.FC<RecipeCostSummaryProps> = ({
  recipeDetails,
  batchSize,
  batchUnit,
  yieldPerBatch,
  yieldUnit
}) => {
  const [costSummary, setCostSummary] = useState<CostSummary>({
    current: 0,
    min: 0,
    max: 0,
    avg_3m: 0,
    avg_6m: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [eggMasters, setEggMasters] = useState<EggMaster[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ingredientsData, eggMasterData] = await Promise.all([
          apiService.getIngredients(),
          apiService.getEggMasters()
        ]);
        setIngredients(ingredientsData);
        setEggMasters(eggMasterData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const calculateCosts = async () => {
      if (recipeDetails.length === 0 || ingredients.length === 0) {
        setCostSummary({ current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 });
        return;
      }

      setLoading(true);
      setError('');

      try {
        const purchaseHistoryData = await apiService.getPurchaseHistory();
        
        const costs = await Promise.all(
          recipeDetails.map(async (detail) => {
            if (detail.ingredient_id === 0 || !detail.usage_amount || parseFloat(detail.usage_amount) === 0) {
              return { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 };
            }

            const ingredient = ingredients.find(i => i.ingredient_id === detail.ingredient_id);
            if (!ingredient) {
              return { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 };
            }

            const purchases = purchaseHistoryData.filter(p => p.ingredient_id === detail.ingredient_id);
            if (purchases.length === 0) {
              return { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 };
            }

            // Calculate price statistics
            const prices = purchases.map(p => {
              const price = parseFloat(p.price_excluding_tax);
              const tax = parseFloat(p.tax_rate);
              const discount = parseFloat(p.discount_rate || '0');
              return price * (1 - discount) * (1 + tax);
            });

            const currentPrice = prices[prices.length - 1];
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
              current: currentPrice * ratio,
              min: minPrice * ratio,
              max: maxPrice * ratio,
              avg_3m: avg3mPrice * ratio,
              avg_6m: avg6mPrice * ratio
            };
          })
        );

        const totalCosts = costs.reduce(
          (totals, cost) => ({
            current: totals.current + cost.current,
            min: totals.min + cost.min,
            max: totals.max + cost.max,
            avg_3m: totals.avg_3m + cost.avg_3m,
            avg_6m: totals.avg_6m + cost.avg_6m
          }),
          { current: 0, min: 0, max: 0, avg_3m: 0, avg_6m: 0 }
        );

        setCostSummary(totalCosts);
      } catch (error) {
        console.error('Error calculating costs:', error);
        setError('原価計算中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    calculateCosts();
  }, [recipeDetails, ingredients, eggMasters]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-center items-center h-20">
            <div className="text-sm text-gray-600">原価計算中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const hasValidData = recipeDetails.some(detail => 
    detail.ingredient_id > 0 && detail.usage_amount && parseFloat(detail.usage_amount) > 0
  );

  if (!hasValidData) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            原価情報
          </h3>
          <div className="text-center py-4">
            <p className="text-gray-500">
              原価を計算するには原料を追加してください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          原価情報
        </h3>
        
        {/* Batch Cost Summary */}
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            バッチあたり原価 ({batchSize} {batchUnit})
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="text-center">
              <div className="text-xs text-gray-600">現在価格</div>
              <div className="text-sm font-bold text-blue-600">
                {formatPrice(costSummary.current)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">最安値</div>
              <div className="text-sm font-bold text-green-600">
                {formatPrice(costSummary.min)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">最高値</div>
              <div className="text-sm font-bold text-red-600">
                {formatPrice(costSummary.max)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">3ヶ月平均</div>
              <div className="text-sm font-bold text-purple-600">
                {formatPrice(costSummary.avg_3m)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">6ヶ月平均</div>
              <div className="text-sm font-bold text-orange-600">
                {formatPrice(costSummary.avg_6m)}
              </div>
            </div>
          </div>
        </div>

        {/* Per Unit Cost */}
        {yieldPerBatch > 0 && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              単位あたり原価 (1 {yieldUnit}あたり)
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="text-center">
                <div className="text-xs text-gray-600">現在価格</div>
                <div className="text-sm font-medium">
                  {formatPrice(costSummary.current / yieldPerBatch)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">最安値</div>
                <div className="text-sm font-medium text-green-600">
                  {formatPrice(costSummary.min / yieldPerBatch)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">最高値</div>
                <div className="text-sm font-medium text-red-600">
                  {formatPrice(costSummary.max / yieldPerBatch)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">3ヶ月平均</div>
                <div className="text-sm font-medium text-purple-600">
                  {formatPrice(costSummary.avg_3m / yieldPerBatch)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">6ヶ月平均</div>
                <div className="text-sm font-medium text-orange-600">
                  {formatPrice(costSummary.avg_6m / yieldPerBatch)}
                </div>
              </div>
            </div>
          </div>
        )}

        {costSummary.current === 0 && costSummary.min === 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-yellow-600">
              原価計算を行うには仕入れ履歴が必要です。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCostSummary;