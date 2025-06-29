import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Product, Recipe, PackagingMaterial } from '../types';

interface ProductFormProps {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    recipe_id: '',
    pieces_per_package: '',
    packaging_material_id: '',
    shelf_life_days: '',
    selling_price: '',
    status: 'under_review'
  });

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [recipeCost, setRecipeCost] = useState<number | null>(null);
  const [profitMargin, setProfitMargin] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesData, packagingData] = await Promise.all([
          apiService.getRecipes(),
          apiService.getPackagingMaterials()
        ]);
        setRecipes(recipesData);
        setPackagingMaterials(packagingData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('データの取得に失敗しました。');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name,
        recipe_id: product.recipe_id?.toString() || '',
        pieces_per_package: product.pieces_per_package.toString(),
        packaging_material_id: product.packaging_material_id?.toString() || '',
        shelf_life_days: product.shelf_life_days?.toString() || '',
        selling_price: product.selling_price || '',
        status: product.status
      });
    }
  }, [product]);

  useEffect(() => {
    // Calculate profit margin when selling price or recipe cost changes
    if (recipeCost !== null && formData.selling_price) {
      const sellingPrice = parseFloat(formData.selling_price);
      const packageCost = recipeCost / parseInt(formData.pieces_per_package || '1');
      const margin = ((sellingPrice - packageCost) / sellingPrice) * 100;
      setProfitMargin(margin);
    } else {
      setProfitMargin(null);
    }
  }, [recipeCost, formData.selling_price, formData.pieces_per_package]);

  const calculateRecipeCost = async (recipeId: string) => {
    if (!recipeId) {
      setRecipeCost(null);
      return;
    }

    try {
      // Fetch actual cost data from the recipe
      const [recipeData, recipeDetails, ingredients, purchaseHistory, eggMasters] = await Promise.all([
        apiService.getRecipe(Number(recipeId)),
        apiService.getRecipeDetails(Number(recipeId)),
        apiService.getIngredients(),
        apiService.getPurchaseHistory(),
        apiService.getEggMasters()
      ]);

      // Calculate total cost using the same logic as CostCalculator
      let totalCost = 0;

      for (const detail of recipeDetails) {
        const ingredient = ingredients.find(i => i.ingredient_id === detail.ingredient_id);
        if (!ingredient) continue;

        // Get purchase history for this ingredient
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
              // Assume 1ml = 1g
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
            // Assume 1ml = 1g
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

      setRecipeCost(totalCost);
    } catch (error) {
      console.error('Error calculating recipe cost:', error);
      setRecipeCost(null);
    }
  };

  useEffect(() => {
    if (formData.recipe_id) {
      calculateRecipeCost(formData.recipe_id);
    }
  }, [formData.recipe_id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.product_name.trim()) {
      newErrors.product_name = '製品名は必須です';
    }

    if (!formData.pieces_per_package || parseInt(formData.pieces_per_package) <= 0) {
      newErrors.pieces_per_package = '入数は1以上の整数で入力してください';
    }

    if (formData.shelf_life_days && parseInt(formData.shelf_life_days) <= 0) {
      newErrors.shelf_life_days = '賞味期限は1以上の整数で入力してください';
    }

    if (formData.selling_price && parseFloat(formData.selling_price) < 0) {
      newErrors.selling_price = '販売価格は0以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        product_name: formData.product_name,
        recipe_id: formData.recipe_id ? parseInt(formData.recipe_id) : undefined,
        pieces_per_package: parseInt(formData.pieces_per_package),
        packaging_material_id: formData.packaging_material_id ? parseInt(formData.packaging_material_id) : undefined,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : undefined,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : undefined,
        status: formData.status
      };

      if (product) {
        await apiService.updateProduct(product.product_id, submitData);
      } else {
        await apiService.createProduct(submitData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      setError('製品の保存に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {product ? '製品編集' : '新規製品登録'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                製品名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.product_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="チョコレートケーキ"
              />
              {errors.product_name && (
                <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                レシピ
              </label>
              <select
                name="recipe_id"
                value={formData.recipe_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">レシピを選択してください</option>
                {recipes.map((recipe) => (
                  <option key={recipe.recipe_id} value={recipe.recipe_id}>
                    {recipe.recipe_name} (v{recipe.version})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                入数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="pieces_per_package"
                value={formData.pieces_per_package}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.pieces_per_package ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.pieces_per_package && (
                <p className="mt-1 text-sm text-red-600">{errors.pieces_per_package}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                包装材料
              </label>
              <select
                name="packaging_material_id"
                value={formData.packaging_material_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">包装材料を選択してください</option>
                {packagingMaterials.map((material) => (
                  <option key={material.packaging_material_id} value={material.packaging_material_id}>
                    {material.recipe_display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                賞味期限（日数）
              </label>
              <input
                type="number"
                name="shelf_life_days"
                value={formData.shelf_life_days}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.shelf_life_days ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="30"
              />
              {errors.shelf_life_days && (
                <p className="mt-1 text-sm text-red-600">{errors.shelf_life_days}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                販売価格（円）
              </label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.selling_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="300"
              />
              {errors.selling_price && (
                <p className="mt-1 text-sm text-red-600">{errors.selling_price}</p>
              )}
            </div>

            {/* Profit Margin Display */}
            {recipeCost !== null && formData.selling_price && formData.pieces_per_package && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">利益率計算</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">レシピ原価:</span>
                    <span className="ml-2 font-medium">¥{recipeCost.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">1個あたり原価:</span>
                    <span className="ml-2 font-medium">
                      ¥{(recipeCost / parseInt(formData.pieces_per_package)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">販売価格:</span>
                    <span className="ml-2 font-medium">¥{formData.selling_price}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">利益率:</span>
                    <span className={`ml-2 font-medium ${profitMargin !== null && profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="under_review">検討中</option>
                <option value="trial">試作中</option>
                <option value="selling">販売中</option>
                <option value="discontinued">販売終了</option>
              </select>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(formData.status)}`}>
                  {getStatusLabel(formData.status)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '保存中...' : (product ? '更新' : '登録')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;