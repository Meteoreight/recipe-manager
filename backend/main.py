from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal, engine, get_db
from models import Base
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Recipe Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3006", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Recipe Manager API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Egg Master endpoints
@app.post("/egg-master/", response_model=schemas.EggMaster)
def create_egg_master(egg_master: schemas.EggMasterCreate, db: Session = Depends(get_db)):
    db_egg_master = models.EggMaster(**egg_master.dict())
    db.add(db_egg_master)
    db.commit()
    db.refresh(db_egg_master)
    return db_egg_master

@app.get("/egg-master/", response_model=List[schemas.EggMaster])
def read_egg_masters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    egg_masters = db.query(models.EggMaster).offset(skip).limit(limit).all()
    return egg_masters

@app.get("/egg-master/{egg_id}", response_model=schemas.EggMaster)
def read_egg_master(egg_id: int, db: Session = Depends(get_db)):
    egg_master = db.query(models.EggMaster).filter(models.EggMaster.egg_id == egg_id).first()
    if egg_master is None:
        raise HTTPException(status_code=404, detail="Egg master not found")
    return egg_master

@app.put("/egg-master/{egg_id}", response_model=schemas.EggMaster)
def update_egg_master(egg_id: int, egg_master: schemas.EggMasterUpdate, db: Session = Depends(get_db)):
    db_egg_master = db.query(models.EggMaster).filter(models.EggMaster.egg_id == egg_id).first()
    if db_egg_master is None:
        raise HTTPException(status_code=404, detail="Egg master not found")
    
    update_data = egg_master.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_egg_master, field, value)
    
    db.commit()
    db.refresh(db_egg_master)
    return db_egg_master

@app.delete("/egg-master/{egg_id}")
def delete_egg_master(egg_id: int, db: Session = Depends(get_db)):
    db_egg_master = db.query(models.EggMaster).filter(models.EggMaster.egg_id == egg_id).first()
    if db_egg_master is None:
        raise HTTPException(status_code=404, detail="Egg master not found")
    
    db.delete(db_egg_master)
    db.commit()
    return {"message": "Egg master deleted successfully"}

# Recipe Categories endpoints
@app.post("/recipe-categories/", response_model=schemas.RecipeCategory)
def create_recipe_category(category: schemas.RecipeCategoryCreate, db: Session = Depends(get_db)):
    db_category = models.RecipeCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/recipe-categories/", response_model=List[schemas.RecipeCategory])
def read_recipe_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = db.query(models.RecipeCategory).offset(skip).limit(limit).all()
    return categories

