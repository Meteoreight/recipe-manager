import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Product, Recipe, PackagingMaterial } from '../types';
import ProductForm from '../components/ProductForm';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [error, setError] = useState<string>('');
  const [recipeCosts, setRecipeCosts] = useState<{ [recipeId: number]: number }>({});

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
      const [ingredients, purchaseHistory, eggMasters] = await Promise.all([
        apiService.getIngredients(),
        apiService.getPurchaseHistory(),
        apiService.getEggMasters()
      ]);

      const costs: { [recipeId: number]: number } = {};

      // Get unique recipe IDs from products
      const recipeIdsFiltered = products.map(p => p.recipe_id).filter((id): id is number => id !== undefined);
      const recipeIds = Array.from(new Set(recipeIdsFiltered));

      for (const recipeId of recipeIds) {
        try {
          const recipeDetails = await apiService.getRecipeDetails(recipeId);
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

          costs[recipeId] = totalCost;
        } catch (error) {
          console.error(`Error calculating cost for recipe ${recipeId}:`, error);
        }
      }

      setRecipeCosts(costs);
    } catch (error) {
      console.error('Error calculating recipe costs:', error);
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

      {products.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500">製品が登録されていません。</p>
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
              {products.map((product) => (
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