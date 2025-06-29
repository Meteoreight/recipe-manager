import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PurchaseHistory, Ingredient } from '../types';
import PurchaseHistoryForm from '../components/PurchaseHistoryForm';

const PurchaseHistoryPage: React.FC = () => {
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseHistory | undefined>();
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    try {
      setError('');
      const [purchaseData, ingredientData] = await Promise.all([
        apiService.getPurchaseHistory(),
        apiService.getIngredients()
      ]);
      setPurchaseHistory(purchaseData);
      setIngredients(ingredientData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('データの取得に失敗しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingPurchase(undefined);
    setShowForm(true);
  };

  const handleEdit = (purchase: PurchaseHistory) => {
    setEditingPurchase(purchase);
    setShowForm(true);
  };

  const handleDelete = async (purchaseId: number) => {
    if (window.confirm('この仕入れ履歴を削除しますか？')) {
      try {
        await apiService.deletePurchaseHistory(purchaseId);
        await fetchData();
        setError('');
      } catch (error) {
        console.error('Error deleting purchase history:', error);
        setError('仕入れ履歴の削除に失敗しました。もう一度お試しください。');
      }
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setEditingPurchase(undefined);
    await fetchData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPurchase(undefined);
  };

  const getIngredientName = (ingredientId: number) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient ? ingredient.recipe_display_name : '不明';
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(parseFloat(price));
  };

  const calculateTotalPrice = (priceExcludingTax: string, taxRate: string, discountRate?: string) => {
    const price = parseFloat(priceExcludingTax);
    const tax = parseFloat(taxRate);
    const discount = parseFloat(discountRate || '0');
    
    const discountedPrice = price * (1 - discount);
    const totalPrice = discountedPrice * (1 + tax);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">仕入れ履歴</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          新規仕入れ登録
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {purchaseHistory.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500">仕入れ履歴が登録されていません。</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原料名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  仕入先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  仕入日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  税抜価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  税率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  割引率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  税込合計
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseHistory.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getIngredientName(purchase.ingredient_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(purchase.purchase_date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(purchase.price_excluding_tax)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(parseFloat(purchase.tax_rate) * 100).toFixed(0)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.discount_rate ? (parseFloat(purchase.discount_rate) * 100).toFixed(0) + '%' : '0%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatPrice(calculateTotalPrice(purchase.price_excluding_tax, purchase.tax_rate, purchase.discount_rate).toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(purchase)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(purchase.id)}
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
        <PurchaseHistoryForm
          purchaseHistory={editingPurchase}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default PurchaseHistoryPage;