import React, { useState, useEffect } from 'react';
import { ingredientsApi, recipesApi } from '../lib/api';
import { Loader2, ScrollText, ShoppingBasket, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ recipes: 0, ingredients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [recs, ings] = await Promise.all([
          recipesApi.getAll(),
          ingredientsApi.getAll()
        ]);
        setStats({
          recipes: recs.length,
          ingredients: ings.length
        });
      } catch (error) {
        console.error('Dashboard stats failed:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Painel Principal</h2>
        {loading && <Loader2 className="animate-spin text-blue-500" size={24} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] text-slate-800 opacity-20 group-hover:opacity-40 transition-opacity">
            <ScrollText size={100} />
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10">Receitas</h3>
          <p className="text-5xl font-black text-white mt-2 relative z-10">
            {loading ? '...' : stats.recipes}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] text-slate-800 opacity-20 group-hover:opacity-40 transition-opacity">
            <ShoppingBasket size={100} />
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10">Ingredientes</h3>
          <p className="text-5xl font-black text-white mt-2 relative z-10">
            {loading ? '...' : stats.ingredients}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800/50 flex items-center justify-center border-dashed">
          <div className="text-center">
            <AlertTriangle className="mx-auto text-slate-700 mb-2" size={24} />
            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Modo Nuvem Ativo</p>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-slate-900 border border-blue-500/20 shadow-xl">
        <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">Sincronização Ativada ✨</h3>
        <p className="text-slate-400 max-w-2xl leading-relaxed">
          Seu sistema agora salva tudo diretamente no **Supabase**. Isso significa que seus dados são os mesmos no computador,
          tablet ou celular, sem necessidade de backup manual.
        </p>
        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase border border-green-500/20">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Online & Sincronizado
          </div>
        </div>
      </div>
    </div>
  );
}
