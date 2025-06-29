from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class RecipeCategory(Base):
    __tablename__ = "recipe_categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    sub_category = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    recipes = relationship("Recipe", back_populates="category")

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    ingredient_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False)
    common_name = Column(String(200))
    recipe_display_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    quantity_unit = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    purchase_history = relationship("PurchaseHistory", back_populates="ingredient")
    recipe_details = relationship("RecipeDetail", back_populates="ingredient")

class PurchaseHistory(Base):
    __tablename__ = "purchase_history"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_date = Column(Date, nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.ingredient_id"))
    price_excluding_tax = Column(DECIMAL(10,2), nullable=False)
    tax_rate = Column(DECIMAL(5,4), nullable=False, default=0.10)
    discount_rate = Column(DECIMAL(5,4), default=0.00)
    supplier = Column(String(200))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    ingredient = relationship("Ingredient", back_populates="purchase_history")

class PackagingMaterial(Base):
    __tablename__ = "packaging_materials"
    
    packaging_material_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False)
    common_name = Column(String(200))
    recipe_display_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    quantity_unit = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    products = relationship("Product", back_populates="packaging_material")
    packaging_purchase_history = relationship("PackagingPurchaseHistory", back_populates="packaging_material")

class Recipe(Base):
    __tablename__ = "recipes"
    
    recipe_id = Column(Integer, primary_key=True, index=True)
    recipe_name = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("recipe_categories.category_id"))
    version = Column(Integer, default=1)
    complexity = Column(Integer, CheckConstraint('complexity >= 1 AND complexity <= 5'))
    effort = Column(Integer, CheckConstraint('effort >= 1 AND effort <= 5'))
    batch_size = Column(Integer, nullable=False)
    batch_unit = Column(String(50), nullable=False, default='pieces')
    status = Column(String(20), default='draft', CheckConstraint("status IN ('draft', 'active', 'archived')"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    category = relationship("RecipeCategory", back_populates="recipes")
    recipe_details = relationship("RecipeDetail", back_populates="recipe")
    products = relationship("Product", back_populates="recipe")

class RecipeDetail(Base):
    __tablename__ = "recipe_details"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.recipe_id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.ingredient_id"))
    usage_amount = Column(DECIMAL(10,3), nullable=False)
    usage_unit = Column(String(50), nullable=False)
    display_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    recipe = relationship("Recipe", back_populates="recipe_details")
    ingredient = relationship("Ingredient", back_populates="recipe_details")

class Product(Base):
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.recipe_id"))
    pieces_per_package = Column(Integer, nullable=False)
    packaging_material_id = Column(Integer, ForeignKey("packaging_materials.packaging_material_id"))
    shelf_life_days = Column(Integer)
    yield_per_batch = Column(Integer, nullable=False)
    selling_price = Column(DECIMAL(10,2))
    status = Column(String(20), default='under_review', CheckConstraint("status IN ('under_review', 'trial', 'selling', 'discontinued')"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    recipe = relationship("Recipe", back_populates="products")
    packaging_material = relationship("PackagingMaterial", back_populates="products")

class PackagingPurchaseHistory(Base):
    __tablename__ = "packaging_purchase_history"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_date = Column(Date, nullable=False)
    packaging_material_id = Column(Integer, ForeignKey("packaging_materials.packaging_material_id"))
    price_excluding_tax = Column(DECIMAL(10,2), nullable=False)
    tax_rate = Column(DECIMAL(5,4), nullable=False, default=0.10)
    discount_rate = Column(DECIMAL(5,4), default=0.00)
    supplier = Column(String(200))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    packaging_material = relationship("PackagingMaterial", back_populates="packaging_purchase_history")