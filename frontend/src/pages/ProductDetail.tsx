import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Product, Recipe, PackagingMaterial } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [packagingMaterial, setPackagingMaterial] = useState<PackagingMaterial | null>(null);
  const [recipeCost, setRecipeCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setError('');
        const productData = await apiService.getProduct(Number(id));
        setProduct(productData);

        // Fetch related data
        const promises = [];
        
        if (productData.recipe_id) {
          promises.push(apiService.getRecipe(productData.recipe_id));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (productData.packaging_material_id) {
          promises.push(apiService.getPackagingMaterial(productData.packaging_material_id));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [recipeData, packagingData] = await Promise.all(promises);
        setRecipe(recipeData);
        setPackagingMaterial(packagingData);

        // Calculate recipe cost if recipe exists
        if (productData.recipe_id) {
          await calculateRecipeCost(productData.recipe_id);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('製品の詳細を取得できませんでした。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const calculateRecipeCost = async (recipeId: number) => {
    try {
      const [recipeDetails, ingredients, purchaseHistory, eggMasters] = await Promise.all([
        apiService.getRecipeDetails(recipeId),
        apiService.getIngredients(),
        apiService.getPurchaseHistory(),
        apiService.getEggMasters()
      ]);

      let totalCost = 0;

      for (const detail of recipeDetails) {
        const ingredient = ingredients.find(i => i.ingredient_id === detail.ingredient_id);
        if (!ingredient) continue;

        const purchases = purchaseHistory.filter(p => p.ingredient_id === detail.ingredient_id);
        if (purchases.length === 0) continue;

        const latestPurchase = purchases[purchases.length - 1];
        const price = parseFloat(latestPurchase.price_excluding_tax);
        const tax = parseFloat(latestPurchase.tax_rate);
        const discount = parseFloat(latestPurchase.discount_rate || '0');
        const currentPrice = price * (1 - discount) * (1 + tax);

        let usageInGrams = parseFloat(detail.usage_amount);
        
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
        const ingredientCost = currentPrice * ratio;
        totalCost += ingredientCost;
      }

      setRecipeCost(totalCost);
    } catch (error) {
      console.error('Error calculating recipe cost:', error);
      setRecipeCost(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review': return '検討中';
      case 'trial': return '試作中';
      case 'selling': return '販売中';
      case 'discontinued': return '販売終了';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'selling': return 'bg-green-100 text-green-800';
      case 'discontinued': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price?: string | number) => {
    if (price === undefined || price === null) return '-';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(numPrice);
  };

  const calculateProfitAnalysis = () => {
    if (!product || !product.selling_price || recipeCost === null) return null;

    const sellingPrice = parseFloat(product.selling_price);
    const costPerUnit = recipeCost / product.pieces_per_package;
    const profitPerUnit = sellingPrice - costPerUnit;
    const profitMargin = (profitPerUnit / sellingPrice) * 100;

    return {
      costPerUnit,
      profitPerUnit,
      profitMargin,
      batchCost: recipeCost,
      batchProfit: profitPerUnit * product.pieces_per_package
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">製品詳細</h1>
          <Link
            to="/products"
            className="text-gray-600 hover:text-gray-900"
          >
            一覧に戻る
          </Link>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || '製品が見つかりません。'}
        </div>
      </div>
    );
  }

  const profitAnalysis = calculateProfitAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.product_name}</h1>
          <p className="text-sm text-gray-600 mt-1">製品詳細と利益率分析</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/products"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            一覧に戻る
          </Link>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            基本情報
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">製品名</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.product_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ステータス</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">入数</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.pieces_per_package}個</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">賞味期限</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {product.shelf_life_days ? `${product.shelf_life_days}日` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">販売価格</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatPrice(product.selling_price)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">作成日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(product.created_at).toLocaleDateString('ja-JP')}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Related Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recipe Information */}
        {recipe && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                レシピ情報
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">レシピ名:</span>
                  <Link
                    to={`/recipes/${recipe.recipe_id}`}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    {recipe.recipe_name} (v{recipe.version})
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">バッチサイズ:</span>
                  <span className="text-sm text-gray-900">{recipe.batch_size} {recipe.batch_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">出来高:</span>
                  <span className="text-sm text-gray-900">{recipe.yield_per_batch} {recipe.yield_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">難易度:</span>
                  <span className="text-sm text-gray-900">{recipe.complexity || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">作業量:</span>
                  <span className="text-sm text-gray-900">{recipe.effort || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packaging Information */}
        {packagingMaterial && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                包装材料情報
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">材料名:</span>
                  <span className="text-sm text-gray-900">{packagingMaterial.recipe_display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">商品名:</span>
                  <span className="text-sm text-gray-900">{packagingMaterial.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">数量:</span>
                  <span className="text-sm text-gray-900">
                    {packagingMaterial.quantity} {packagingMaterial.quantity_unit}
                  </span>
                </div>
                {packagingMaterial.common_name && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">一般名:</span>
                    <span className="text-sm text-gray-900">{packagingMaterial.common_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profit Analysis */}
      {profitAnalysis && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              利益率分析
            </h3>
            
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(profitAnalysis.costPerUnit)}
                </div>
                <div className="text-xs text-gray-600">1個あたり原価</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(profitAnalysis.profitPerUnit)}
                </div>
                <div className="text-xs text-gray-600">1個あたり利益</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${profitAnalysis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitAnalysis.profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">利益率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(profitAnalysis.batchCost)}
                </div>
                <div className="text-xs text-gray-600">バッチ原価</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(profitAnalysis.batchProfit)}
                </div>
                <div className="text-xs text-gray-600">バッチ利益</div>
              </div>
            </div>

            {profitAnalysis.profitMargin < 20 && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      利益率が低い可能性があります
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>現在の利益率は {profitAnalysis.profitMargin.toFixed(1)}% です。一般的に20%以上の利益率が推奨されます。</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;