import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Dashboard() {
  const recipeCount = useLiveQuery(() => db.recipes.count());
  const ingredientCount = useLiveQuery(() => db.ingredients.count());

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Painel Principal</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Receitas Cadastradas</h3>
          <p className="text-4xl font-bold text-white mt-2">{recipeCount || 0}</p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Ingredientes</h3>
          <p className="text-4xl font-bold text-white mt-2">{ingredientCount || 0}</p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 opacity-50">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Ordens Pendentes</h3>
          <p className="text-4xl font-bold text-white mt-2">0</p>
        </div>
      </div>

      <div className="p-8 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30">
        <h3 className="text-xl font-bold text-white mb-2">Bem-vindo!</h3>
        <p className="text-slate-400">
          Seu sistema está rodando 100% offline. Comece adicionando ingredientes, depois crie receitas para gerar ordens de produção.
        </p>
      </div>
    </div>
  );
}
