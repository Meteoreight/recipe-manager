import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Recipe, RecipeDetail, Ingredient, RecipeCategory, EggMaster } from '../types';
import RecipeCostSummary from './RecipeCostSummary';

const RecipeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    recipe_name: '',
    category_id: '',
    version: 1,
    complexity: '',
    effort: '',
    batch_size: 1,
    batch_unit: 'pieces',
    yield_per_batch: 1,
    yield_unit: 'pieces',
    status: 'draft' as 'draft' | 'active' | 'archived'
  });

  const [recipeDetails, setRecipeDetails] = useState<RecipeDetail[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [eggMasters, setEggMasters] = useState<EggMaster[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingredientsData, categoriesData, eggMastersData] = await Promise.all([
          apiService.getIngredients(),
          apiService.getRecipeCategories(),
          apiService.getEggMasters()
        ]);

        setIngredients(ingredientsData);
        setCategories(categoriesData);
        setEggMasters(eggMastersData);

        if (isEdit && id) {
          const [recipe, details] = await Promise.all([
            apiService.getRecipe(Number(id)),
            apiService.getRecipeDetails(Number(id))
          ]);

          setFormData({
            recipe_name: recipe.recipe_name,
            category_id: recipe.category_id?.toString() || '',
            version: recipe.version,
            complexity: recipe.complexity?.toString() || '',
            effort: recipe.effort?.toString() || '',
            batch_size: recipe.batch_size,
            batch_unit: recipe.batch_unit,
            yield_per_batch: recipe.yield_per_batch,
            yield_unit: recipe.yield_unit,
            status: recipe.status
          });

          setRecipeDetails(details);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ submit: 'データの読み込みに失敗しました。' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isEdit, id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.recipe_name.trim()) {
      newErrors.recipe_name = 'レシピ名は必須です';
    }

    if (formData.batch_size <= 0) {
      newErrors.batch_size = 'バッチサイズは1以上で入力してください';
    }

    if (formData.yield_per_batch <= 0) {
      newErrors.yield_per_batch = '出来高は1以上で入力してください';
    }

    if (recipeDetails.length === 0) {
      newErrors.ingredients = '原料を最低1つ追加してください';
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
      const recipeData = {
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        complexity: formData.complexity ? Number(formData.complexity) : null,
        effort: formData.effort ? Number(formData.effort) : null
      };

      let recipe: Recipe;
      if (isEdit && id) {
        recipe = await apiService.updateRecipe(Number(id), recipeData);
      } else {
        recipe = await apiService.createRecipe(recipeData);
      }

      // Save recipe details
      for (const detail of recipeDetails) {
        if (detail.id) {
          await apiService.updateRecipeDetail(detail.id, detail);
        } else {
          await apiService.createRecipeDetail({
            ...detail,
            recipe_id: recipe.recipe_id
          });
        }
      }

      navigate('/recipes');
    } catch (error) {
      console.error('Error saving recipe:', error);
      setErrors({ submit: '保存中にエラーが発生しました。' });
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    const newDetail: RecipeDetail = {
      id: 0,
      recipe_id: 0,
      ingredient_id: 0,
      usage_amount: '0',
      usage_unit: 'g',
      display_order: recipeDetails.length + 1,
      egg_type: undefined,
      created_at: '',
      updated_at: ''
    };
    setRecipeDetails([...recipeDetails, newDetail]);
  };

  const updateIngredient = (index: number, field: keyof RecipeDetail, value: any) => {
    const updated = [...recipeDetails];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeDetails(updated);
  };

  const removeIngredient = (index: number) => {
    const updated = recipeDetails.filter((_, i) => i !== index);
    // Reorder display_order
    updated.forEach((detail, i) => {
      detail.display_order = i + 1;
    });
    setRecipeDetails(updated);
  };

  const getIngredientName = (ingredientId: number) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient ? ingredient.recipe_display_name : '';
  };

  const isEggIngredient = (ingredientId: number) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient?.recipe_display_name === '卵';
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
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'レシピ編集' : 'レシピ作成'}
        </h1>
        <button
          onClick={() => navigate('/recipes')}
          className="text-gray-600 hover:text-gray-900"
        >
          一覧に戻る
        </button>
      </div>

      {errors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Recipe Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              基本情報
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  レシピ名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.recipe_name}
                  onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.recipe_name 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={saving}
                />
                {errors.recipe_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipe_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="">選択してください</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.category} {category.sub_category && `- ${category.sub_category}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  難易度 (1-5)
                </label>
                <select
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="">選択してください</option>
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作業量 (1-5)
                </label>
                <select
                  value={formData.effort}
                  onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="">選択してください</option>
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch and Yield Information */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  バッチサイズ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.batch_size}
                  onChange={(e) => setFormData({ ...formData, batch_size: Number(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.batch_size 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  min="1"
                  disabled={saving}
                />
                {errors.batch_size && (
                  <p className="mt-1 text-sm text-red-600">{errors.batch_size}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  バッチ単位
                </label>
                <select
                  value={formData.batch_unit}
                  onChange={(e) => setFormData({ ...formData, batch_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="pieces">個</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="servings">人分</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  出来高 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.yield_per_batch}
                  onChange={(e) => setFormData({ ...formData, yield_per_batch: Number(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.yield_per_batch 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  min="1"
                  disabled={saving}
                />
                {errors.yield_per_batch && (
                  <p className="mt-1 text-sm text-red-600">{errors.yield_per_batch}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  出来高単位
                </label>
                <select
                  value={formData.yield_unit}
                  onChange={(e) => setFormData({ ...formData, yield_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="pieces">個</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="servings">人分</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' | 'archived' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="draft">下書き</option>
                <option value="active">有効</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cost Information */}
        <RecipeCostSummary
          recipeDetails={recipeDetails}
          batchSize={formData.batch_size}
          batchUnit={formData.batch_unit}
          yieldPerBatch={formData.yield_per_batch}
          yieldUnit={formData.yield_unit}
        />

        {/* Recipe Ingredients */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                原料配合
              </h3>
              <button
                type="button"
                onClick={addIngredient}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                disabled={saving}
              >
                原料追加
              </button>
            </div>

            {errors.ingredients && (
              <p className="mb-4 text-sm text-red-600">{errors.ingredients}</p>
            )}

            {recipeDetails.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                原料が追加されていません。「原料追加」ボタンで原料を追加してください。
              </p>
            ) : (
              <div className="space-y-4">
                {recipeDetails.map((detail, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          原料
                        </label>
                        <select
                          value={detail.ingredient_id}
                          onChange={(e) => updateIngredient(index, 'ingredient_id', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        >
                          <option value={0}>選択してください</option>
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                              {ingredient.recipe_display_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          使用量
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={detail.usage_amount}
                          onChange={(e) => updateIngredient(index, 'usage_amount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          単位
                        </label>
                        <select
                          value={detail.usage_unit}
                          onChange={(e) => updateIngredient(index, 'usage_unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="個">個</option>
                          <option value="袋">袋</option>
                        </select>
                      </div>

                      {isEggIngredient(detail.ingredient_id) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            卵の種別
                          </label>
                          <select
                            value={detail.egg_type || ''}
                            onChange={(e) => updateIngredient(index, 'egg_type', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={saving}
                          >
                            <option value="">選択してください</option>
                            <option value="whole_egg">全卵</option>
                            <option value="egg_white">卵白</option>
                            <option value="egg_yolk">卵黄</option>
                          </select>
                        </div>
                      )}

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                          disabled={saving}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3">
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
            onClick={() => navigate('/recipes')}
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
  );
};

export default RecipeForm;