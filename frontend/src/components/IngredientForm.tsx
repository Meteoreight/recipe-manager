import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Ingredient } from '../types';

interface IngredientFormProps {
  ingredient?: Ingredient;
  onSave: () => void;
  onCancel: () => void;
}

const IngredientForm: React.FC<IngredientFormProps> = ({ ingredient, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    common_name: '',
    recipe_display_name: '',
    quantity: 1,
    quantity_unit: 'g'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ingredient) {
      setFormData({
        product_name: ingredient.product_name,
        common_name: ingredient.common_name || '',
        recipe_display_name: ingredient.recipe_display_name,
        quantity: ingredient.quantity,
        quantity_unit: ingredient.quantity_unit
      });
    }
  }, [ingredient]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.product_name.trim()) {
      newErrors.product_name = '商品名は必須です';
    } else if (formData.product_name.length > 200) {
      newErrors.product_name = '商品名は200文字以内で入力してください';
    }
    
    if (!formData.recipe_display_name.trim()) {
      newErrors.recipe_display_name = 'レシピ表示名は必須です';
    } else if (formData.recipe_display_name.length > 200) {
      newErrors.recipe_display_name = 'レシピ表示名は200文字以内で入力してください';
    }
    
    if (formData.common_name && formData.common_name.length > 200) {
      newErrors.common_name = '一般名称は200文字以内で入力してください';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = '数量は1以上で入力してください';
    }
    
    if (!formData.quantity_unit.trim()) {
      newErrors.quantity_unit = '単位は必須です';
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
      if (ingredient) {
        await apiService.updateIngredient(ingredient.ingredient_id, formData);
      } else {
        await apiService.createIngredient(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      setErrors({ submit: '保存中にエラーが発生しました。もう一度お試しください。' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
    // Clear error when user starts typing
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {ingredient ? '原料編集' : '原料追加'}
        </h3>
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.submit}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className={getInputClassName('product_name')}
              maxLength={200}
              disabled={saving}
            />
            {errors.product_name && (
              <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              一般名称
            </label>
            <input
              type="text"
              name="common_name"
              value={formData.common_name}
              onChange={handleChange}
              className={getInputClassName('common_name')}
              maxLength={200}
              disabled={saving}
            />
            {errors.common_name && (
              <p className="mt-1 text-sm text-red-600">{errors.common_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レシピ表示名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="recipe_display_name"
              value={formData.recipe_display_name}
              onChange={handleChange}
              className={getInputClassName('recipe_display_name')}
              maxLength={200}
              disabled={saving}
            />
            {errors.recipe_display_name && (
              <p className="mt-1 text-sm text-red-600">{errors.recipe_display_name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={getInputClassName('quantity')}
                min="1"
                disabled={saving}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                単位 <span className="text-red-500">*</span>
              </label>
              <select
                name="quantity_unit"
                value={formData.quantity_unit}
                onChange={handleChange}
                className={getInputClassName('quantity_unit')}
                disabled={saving}
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="個">個</option>
                <option value="袋">袋</option>
                <option value="缶">缶</option>
                <option value="本">本</option>
              </select>
              {errors.quantity_unit && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity_unit}</p>
              )}
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

export default IngredientForm;