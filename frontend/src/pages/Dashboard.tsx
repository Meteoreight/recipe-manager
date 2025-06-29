import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Product, Recipe, Ingredient, PurchaseHistory } from '../types';

interface DashboardStats {
  totalProducts: number;
  totalRecipes: number;
  totalIngredients: number;
  averageProfitMargin: number;
  topProfitableProducts: Array<{ product: Product; profitMargin: number; recipe?: Recipe }>;
  recentPurchases: PurchaseHistory[];
  costTrends: Array<{ ingredient: string; currentCost: number; previousCost: number; change: number }>;
  productsByStatus: { [status: string]: number };
  recipeComplexityDistribution: { [complexity: number]: number };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');
        const [products, recipes, ingredients, purchaseHistory] = await Promise.all([
          apiService.getProducts(),
          apiService.getRecipes(),
          apiService.getIngredients(),
          apiService.getPurchaseHistory()
        ]);

        // Calculate dashboard statistics
        const dashboardStats = calculateDashboardStats(products, recipes, ingredients, purchaseHistory);
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('ダッシュボードデータの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateDashboardStats = (
    products: Product[],
    recipes: Recipe[],
    ingredients: Ingredient[],
    purchaseHistory: PurchaseHistory[]
  ): DashboardStats => {
    // Basic counts
    const totalProducts = products.length;
    const totalRecipes = recipes.length;
    const totalIngredients = ingredients.length;

    // Products by status
    const productsByStatus = products.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {} as { [status: string]: number });

    // Recipe complexity distribution
    const recipeComplexityDistribution = recipes.reduce((acc, recipe) => {
      if (recipe.complexity) {
        acc[recipe.complexity] = (acc[recipe.complexity] || 0) + 1;
      }
      return acc;
    }, {} as { [complexity: number]: number });

    // Recent purchases (last 10)
    const recentPurchases = purchaseHistory
      .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
      .slice(0, 10);

    // Cost trends (simplified calculation)
    const costTrends = ingredients.map(ingredient => {
      const ingredientPurchases = purchaseHistory
        .filter(p => p.ingredient_id === ingredient.ingredient_id)
        .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

      if (ingredientPurchases.length >= 2) {
        const current = parseFloat(ingredientPurchases[0].price_excluding_tax);
        const previous = parseFloat(ingredientPurchases[1].price_excluding_tax);
        const change = ((current - previous) / previous) * 100;

        return {
          ingredient: ingredient.recipe_display_name,
          currentCost: current,
          previousCost: previous,
          change
        };
      }

      return null;
    }).filter(Boolean) as Array<{ ingredient: string; currentCost: number; previousCost: number; change: number }>;

    // Simplified profit calculation (placeholder)
    const topProfitableProducts = products
      .filter(p => p.selling_price)
      .map(product => {
        const recipe = recipes.find(r => r.recipe_id === product.recipe_id);
        // Simplified profit margin calculation
        const sellingPrice = parseFloat(product.selling_price!);
        const estimatedCost = sellingPrice * 0.6; // Placeholder: assume 60% cost ratio
        const profitMargin = ((sellingPrice - estimatedCost) / sellingPrice) * 100;

        return { product, profitMargin, recipe };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 5);

    const averageProfitMargin = topProfitableProducts.length > 0
      ? topProfitableProducts.reduce((sum, item) => sum + item.profitMargin, 0) / topProfitableProducts.length
      : 0;

    return {
      totalProducts,
      totalRecipes,
      totalIngredients,
      averageProfitMargin,
      topProfitableProducts,
      recentPurchases,
      costTrends,
      productsByStatus,
      recipeComplexityDistribution
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      under_review: '検討中',
      trial: '試作中',
      selling: '販売中',
      discontinued: '販売終了'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      under_review: 'bg-yellow-100 text-yellow-800',
      trial: 'bg-blue-100 text-blue-800',
      selling: 'bg-green-100 text-green-800',
      discontinued: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getIngredientName = (ingredientId: number) => {
    // This would need to be implemented with ingredient data
    return `原料ID: ${ingredientId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'データを取得できませんでした。'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <div className="text-sm text-gray-500">
          最終更新: {new Date().toLocaleString('ja-JP')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">製品数</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/products" className="font-medium text-blue-600 hover:text-blue-500">
                製品一覧を見る
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">レシピ数</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalRecipes}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/recipes" className="font-medium text-green-600 hover:text-green-500">
                レシピ一覧を見る
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">原料数</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalIngredients}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/ingredients" className="font-medium text-purple-600 hover:text-purple-500">
                原料一覧を見る
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">平均利益率</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.averageProfitMargin.toFixed(1)}%</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-yellow-600">
                {stats.averageProfitMargin >= 20 ? '良好' : stats.averageProfitMargin >= 10 ? '標準' : '要改善'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Profitable Products */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              高利益率製品 TOP 5
            </h3>
            {stats.topProfitableProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topProfitableProducts.map((item, index) => (
                  <div key={item.product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {item.product.product_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.recipe?.recipe_name || 'レシピなし'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {item.profitMargin.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(parseFloat(item.product.selling_price || '0'))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">データがありません</p>
            )}
          </div>
        </div>

        {/* Product Status Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              製品ステータス分布
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.productsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{count}件</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.totalProducts) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Purchases */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              最近の仕入れ
            </h3>
            {stats.recentPurchases.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPurchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getIngredientName(purchase.ingredient_id)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(purchase.purchase_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(parseFloat(purchase.price_excluding_tax))}
                      </p>
                      <p className="text-sm text-gray-500">
                        {purchase.supplier || '不明'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">データがありません</p>
            )}
            <div className="mt-4">
              <Link
                to="/purchase-history"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                すべての仕入れ履歴を見る →
              </Link>
            </div>
          </div>
        </div>

        {/* Cost Trends */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              原料価格トレンド
            </h3>
            {stats.costTrends.length > 0 ? (
              <div className="space-y-3">
                {stats.costTrends.slice(0, 5).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {trend.ingredient}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(trend.currentCost)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center ${trend.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {trend.change >= 0 ? (
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                          </svg>
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(trend.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">データがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;