import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Product, Recipe, PackagingMaterial } from '../types';
import ProductForm from '../components/ProductForm';
import SearchAndFilter from '../components/SearchAndFilter';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [error, setError] = useState<string>('');
  const [recipeCosts, setRecipeCosts] = useState<{ [recipeId: number]: number }>({});
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recipeFilter, setRecipeFilter] = useState('');
  const [profitFilter, setProfitFilter] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      const [productsData, recipesData, packagingData] = await Promise.all([
        apiService.getProducts(),
        apiService.getRecipes(),
        apiService.getPackagingMaterials()
      ]);
      setProducts(productsData);
      setRecipes(recipesData);
      setPackagingMaterials(packagingData);

      // Calculate recipe costs for profit margin display
      await calculateRecipeCosts(productsData as Product[], recipesData as Recipe[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('データの取得に失敗しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  };

  const calculateRecipeCosts = async (products: Product[], recipes: Recipe[]) => {
    try {
      // Get unique recipe IDs from products
      const recipeIdsFiltered = products.map(p => p.recipe_id).filter((id): id is number => id !== undefined);
      const recipeIds = Array.from(new Set(recipeIdsFiltered));

      if (recipeIds.length === 0) {
        setRecipeCosts({});
        return;
      }

      // Fetch all required data in parallel
      const [ingredients, purchaseHistory, eggMasters, batchRecipeDetails] = await Promise.all([
        apiService.getIngredients(),
        apiService.getPurchaseHistory(),
        apiService.getEggMasters(),
        apiService.getBatchRecipeDetails(recipeIds)
      ]);

      const costs: { [recipeId: number]: number } = {};

      // Calculate costs for each recipe
      recipeIds.forEach(recipeId => {
        try {
          const recipeDetails = batchRecipeDetails[recipeId] || [];
          let totalCost = 0;

          for (const detail of recipeDetails) {
            const ingredient = ingredients.find(i => i.ingredient_id === detail.ingredient_id);
            if (!ingredient) continue;

            const purchases = purchaseHistory.filter(p => p.ingredient_id === detail.ingredient_id);
            if (purchases.length === 0) continue;

            // Calculate current price (latest purchase)
            const latestPurchase = purchases[purchases.length - 1];
            const price = parseFloat(latestPurchase.price_excluding_tax);
            const tax = parseFloat(latestPurchase.tax_rate);
            const discount = parseFloat(latestPurchase.discount_rate || '0');
            const currentPrice = price * (1 - discount) * (1 + tax);

            // Calculate usage amount in grams
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

            // Calculate cost for this ingredient
            const ratio = usageInGrams / baseInGrams;
            const ingredientCost = currentPrice * ratio;
            totalCost += ingredientCost;
          }

          costs[recipeId] = totalCost;
        } catch (error) {
          console.error(`Error calculating cost for recipe ${recipeId}:`, error);
          costs[recipeId] = 0; // Set to 0 for error cases
        }
      });

      setRecipeCosts(costs);
    } catch (error) {
      console.error('Error calculating recipe costs:', error);
      setRecipeCosts({});
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('この製品を削除しますか？')) {
      try {
        await apiService.deleteProduct(productId);
        await fetchData();
        setError('');
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('製品の削除に失敗しました。もう一度お試しください。');
      }
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setEditingProduct(undefined);
    await fetchData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const getRecipeName = (recipeId?: number) => {
    if (!recipeId) return '-';
    const recipe = recipes.find(r => r.recipe_id === recipeId);
    return recipe ? `${recipe.recipe_name} (v${recipe.version})` : '不明';
  };

  const getPackagingName = (packagingId?: number) => {
    if (!packagingId) return '-';
    const packaging = packagingMaterials.find(p => p.packaging_material_id === packagingId);
    return packaging ? packaging.recipe_display_name : '不明';
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

  const formatPrice = (price?: string) => {
    if (!price) return '-';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(parseFloat(price));
  };

  const calculateProfitMargin = (product: Product) => {
    if (!product.recipe_id || !product.selling_price || !recipeCosts[product.recipe_id]) {
      return null;
    }

    const sellingPrice = parseFloat(product.selling_price);
    const recipeCost = recipeCosts[product.recipe_id];
    const costPerUnit = recipeCost / product.pieces_per_package;
    const profitMargin = ((sellingPrice - costPerUnit) / sellingPrice) * 100;

    return profitMargin;
  };

  const formatProfitMargin = (profitMargin: number | null) => {
    if (profitMargin === null) return '-';
    
    const color = profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600';
    return (
      <span className={`font-medium ${color}`}>
        {profitMargin.toFixed(1)}%
      </span>
    );
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = product.product_name.toLowerCase().includes(searchLower);
        const recipe = recipes.find(r => r.recipe_id === product.recipe_id);
        const matchesRecipe = recipe?.recipe_name.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesRecipe) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && product.status !== statusFilter) {
        return false;
      }

      // Recipe filter
      if (recipeFilter && product.recipe_id?.toString() !== recipeFilter) {
        return false;
      }

      // Profit filter
      if (profitFilter) {
        const profitMargin = calculateProfitMargin(product);
        if (profitMargin === null) {
          return profitFilter === 'no-data';
        }
        
        switch (profitFilter) {
          case 'high': // >= 20%
            return profitMargin >= 20;
          case 'medium': // 10-20%
            return profitMargin >= 10 && profitMargin < 20;
          case 'low': // < 10%
            return profitMargin < 10;
          case 'negative': // < 0%
            return profitMargin < 0;
          default:
            return true;
        }
      }

      return true;
    });
  }, [products, recipes, searchTerm, statusFilter, recipeFilter, profitFilter, recipeCosts]);

  // Filter options
  const statusOptions = useMemo(() => {
    const statusCounts = products.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return [
      { value: 'under_review', label: '検討中', count: statusCounts.under_review || 0 },
      { value: 'trial', label: '試作中', count: statusCounts.trial || 0 },
      { value: 'selling', label: '販売中', count: statusCounts.selling || 0 },
      { value: 'discontinued', label: '販売終了', count: statusCounts.discontinued || 0 }
    ].filter(option => option.count > 0);
  }, [products]);

  const recipeOptions = useMemo(() => {
    const recipeIds = Array.from(new Set(products.map(p => p.recipe_id).filter(Boolean)));
    return recipeIds.map(recipeId => {
      const recipe = recipes.find(r => r.recipe_id === recipeId);
      const count = products.filter(p => p.recipe_id === recipeId).length;
      return {
        value: recipeId!.toString(),
        label: recipe ? `${recipe.recipe_name} (v${recipe.version})` : '不明',
        count
      };
    }).filter(option => option.count > 0);
  }, [products, recipes]);

  const profitOptions = useMemo(() => {
    const profitCounts = { high: 0, medium: 0, low: 0, negative: 0, noData: 0 };
    
    products.forEach(product => {
      const profitMargin = calculateProfitMargin(product);
      if (profitMargin === null) {
        profitCounts.noData++;
      } else if (profitMargin >= 20) {
        profitCounts.high++;
      } else if (profitMargin >= 10) {
        profitCounts.medium++;
      } else if (profitMargin >= 0) {
        profitCounts.low++;
      } else {
        profitCounts.negative++;
      }
    });

    return [
      { value: 'high', label: '高利益率 (20%以上)', count: profitCounts.high },
      { value: 'medium', label: '中利益率 (10-20%)', count: profitCounts.medium },
      { value: 'low', label: '低利益率 (0-10%)', count: profitCounts.low },
      { value: 'negative', label: '赤字 (0%未満)', count: profitCounts.negative },
      { value: 'no-data', label: 'データなし', count: profitCounts.noData }
    ].filter(option => option.count > 0);
  }, [products, recipeCosts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">製品一覧</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          新規製品登録
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <SearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="製品名・レシピ名で検索..."
        filters={[
          {
            key: 'status',
            label: 'ステータス',
            value: statusFilter,
            options: statusOptions,
            onChange: setStatusFilter
          },
          {
            key: 'recipe',
            label: 'レシピ',
            value: recipeFilter,
            options: recipeOptions,
            onChange: setRecipeFilter
          },
          {
            key: 'profit',
            label: '利益率',
            value: profitFilter,
            options: profitOptions,
            onChange: setProfitFilter
          }
        ]}
        showResults={true}
        resultsCount={filteredProducts.length}
        totalCount={products.length}
      />

      {products.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500">製品が登録されていません。</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6 text-center">
            <div className="flex flex-col items-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">検索結果が見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                検索条件を変更するか、フィルターをクリアしてください。
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setRecipeFilter('');
                  setProfitFilter('');
                }}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                フィルターをクリア
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  製品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  レシピ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  入数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  包装材料
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  賞味期限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  販売価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  利益率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <Link
                        to={`/products/${product.product_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {product.product_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getRecipeName(product.recipe_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.pieces_per_package}個
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getPackagingName(product.packaging_material_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.shelf_life_days ? `${product.shelf_life_days}日` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(product.selling_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatProfitMargin(calculateProfitMargin(product))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {getStatusLabel(product.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(product.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/products/${product.product_id}`}
                      className="text-green-600 hover:text-green-900"
                    >
                      詳細
                    </Link>
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(product.product_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default ProductList;