import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RecipeList from './pages/RecipeList';
import RecipeForm from './pages/RecipeForm';
import IngredientList from './pages/IngredientList';
import ProductList from './pages/ProductList';
import PurchaseHistory from './pages/PurchaseHistory';
import EggMasterList from './components/EggMasterList';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id/edit" element={<RecipeForm />} />
          <Route path="/ingredients" element={<IngredientList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/purchase-history" element={<PurchaseHistory />} />
          <Route path="/egg-master" element={<EggMasterList />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;