export interface RecipeCategory {
  category_id: number;
  category: string;
  sub_category?: string;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  ingredient_id: number;
  product_name: string;
  common_name?: string;
  recipe_display_name: string;
  quantity: number;
  quantity_unit: string;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  recipe_id: number;
  recipe_name: string;
  category_id?: number;
  version: number;
  complexity?: number;
  effort?: number;
  batch_size: number;
  batch_unit: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface RecipeDetail {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  usage_amount: string;
  usage_unit: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  recipe_id?: number;
  pieces_per_package: number;
  packaging_material_id?: number;
  shelf_life_days?: number;
  yield_per_batch: number;
  selling_price?: string;
  status: 'under_review' | 'trial' | 'selling' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface PurchaseHistory {
  id: number;
  purchase_date: string;
  ingredient_id: number;
  price_excluding_tax: string;
  tax_rate: string;
  discount_rate?: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export interface PackagingMaterial {
  packaging_material_id: number;
  product_name: string;
  common_name?: string;
  recipe_display_name: string;
  quantity: number;
  quantity_unit: string;
  created_at: string;
  updated_at: string;
}