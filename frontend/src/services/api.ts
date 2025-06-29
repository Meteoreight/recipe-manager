const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Recipe Categories
  getRecipeCategories() {
    return this.get('/recipe-categories/');
  }

  createRecipeCategory(data: any) {
    return this.post('/recipe-categories/', data);
  }

  // Ingredients
  getIngredients() {
    return this.get('/ingredients/');
  }

  createIngredient(data: any) {
    return this.post('/ingredients/', data);
  }

  getIngredient(id: number) {
    return this.get(`/ingredients/${id}`);
  }

  // Recipes
  getRecipes() {
    return this.get('/recipes/');
  }

  createRecipe(data: any) {
    return this.post('/recipes/', data);
  }

  getRecipe(id: number) {
    return this.get(`/recipes/${id}`);
  }

  // Recipe Details
  getRecipeDetails(recipeId: number) {
    return this.get(`/recipe-details/recipe/${recipeId}`);
  }

  createRecipeDetail(data: any) {
    return this.post('/recipe-details/', data);
  }

  // Products
  getProducts() {
    return this.get('/products/');
  }

  createProduct(data: any) {
    return this.post('/products/', data);
  }

  getProduct(id: number) {
    return this.get(`/products/${id}`);
  }

  // Purchase History
  getPurchaseHistory() {
    return this.get('/purchase-history/');
  }

  createPurchaseHistory(data: any) {
    return this.post('/purchase-history/', data);
  }

  // Packaging Materials
  getPackagingMaterials() {
    return this.get('/packaging-materials/');
  }

  createPackagingMaterial(data: any) {
    return this.post('/packaging-materials/', data);
  }
}

export const apiService = new ApiService();