import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Ingredients from './components/Ingredients';
import Products from './components/Products';
import Orders from './components/Orders';
import EssenceCalculator from './components/EssenceCalculator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ingredientes" element={<Ingredients />} />
          <Route path="produtos" element={<Products />} />
          <Route path="prod" element={<Orders />} />
          <Route path="calc" element={<EssenceCalculator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
