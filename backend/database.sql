-- Recipe Manager Database Schema

-- Recipe Categories Master
CREATE TABLE recipe_categories (
    category_id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients Master
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    common_name VARCHAR(200),
    recipe_display_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase History Master
CREATE TABLE purchase_history (
    id SERIAL PRIMARY KEY,
    purchase_date DATE NOT NULL,
    ingredient_id INTEGER REFERENCES ingredients(ingredient_id),
    price_excluding_tax DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    discount_rate DECIMAL(5,4) DEFAULT 0.00,
    supplier VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packaging Materials Master
CREATE TABLE packaging_materials (
    packaging_material_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    common_name VARCHAR(200),
    recipe_display_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes Master
CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    recipe_name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES recipe_categories(category_id),
    version INTEGER DEFAULT 1,
    complexity INTEGER CHECK (complexity >= 1 AND complexity <= 5),
    effort INTEGER CHECK (effort >= 1 AND effort <= 5),
    batch_size INTEGER NOT NULL,
    batch_unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Details Master
CREATE TABLE recipe_details (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(recipe_id),
    ingredient_id INTEGER REFERENCES ingredients(ingredient_id),
    usage_amount DECIMAL(10,3) NOT NULL,
    usage_unit VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, ingredient_id, display_order)
);

-- Products Master
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    recipe_id INTEGER REFERENCES recipes(recipe_id),
    pieces_per_package INTEGER NOT NULL,
    packaging_material_id INTEGER REFERENCES packaging_materials(packaging_material_id),
    shelf_life_days INTEGER,
    yield_per_batch INTEGER NOT NULL,
    selling_price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'under_review' CHECK (status IN ('under_review', 'trial', 'selling', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packaging Material Purchase History
CREATE TABLE packaging_purchase_history (
    id SERIAL PRIMARY KEY,
    purchase_date DATE NOT NULL,
    packaging_material_id INTEGER REFERENCES packaging_materials(packaging_material_id),
    price_excluding_tax DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    discount_rate DECIMAL(5,4) DEFAULT 0.00,
    supplier VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_purchase_history_ingredient_date ON purchase_history(ingredient_id, purchase_date);
CREATE INDEX idx_recipe_details_recipe_id ON recipe_details(recipe_id);
CREATE INDEX idx_recipes_category_id ON recipes(category_id);
CREATE INDEX idx_packaging_purchase_history_material_date ON packaging_purchase_history(packaging_material_id, purchase_date);