@app.get("/recipe-categories/{category_id}", response_model=schemas.RecipeCategory)
def read_recipe_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.RecipeCategory).filter(models.RecipeCategory.category_id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Recipe category not found")
    return category

# Ingredients endpoints
@app.post("/ingredients/", response_model=schemas.Ingredient)
def create_ingredient(ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = models.Ingredient(**ingredient.dict())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

@app.get("/ingredients/", response_model=List[schemas.Ingredient])
def read_ingredients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ingredients = db.query(models.Ingredient).offset(skip).limit(limit).all()
    return ingredients

@app.get("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def read_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.ingredient_id == ingredient_id).first()
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

@app.put("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(ingredient_id: int, ingredient: schemas.IngredientUpdate, db: Session = Depends(get_db)):
    db_ingredient = db.query(models.Ingredient).filter(models.Ingredient.ingredient_id == ingredient_id).first()
    if db_ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    update_data = ingredient.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ingredient, field, value)
    
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

@app.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_ingredient = db.query(models.Ingredient).filter(models.Ingredient.ingredient_id == ingredient_id).first()
    if db_ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    db.delete(db_ingredient)
    db.commit()
    return {"message": "Ingredient deleted successfully"}

# Purchase History endpoints
@app.post("/purchase-history/", response_model=schemas.PurchaseHistory)
def create_purchase_history(purchase: schemas.PurchaseHistoryCreate, db: Session = Depends(get_db)):
    db_purchase = models.PurchaseHistory(**purchase.dict())
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

@app.get("/purchase-history/", response_model=List[schemas.PurchaseHistory])
def read_purchase_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    purchases = db.query(models.PurchaseHistory).offset(skip).limit(limit).all()
    return purchases

@app.get("/purchase-history/{purchase_id}", response_model=schemas.PurchaseHistory)
def read_purchase_history_item(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(models.PurchaseHistory).filter(models.PurchaseHistory.purchase_id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase history not found")
    return purchase

@app.put("/purchase-history/{purchase_id}", response_model=schemas.PurchaseHistory)
def update_purchase_history(purchase_id: int, purchase: schemas.PurchaseHistoryUpdate, db: Session = Depends(get_db)):
    db_purchase = db.query(models.PurchaseHistory).filter(models.PurchaseHistory.purchase_id == purchase_id).first()
    if db_purchase is None:
        raise HTTPException(status_code=404, detail="Purchase history not found")
    
    update_data = purchase.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_purchase, field, value)
    
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

@app.delete("/purchase-history/{purchase_id}")
def delete_purchase_history(purchase_id: int, db: Session = Depends(get_db)):
    db_purchase = db.query(models.PurchaseHistory).filter(models.PurchaseHistory.purchase_id == purchase_id).first()
    if db_purchase is None:
        raise HTTPException(status_code=404, detail="Purchase history not found")
    
    db.delete(db_purchase)
    db.commit()
    return {"message": "Purchase history deleted successfully"}

# Recipes endpoints
@app.post("/recipes/", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = models.Recipe(**recipe.dict())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.get("/recipes/", response_model=List[schemas.Recipe])
def read_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).offset(skip).limit(limit).all()
    return recipes

@app.get("/recipes/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(models.Recipe).filter(models.Recipe.recipe_id == recipe_id).first()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@app.put("/recipes/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.recipe_id == recipe_id).first()
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    update_data = recipe.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_recipe, field, value)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.recipe_id == recipe_id).first()
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Delete associated recipe details first
    db.query(models.RecipeDetail).filter(models.RecipeDetail.recipe_id == recipe_id).delete()
    
    db.delete(db_recipe)
    db.commit()
    return {"message": "Recipe deleted successfully"}

@app.get("/recipes/{recipe_id}/details", response_model=List[schemas.RecipeDetail])
def read_recipe_details(recipe_id: int, db: Session = Depends(get_db)):
    details = db.query(models.RecipeDetail).filter(models.RecipeDetail.recipe_id == recipe_id).order_by(models.RecipeDetail.display_order).all()
    return details

# Recipe Details endpoints
@app.post("/recipe-details/", response_model=schemas.RecipeDetail)
def create_recipe_detail(detail: schemas.RecipeDetailCreate, db: Session = Depends(get_db)):
    db_detail = models.RecipeDetail(**detail.dict())
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    return db_detail

@app.get("/recipe-details/recipe/{recipe_id}", response_model=List[schemas.RecipeDetail])
def read_recipe_details_alt(recipe_id: int, db: Session = Depends(get_db)):
    details = db.query(models.RecipeDetail).filter(models.RecipeDetail.recipe_id == recipe_id).order_by(models.RecipeDetail.display_order).all()
    return details

@app.put("/recipe-details/{detail_id}", response_model=schemas.RecipeDetail)
def update_recipe_detail(detail_id: int, detail: schemas.RecipeDetailUpdate, db: Session = Depends(get_db)):
    db_detail = db.query(models.RecipeDetail).filter(models.RecipeDetail.id == detail_id).first()
    if db_detail is None:
        raise HTTPException(status_code=404, detail="Recipe detail not found")
    
    update_data = detail.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_detail, field, value)
    
    db.commit()
    db.refresh(db_detail)
    return db_detail

@app.delete("/recipe-details/{detail_id}")
def delete_recipe_detail(detail_id: int, db: Session = Depends(get_db)):
    db_detail = db.query(models.RecipeDetail).filter(models.RecipeDetail.id == detail_id).first()
    if db_detail is None:
        raise HTTPException(status_code=404, detail="Recipe detail not found")
    
    db.delete(db_detail)
    db.commit()
    return {"message": "Recipe detail deleted successfully"}

# Recipe Categories endpoints
@app.get("/recipe-categories/", response_model=List[schemas.RecipeCategory])
def read_recipe_categories(db: Session = Depends(get_db)):
    categories = db.query(models.RecipeCategory).all()
    return categories

@app.post("/recipe-categories/", response_model=schemas.RecipeCategory)
def create_recipe_category(category: schemas.RecipeCategoryCreate, db: Session = Depends(get_db)):
    db_category = models.RecipeCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Packaging Materials endpoints
@app.post("/packaging-materials/", response_model=schemas.PackagingMaterial)
def create_packaging_material(material: schemas.PackagingMaterialCreate, db: Session = Depends(get_db)):
    db_material = models.PackagingMaterial(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

@app.get("/packaging-materials/", response_model=List[schemas.PackagingMaterial])
def read_packaging_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    materials = db.query(models.PackagingMaterial).offset(skip).limit(limit).all()
    return materials

@app.get("/packaging-materials/{material_id}", response_model=schemas.PackagingMaterial)
def read_packaging_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(models.PackagingMaterial).filter(models.PackagingMaterial.packaging_material_id == material_id).first()
    if material is None:
        raise HTTPException(status_code=404, detail="Packaging material not found")
    return material

@app.put("/packaging-materials/{material_id}", response_model=schemas.PackagingMaterial)
def update_packaging_material(material_id: int, material: schemas.PackagingMaterialUpdate, db: Session = Depends(get_db)):
    db_material = db.query(models.PackagingMaterial).filter(models.PackagingMaterial.packaging_material_id == material_id).first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="Packaging material not found")
    
    update_data = material.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_material, field, value)
    
    db.commit()
    db.refresh(db_material)
    return db_material

@app.delete("/packaging-materials/{material_id}")
def delete_packaging_material(material_id: int, db: Session = Depends(get_db)):
    db_material = db.query(models.PackagingMaterial).filter(models.PackagingMaterial.packaging_material_id == material_id).first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="Packaging material not found")
    
    db.delete(db_material)
    db.commit()
    return {"ok": True}

# Products endpoints
@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@app.get("/products/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.product_id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)