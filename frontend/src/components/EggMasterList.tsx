import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { EggMaster } from '../types';
import EggMasterForm from './EggMasterForm';

const EggMasterList: React.FC = () => {
  const [eggMasters, setEggMasters] = useState<EggMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEggMaster, setEditingEggMaster] = useState<EggMaster | undefined>();

  const fetchEggMasters = async () => {
    try {
      const data = await apiService.getEggMasters();
      setEggMasters(data);
    } catch (error) {
      console.error('Error fetching egg masters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEggMasters();
  }, []);

  const handleAdd = () => {
    setEditingEggMaster(undefined);
    setShowForm(true);
  };

  const handleEdit = (eggMaster: EggMaster) => {
    setEditingEggMaster(eggMaster);
    setShowForm(true);
  };

  const handleDelete = async (eggId: number) => {
    if (window.confirm('この卵マスタを削除しますか？')) {
      try {
        await apiService.deleteEggMaster(eggId);
        await fetchEggMasters();
      } catch (error) {
        console.error('Error deleting egg master:', error);
      }
    }
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setEditingEggMaster(undefined);
    await fetchEggMasters();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEggMaster(undefined);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">卵マスタ管理</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          新規追加
        </button>
      </div>

      {eggMasters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">卵マスタがまだ登録されていません。</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  全卵重量 (g)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  卵白重量 (g)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  卵黄重量 (g)
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
              {eggMasters.map((eggMaster) => (
                <tr key={eggMaster.egg_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eggMaster.egg_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eggMaster.whole_egg_weight}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eggMaster.egg_white_weight}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eggMaster.egg_yolk_weight}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(eggMaster.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(eggMaster)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(eggMaster.egg_id)}
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
        <EggMasterForm
          eggMaster={editingEggMaster}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default EggMasterList;