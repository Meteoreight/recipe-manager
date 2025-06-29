from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# Recipe Category Schemas
class RecipeCategoryBase(BaseModel):
    category: str = Field(..., max_length=100)
    sub_category: Optional[str] = Field(None, max_length=100)

class RecipeCategoryCreate(RecipeCategoryBase):
    pass

class RecipeCategoryUpdate(RecipeCategoryBase):
    category: Optional[str] = Field(None, max_length=100)

class RecipeCategory(RecipeCategoryBase):
    category_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Ingredient Schemas
class IngredientBase(BaseModel):
    product_name: str = Field(..., max_length=200)
    common_name: Optional[str] = Field(None, max_length=200)
    recipe_display_name: str = Field(..., max_length=200)
    quantity: int = Field(..., gt=0)
    quantity_unit: str = Field(..., max_length=50)

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(IngredientBase):
    product_name: Optional[str] = Field(None, max_length=200)
    recipe_display_name: Optional[str] = Field(None, max_length=200)
    quantity: Optional[int] = Field(None, gt=0)
    quantity_unit: Optional[str] = Field(None, max_length=50)

class Ingredient(IngredientBase):
    ingredient_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Purchase History Schemas
class PurchaseHistoryBase(BaseModel):
    purchase_date: date
    ingredient_id: int
    price_excluding_tax: Decimal = Field(..., max_digits=10, decimal_places=2)
    tax_rate: Decimal = Field(default=Decimal('0.10'), max_digits=5, decimal_places=4)
    discount_rate: Optional[Decimal] = Field(default=Decimal('0.00'), max_digits=5, decimal_places=4)
    supplier: Optional[str] = Field(None, max_length=200)

class PurchaseHistoryCreate(PurchaseHistoryBase):
    pass

class PurchaseHistoryUpdate(PurchaseHistoryBase):
    purchase_date: Optional[date] = None
    ingredient_id: Optional[int] = None
    price_excluding_tax: Optional[Decimal] = Field(None, max_digits=10, decimal_places=2)

class PurchaseHistory(PurchaseHistoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Recipe Schemas
class RecipeBase(BaseModel):
    recipe_name: str = Field(..., max_length=200)
    category_id: Optional[int] = None
    version: int = Field(default=1, ge=1)
    complexity: Optional[int] = Field(None, ge=1, le=5)
    effort: Optional[int] = Field(None, ge=1, le=5)
    batch_size: int = Field(..., gt=0)
    batch_unit: str = Field(default='pieces', max_length=50)
    status: str = Field(default='draft', regex='^(draft|active|archived)$')

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(RecipeBase):
    recipe_name: Optional[str] = Field(None, max_length=200)
    batch_size: Optional[int] = Field(None, gt=0)

class Recipe(RecipeBase):
    recipe_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Recipe Detail Schemas
class RecipeDetailBase(BaseModel):
    recipe_id: int
    ingredient_id: int
    usage_amount: Decimal = Field(..., max_digits=10, decimal_places=3)
    usage_unit: str = Field(..., max_length=50)
    display_order: int = Field(..., ge=1)

class RecipeDetailCreate(RecipeDetailBase):
    pass

class RecipeDetailUpdate(RecipeDetailBase):
    recipe_id: Optional[int] = None
    ingredient_id: Optional[int] = None
    usage_amount: Optional[Decimal] = Field(None, max_digits=10, decimal_places=3)
    usage_unit: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = Field(None, ge=1)

class RecipeDetail(RecipeDetailBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Packaging Material Schemas
class PackagingMaterialBase(BaseModel):
    product_name: str = Field(..., max_length=200)
    common_name: Optional[str] = Field(None, max_length=200)
    recipe_display_name: str = Field(..., max_length=200)
    quantity: int = Field(..., gt=0)
    quantity_unit: str = Field(..., max_length=50)

class PackagingMaterialCreate(PackagingMaterialBase):
    pass

class PackagingMaterialUpdate(PackagingMaterialBase):
    product_name: Optional[str] = Field(None, max_length=200)
    recipe_display_name: Optional[str] = Field(None, max_length=200)
    quantity: Optional[int] = Field(None, gt=0)
    quantity_unit: Optional[str] = Field(None, max_length=50)

class PackagingMaterial(PackagingMaterialBase):
    packaging_material_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    product_name: str = Field(..., max_length=200)
    recipe_id: Optional[int] = None
    pieces_per_package: int = Field(..., gt=0)
    packaging_material_id: Optional[int] = None
    shelf_life_days: Optional[int] = Field(None, gt=0)
    yield_per_batch: int = Field(..., gt=0)
    selling_price: Optional[Decimal] = Field(None, max_digits=10, decimal_places=2)
    status: str = Field(default='under_review', regex='^(under_review|trial|selling|discontinued)$')

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    product_name: Optional[str] = Field(None, max_length=200)
    pieces_per_package: Optional[int] = Field(None, gt=0)
    yield_per_batch: Optional[int] = Field(None, gt=0)

class Product(ProductBase):
    product_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True