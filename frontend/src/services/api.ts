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
    return this.get<any[]>('/recipe-categories/');
  }

  createRecipeCategory(data: any) {
    return this.post<any>('/recipe-categories/', data);
  }

  // Egg Master
  getEggMasters() {
    return this.get<any[]>('/egg-master/');
  }

  createEggMaster(data: any) {
    return this.post<any>('/egg-master/', data);
  }

  getEggMaster(id: number) {
    return this.get<any>(`/egg-master/${id}`);
  }

  updateEggMaster(id: number, data: any) {
    return this.put<any>(`/egg-master/${id}`, data);
  }

  deleteEggMaster(id: number) {
    return this.delete<any>(`/egg-master/${id}`);
  }

  // Ingredients
  getIngredients() {
    return this.get<any[]>('/ingredients/');
  }

  createIngredient(data: any) {
    return this.post<any>('/ingredients/', data);
  }

  getIngredient(id: number) {
    return this.get<any>(`/ingredients/${id}`);
  }

  updateIngredient(id: number, data: any) {
    return this.put<any>(`/ingredients/${id}`, data);
  }

  deleteIngredient(id: number) {
    return this.delete<any>(`/ingredients/${id}`);
  }

  // Recipes
  getRecipes() {
    return this.get<any[]>('/recipes/');
  }

  createRecipe(data: any) {
    return this.post<any>('/recipes/', data);
  }

  getRecipe(id: number) {
    return this.get<any>(`/recipes/${id}`);
  }

  updateRecipe(id: number, data: any) {
    return this.put<any>(`/recipes/${id}`, data);
  }

  deleteRecipe(id: number) {
    return this.delete<any>(`/recipes/${id}`);
  }

  // Recipe Details
  getRecipeDetails(recipeId: number) {
    return this.get<any[]>(`/recipes/${recipeId}/details`);
  }

  createRecipeDetail(data: any) {
    return this.post<any>('/recipe-details/', data);
  }

  updateRecipeDetail(id: number, data: any) {
    return this.put<any>(`/recipe-details/${id}`, data);
  }

  deleteRecipeDetail(id: number) {
    return this.delete<any>(`/recipe-details/${id}`);
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

  updateProduct(id: number, data: any) {
    return this.put(`/products/${id}`, data);
  }

  deleteProduct(id: number) {
    return this.delete(`/products/${id}`);
  }

  // Purchase History
  getPurchaseHistory() {
    return this.get<any[]>('/purchase-history/');
  }

  createPurchaseHistory(data: any) {
    return this.post<any>('/purchase-history/', data);
  }

  updatePurchaseHistory(id: number, data: any) {
    return this.put<any>(`/purchase-history/${id}`, data);
  }

  deletePurchaseHistory(id: number) {
    return this.delete<any>(`/purchase-history/${id}`);
  }

  // Packaging Materials
  getPackagingMaterials() {
    return this.get('/packaging-materials/');
  }

  createPackagingMaterial(data: any) {
    return this.post('/packaging-materials/', data);
  }

  getPackagingMaterial(id: number) {
    return this.get(`/packaging-materials/${id}`);
  }

  updatePackagingMaterial(id: number, data: any) {
    return this.put(`/packaging-materials/${id}`, data);
  }

  deletePackagingMaterial(id: number) {
    return this.delete(`/packaging-materials/${id}`);
  }
}

export const apiService = new ApiService();