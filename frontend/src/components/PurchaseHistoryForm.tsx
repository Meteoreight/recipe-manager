import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PurchaseHistory, Ingredient } from '../types';

interface PurchaseHistoryFormProps {
  purchaseHistory?: PurchaseHistory;
  onSave: () => void;
  onCancel: () => void;
}

const PurchaseHistoryForm: React.FC<PurchaseHistoryFormProps> = ({ 
  purchaseHistory, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    ingredient_id: 0,
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0],
    price_excluding_tax: '',
    tax_rate: '0.10',
    discount_rate: '0.00'
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const data = await apiService.getIngredients();
        setIngredients(data);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setErrors({ submit: '原料データの取得に失敗しました。' });
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();

    if (purchaseHistory) {
      setFormData({
        ingredient_id: purchaseHistory.ingredient_id,
        supplier: purchaseHistory.supplier || '',
        purchase_date: purchaseHistory.purchase_date.split('T')[0],
        price_excluding_tax: purchaseHistory.price_excluding_tax,
        tax_rate: purchaseHistory.tax_rate,
        discount_rate: purchaseHistory.discount_rate || '0.00'
      });
    }
  }, [purchaseHistory]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.ingredient_id === 0) {
      newErrors.ingredient_id = '原料を選択してください';
    }

    if (!formData.supplier.trim()) {
      newErrors.supplier = '仕入先は必須です';
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = '仕入日は必須です';
    }

    if (!formData.price_excluding_tax || parseFloat(formData.price_excluding_tax) <= 0) {
      newErrors.price_excluding_tax = '税抜価格は正の数値で入力してください';
    }

    const taxRate = parseFloat(formData.tax_rate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
      newErrors.tax_rate = '税率は0.00から1.00の間で入力してください';
    }

    const discountRate = parseFloat(formData.discount_rate);
    if (isNaN(discountRate) || discountRate < 0 || discountRate > 1) {
      newErrors.discount_rate = '割引率は0.00から1.00の間で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        ingredient_id: Number(formData.ingredient_id)
      };

      if (purchaseHistory) {
        await apiService.updatePurchaseHistory(purchaseHistory.id, submitData);
      } else {
        await apiService.createPurchaseHistory(submitData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving purchase history:', error);
      setErrors({ submit: '保存中にエラーが発生しました。' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ingredient_id' ? Number(value) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2";
    return errors[fieldName] 
      ? `${baseClass} border-red-300 focus:ring-red-500` 
      : `${baseClass} border-gray-300 focus:ring-blue-500`;
  };

  const calculateTotalPrice = () => {
    const price = parseFloat(formData.price_excluding_tax);
    const taxRate = parseFloat(formData.tax_rate);
    const discountRate = parseFloat(formData.discount_rate);
    
    if (isNaN(price) || isNaN(taxRate) || isNaN(discountRate)) {
      return 0;
    }
    
    const discountedPrice = price * (1 - discountRate);
    const totalPrice = discountedPrice * (1 + taxRate);
    return totalPrice;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-1/2 max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {purchaseHistory ? '仕入れ履歴編集' : '仕入れ履歴追加'}
        </h3>
        
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                原料 <span className="text-red-500">*</span>
              </label>
              <select
                name="ingredient_id"
                value={formData.ingredient_id}
                onChange={handleChange}
                className={getInputClassName('ingredient_id')}
                disabled={saving}
              >
                <option value={0}>選択してください</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                    {ingredient.recipe_display_name}
                  </option>
                ))}
              </select>
              {errors.ingredient_id && (
                <p className="mt-1 text-sm text-red-600">{errors.ingredient_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                仕入先 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className={getInputClassName('supplier')}
                maxLength={200}
                disabled={saving}
              />
              {errors.supplier && (
                <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                仕入日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className={getInputClassName('purchase_date')}
                disabled={saving}
              />
              {errors.purchase_date && (
                <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                税抜価格 (円) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="price_excluding_tax"
                value={formData.price_excluding_tax}
                onChange={handleChange}
                className={getInputClassName('price_excluding_tax')}
                min="0"
                disabled={saving}
              />
              {errors.price_excluding_tax && (
                <p className="mt-1 text-sm text-red-600">{errors.price_excluding_tax}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                税率 <span className="text-red-500">*</span>
              </label>
              <select
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleChange}
                className={getInputClassName('tax_rate')}
                disabled={saving}
              >
                <option value="0.00">0% (非課税)</option>
                <option value="0.08">8% (軽減税率)</option>
                <option value="0.10">10% (標準税率)</option>
              </select>
              {errors.tax_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                割引率
              </label>
              <input
                type="number"
                step="0.01"
                name="discount_rate"
                value={formData.discount_rate}
                onChange={handleChange}
                className={getInputClassName('discount_rate')}
                min="0"
                max="1"
                disabled={saving}
              />
              {errors.discount_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_rate}</p>
              )}
            </div>
          </div>

          {/* Price Calculation Display */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">価格計算</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
              <div>
                <span className="text-gray-600">税抜価格:</span>
                <span className="ml-2 font-medium">
                  ¥{parseFloat(formData.price_excluding_tax || '0').toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">割引適用後:</span>
                <span className="ml-2 font-medium">
                  ¥{(parseFloat(formData.price_excluding_tax || '0') * (1 - parseFloat(formData.discount_rate))).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">税込合計:</span>
                <span className="ml-2 font-bold text-blue-600">
                  ¥{calculateTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className={`flex-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                saving
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-gray-500 hover:bg-gray-700 text-white'
              }`}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseHistoryForm;