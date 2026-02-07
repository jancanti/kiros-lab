import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ingredientsApi, productsApi, ordersApi } from '../lib/api';
import { migrateLegacyBackup } from '../lib/migration';
import { supabase } from '../lib/supabase';
import { Loader2, ScrollText, ShoppingBasket, AlertTriangle, DatabaseBackup, CheckCircle2, Calculator, ClipboardList, Cloud } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, ingredients: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    async function initDashboard() {
      try {
        const [recs, ings, ords] = await Promise.all([
          productsApi.getAll(),
          ingredientsApi.getAll(),
          ordersApi.getAll()
        ]);
        setStats({
          products: recs.length,
          ingredients: ings.length,
          orders: ords.length
        });

        // Check for legacy backup
        if (recs.length === 0 && ings.length === 0) {
          const { data } = await supabase.from('backups').select('id').eq('id', 1).single();
          if (data) setShowMigration(true);
        }
      } catch (error) {
        console.error('Dashboard stats failed:', error);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  const handleMigration = async () => {
    setMigrating(true);
    const result = await migrateLegacyBackup();
    if (result.success) {
      setMigrationDone(true);
      setShowMigration(false);
      // Refresh stats
      const [recs, ings, ords] = await Promise.all([
        productsApi.getAll(),
        ingredientsApi.getAll(),
        ordersApi.getAll()
      ]);
      setStats({
        recipes: recs.length,
        ingredients: ings.length,
        orders: ords.length
      });
    } else {
      alert('Erro na migração: ' + result.message);
    }
    setMigrating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Painel Principal</h2>
          <div className="relative flex items-center justify-center w-10 h-10 bg-brand/10 rounded-xl border border-brand/20 group">
            <Cloud size={22} className="text-brand/50 group-hover:text-brand transition-colors" />
            <CheckCircle2 size={10} className="absolute text-brand fill-background top-[18px]" />
          </div>
        </div>
        {(loading || migrating) && <Loader2 className="animate-spin text-brand" size={24} />}
      </div>

      {showMigration && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-4 text-amber-500 text-center md:text-left">
            <DatabaseBackup size={48} className="shrink-0" />
            <div>
              <h3 className="text-xl font-bold tracking-tight">Recuperar Dados</h3>
              <p className="text-muted-foreground text-sm">Detectamos dados do sistema antigo. Deseja restaurá-los agora?</p>
            </div>
          </div>
          <button
            onClick={handleMigration}
            disabled={migrating}
            className="w-full md:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {migrating ? <><Loader2 className="animate-spin" size={20} /> Restaurando...</> : 'Restaurar Tudo'}
          </button>
        </div>
      )}

      {migrationDone && (
        <div className="p-4 rounded-xl bg-brand/10 border border-brand/30 flex items-center gap-3 text-brand animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={24} />
          <span className="font-bold text-sm">Dados recuperados com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        <Link to="/calc" className="p-6 rounded-xl bg-surface border border-border relative overflow-hidden group hover:border-brand/50 transition-all hover:bg-brand/5">
          <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-20 group-hover:opacity-40 transition-opacity">
            <Calculator size={100} />
          </div>
          <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest relative z-10">Calculadora</h3>
          <p className="text-lg font-bold mt-4 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            Acessar ferramenta <CheckCircle2 size={14} className="text-brand" />
          </p>
        </Link>

        <Link to="/produtos" className="p-6 rounded-xl bg-surface border border-border relative overflow-hidden group hover:border-brand/50 transition-all hover:bg-brand/5">
          <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-20 group-hover:opacity-40 transition-opacity">
            <ScrollText size={100} />
          </div>
          <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest relative z-10">Produtos</h3>
          <p className="text-5xl font-black mt-2 relative z-10">
            {loading ? '...' : stats.products}
          </p>
        </Link>

        <Link to="/ingredientes" className="p-6 rounded-xl bg-surface border border-border relative overflow-hidden group hover:border-brand/50 transition-all hover:bg-brand/5">
          <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-20 group-hover:opacity-40 transition-opacity">
            <ShoppingBasket size={100} />
          </div>
          <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest relative z-10">Ingredientes</h3>
          <p className="text-5xl font-black mt-2 relative z-10">
            {loading ? '...' : stats.ingredients}
          </p>
        </Link>

        <Link to="/prod" className="p-6 rounded-xl bg-surface border border-border relative overflow-hidden group hover:border-brand/50 transition-all hover:bg-brand/5">
          <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-20 group-hover:opacity-40 transition-opacity">
            <ClipboardList size={100} />
          </div>
          <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest relative z-10">Ordens Salvas</h3>
          <p className="text-5xl font-black mt-2 relative z-10">
            {loading ? '...' : stats.orders}
          </p>
        </Link>
      </div>

    </div>
  );
}
