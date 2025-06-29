import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { EggMaster } from '../types';

interface EggMasterFormProps {
  eggMaster?: EggMaster;
  onSave: () => void;
  onCancel: () => void;
}

const EggMasterForm: React.FC<EggMasterFormProps> = ({ eggMaster, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    whole_egg_weight: '50.00',
    egg_white_weight: '30.00',
    egg_yolk_weight: '20.00'
  });

  useEffect(() => {
    if (eggMaster) {
      setFormData({
        whole_egg_weight: eggMaster.whole_egg_weight,
        egg_white_weight: eggMaster.egg_white_weight,
        egg_yolk_weight: eggMaster.egg_yolk_weight
      });
    }
  }, [eggMaster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (eggMaster) {
        await apiService.updateEggMaster(eggMaster.egg_id, formData);
      } else {
        await apiService.createEggMaster(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving egg master:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {eggMaster ? '卵マスタ編集' : '卵マスタ追加'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              全卵重量 (g)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.whole_egg_weight}
              onChange={(e) => setFormData({ ...formData, whole_egg_weight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卵白重量 (g)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.egg_white_weight}
              onChange={(e) => setFormData({ ...formData, egg_white_weight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卵黄重量 (g)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.egg_yolk_weight}
              onChange={(e) => setFormData({ ...formData, egg_yolk_weight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EggMasterForm;