from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# Egg Master Schemas
class EggMasterBase(BaseModel):
    whole_egg_weight: Decimal = Field(default=Decimal('50.00'), ge=0, le=999.99)
    egg_white_weight: Decimal = Field(default=Decimal('30.00'), ge=0, le=999.99)
    egg_yolk_weight: Decimal = Field(default=Decimal('20.00'), ge=0, le=999.99)

class EggMasterCreate(EggMasterBase):
    pass

class EggMasterUpdate(EggMasterBase):
    whole_egg_weight: Optional[Decimal] = Field(None, ge=0, le=999.99)
    egg_white_weight: Optional[Decimal] = Field(None, ge=0, le=999.99)
    egg_yolk_weight: Optional[Decimal] = Field(None, ge=0, le=999.99)

class EggMaster(EggMasterBase):
    egg_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

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
    price_excluding_tax: Decimal = Field(..., ge=0, le=99999999.99)
    tax_rate: Decimal = Field(default=Decimal('0.10'), ge=0, le=1.0)
    discount_rate: Optional[Decimal] = Field(default=Decimal('0.00'), ge=0, le=1.0)
    supplier: Optional[str] = Field(None, max_length=200)

class PurchaseHistoryCreate(PurchaseHistoryBase):
    pass

class PurchaseHistoryUpdate(PurchaseHistoryBase):
    purchase_date: Optional[date] = None
    ingredient_id: Optional[int] = None
    price_excluding_tax: Optional[Decimal] = Field(None, ge=0, le=99999999.99)

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
    yield_per_batch: int = Field(..., gt=0)
    yield_unit: str = Field(default='pieces', max_length=50)
    status: str = Field(default='draft', pattern=r'^(draft|active|archived)$')

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(RecipeBase):
    recipe_name: Optional[str] = Field(None, max_length=200)
    batch_size: Optional[int] = Field(None, gt=0)
    yield_per_batch: Optional[int] = Field(None, gt=0)

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
    usage_amount: Decimal = Field(..., ge=0, le=9999999.999)
    usage_unit: str = Field(..., max_length=50)
    display_order: int = Field(..., ge=1)
    egg_type: Optional[str] = Field(None, pattern=r'^(whole_egg|egg_white|egg_yolk)$')

class RecipeDetailCreate(RecipeDetailBase):
    pass

class RecipeDetailUpdate(RecipeDetailBase):
    recipe_id: Optional[int] = None
    ingredient_id: Optional[int] = None
    usage_amount: Optional[Decimal] = Field(None, ge=0, le=9999999.999)
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
    selling_price: Optional[Decimal] = Field(None, ge=0, le=99999999.99)
    status: str = Field(default='under_review', pattern=r'^(under_review|trial|selling|discontinued)$')

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    product_name: Optional[str] = Field(None, max_length=200)
    pieces_per_package: Optional[int] = Field(None, gt=0)

class Product(ProductBase):
    product_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True