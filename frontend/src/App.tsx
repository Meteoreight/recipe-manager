import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import RecipeList from './pages/RecipeList';
import RecipeForm from './pages/RecipeForm';
import RecipeDetail from './pages/RecipeDetail';
import IngredientList from './pages/IngredientList';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import PurchaseHistory from './pages/PurchaseHistory';
import EggMasterList from './components/EggMasterList';
import NotificationContainer from './components/NotificationContainer';
import GlobalLoading from './components/GlobalLoading';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeForm />} />
            <Route path="/ingredients" element={<IngredientList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/purchase-history" element={<PurchaseHistory />} />
            <Route path="/egg-master" element={<EggMasterList />} />
          </Routes>
        </Layout>
        <NotificationContainer />
        <GlobalLoading />
      </Router>
    </AppProvider>
  );
}

export default App;