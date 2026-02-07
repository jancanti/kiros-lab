import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Ingredients from './components/Ingredients';
import Recipes from './components/Recipes';
import Orders from './components/Orders';
import EssenceCalculator from './components/EssenceCalculator';
import { db } from './db/db';
import { restoreFromBackup } from './lib/backup';

function App() {
  // Initial setup: Restore backup if empty and run migrations
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Try to restore from backup server if DB is empty
      await restoreFromBackup(db);

      // 2. Run migrations (units -> un)
      try {
        const ingredients = await db.ingredients.toArray();
        for (const ing of ingredients) {
          if (ing.unit === 'units') {
            await db.ingredients.update(ing.id, { unit: 'un' });
          }
        }

        const recipes = await db.recipes.toArray();
        for (const recipe of recipes) {
          const hasUnits = recipe.ingredients.some(ing => ing.unit === 'units');
          if (hasUnits) {
            const updatedIngredients = recipe.ingredients.map(ing =>
              ing.unit === 'units' ? { ...ing, unit: 'un' } : ing
            );
            await db.recipes.update(recipe.id, { ingredients: updatedIngredients });
          }
        }
        console.log('Setup completed');
      } catch (error) {
        console.error('Migration failed:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="orders" element={<Orders />} />
          <Route path="essence" element={<EssenceCalculator />} />
          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
