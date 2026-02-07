import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Ingredients from './components/Ingredients';
import Recipes from './components/Recipes';
import Orders from './components/Orders';
import EssenceCalculator from './components/EssenceCalculator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="orders" element={<Orders />} />
          <Route path="essence" element={<EssenceCalculator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
