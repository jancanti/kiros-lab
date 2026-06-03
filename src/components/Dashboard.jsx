import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ingredientsApi, productsApi, ordersApi, quotesApi } from '../lib/api';
import { migrateLegacyBackup } from '../lib/migration';
import { supabase } from '../lib/supabase';
import { 
  Loader2, 
  ScrollText, 
  ShoppingBasket, 
  AlertTriangle, 
  DatabaseBackup, 
  CheckCircle2, 
  Calculator, 
  ClipboardList, 
  Cloud, 
  Sparkles, 
  Coins, 
  Award,
  ArrowRight,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, ingredients: 0, orders: 0, quotes: 0 });
  const [avgCost, setAvgCost] = useState(0);
  const [topIngredient, setTopIngredient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  async function calculateMetrics(recs, ings) {
    // 1. Calculate average product cost
    let totalCostSum = 0;
    let productsWithCost = 0;

    recs.forEach(prod => {
      if (prod.ingredients && prod.ingredients.length > 0) {
        const prodCost = prod.ingredients.reduce((sum, item) => {
          const ing = ings.find(i => i.id === item.ingredientId);
          const cost = ing ? (ing.cost || 0) : 0;
          return sum + (item.quantity * cost);
        }, 0);
        totalCostSum += prodCost;
        productsWithCost++;
      }
    });

    const avg = productsWithCost > 0 ? (totalCostSum / productsWithCost) : 0;
    setAvgCost(avg);

    // 2. Find most expensive ingredient (highest cost per unit)
    let maxCostIng = null;
    ings.forEach(ing => {
      if (ing.cost && ing.cost > 0) {
        if (!maxCostIng || ing.cost > maxCostIng.cost) {
          maxCostIng = ing;
        }
      }
    });
    setTopIngredient(maxCostIng);
  }

  useEffect(() => {
    async function initDashboard() {
      try {
        const [recs, ings, ords, qts] = await Promise.all([
          productsApi.getAll(),
          ingredientsApi.getAll(),
          ordersApi.getAll(),
          quotesApi.getAll()
        ]);
        
        setStats({
          products: recs.length,
          ingredients: ings.length,
          orders: ords.length,
          quotes: qts?.length || 0
        });

        // Compute premium metrics
        await calculateMetrics(recs, ings);

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
      const [recs, ings, ords, qts] = await Promise.all([
        productsApi.getAll(),
        ingredientsApi.getAll(),
        ordersApi.getAll(),
        quotesApi.getAll()
      ]);
      
      setStats({
        products: recs.length,
        ingredients: ings.length,
        orders: ords.length,
        quotes: qts?.length || 0
      });

      await calculateMetrics(recs, ings);
    } else {
      alert('Erro na migração: ' + result.message);
    }
    setMigrating(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Upper header block */}
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-serif font-black tracking-widest uppercase">Painel Principal</h2>
          <div className="relative flex items-center justify-center w-10 h-10 bg-brand/10 rounded-xl border border-brand/20 group">
            <Cloud size={20} className="text-brand/50 group-hover:text-brand transition-colors" />
            <CheckCircle2 size={10} className="absolute text-brand fill-background top-[18px]" />
          </div>
        </div>
        {(loading || migrating) && <Loader2 className="animate-spin text-brand" size={24} />}
      </div>

      {/* Database Recovery Banner */}
      {showMigration && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-4 text-amber-500 text-center md:text-left">
            <DatabaseBackup size={44} className="shrink-0" />
            <div>
              <h3 className="text-lg font-bold tracking-tight uppercase font-serif">Recuperar Dados do Ateliê</h3>
              <p className="text-muted-foreground text-xs">Detectamos um backup do sistema antigo. Deseja restaurar suas fórmulas agora?</p>
            </div>
          </div>
          <button
            onClick={handleMigration}
            disabled={migrating}
            className="w-full md:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-xs tracking-wider uppercase"
          >
            {migrating ? <><Loader2 className="animate-spin" size={16} /> Restaurando...</> : 'Restaurar Tudo'}
          </button>
        </div>
      )}

      {migrationDone && (
        <div className="p-4 rounded-xl bg-brand/10 border border-brand/30 flex items-center gap-3 text-brand animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">Dados recuperados com sucesso no laboratório!</span>
        </div>
      )}

      {/* Main Grid: Modules & Scent Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
        
        {/* Left: Quick Access Modules */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Módulos do Laboratório</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Calculator */}
            <Link to="/calc" className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-brand/45 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[170px]">
              <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
                <Calculator size={140} />
              </div>
              <div>
                <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-brand/20">Ferramenta</span>
                <h4 className="text-xl font-serif font-bold mt-3 text-foreground group-hover:text-brand transition-colors">Calculadora</h4>
                <p className="text-muted-foreground text-xs mt-1">Cálculo científico de proporções de cera e essências.</p>
              </div>
              <p className="text-xs font-bold text-brand mt-4 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                Acessar balança <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </Link>

            {/* Products */}
            <Link to="/produtos" className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-brand/45 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[170px]">
              <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
                <ScrollText size={140} />
              </div>
              <div>
                <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-brand/20">Portfólio</span>
                <h4 className="text-xl font-serif font-bold mt-3 text-foreground group-hover:text-brand transition-colors">Produtos</h4>
                <p className="text-muted-foreground text-xs mt-1">Gerencie suas fórmulas de perfumes e velas artesanais.</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-black font-mono leading-none">{loading ? '...' : stats.products}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fórmulas</span>
              </div>
            </Link>

            {/* Ingredients */}
            <Link to="/ingredientes" className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-brand/45 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[170px]">
              <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
                <ShoppingBasket size={140} />
              </div>
              <div>
                <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-brand/20">Inventário</span>
                <h4 className="text-xl font-serif font-bold mt-3 text-foreground group-hover:text-brand transition-colors">Ingredientes</h4>
                <p className="text-muted-foreground text-xs mt-1">Relação de óleos essenciais, bases e insumos cadastrados.</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-black font-mono leading-none">{loading ? '...' : stats.ingredients}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Materiais</span>
              </div>
            </Link>

            {/* Quotes */}
            <Link to="/orcamentos" className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-brand/45 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[170px]">
              <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
                <FileText size={140} />
              </div>
              <div>
                <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-brand/20">Comercial</span>
                <h4 className="text-xl font-serif font-bold mt-3 text-foreground group-hover:text-brand transition-colors">Orçamentos</h4>
                <p className="text-muted-foreground text-xs mt-1">Crie propostas comerciais e cotações de preços em PDF.</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-black font-mono leading-none">{loading ? '...' : stats.quotes}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orçamentos</span>
              </div>
            </Link>

            {/* Production Orders */}
            <Link to="/prod" className="p-6 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-brand/45 hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col justify-between min-h-[170px]">
              <div className="absolute right-[-10px] top-[-10px] text-foreground/5 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
                <ClipboardList size={140} />
              </div>
              <div>
                <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-brand/20">Produção</span>
                <h4 className="text-xl font-serif font-bold mt-3 text-foreground group-hover:text-brand transition-colors">Planejamento</h4>
                <p className="text-muted-foreground text-xs mt-1">Crie lotes e consolide a lista de compras de materiais.</p>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-black font-mono leading-none">{loading ? '...' : stats.orders}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ordens Salvas</span>
              </div>
            </Link>

          </div>
        </div>

        {/* Right: Studio Premium Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Resumo do Ateliê</h3>
          
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[364px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-2xl rounded-full translate-x-10 -translate-y-10"></div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <Sparkles className="text-brand shrink-0 animate-pulse" size={18} />
                <h4 className="font-serif font-bold text-sm tracking-wide text-foreground uppercase">Métricas de Fragrância</h4>
              </div>

              {/* Metric 1: Avg Product Formulation Cost */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  <Coins size={12} className="text-brand" /> Custo Médio por Fórmula
                </div>
                <div className="text-2xl font-black font-mono text-foreground leading-none mt-1">
                  {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgCost)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Massa ponderada por ingrediente cadastrado.</p>
              </div>

              {/* Metric 2: Premium Ingredient */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  <Award size={12} className="text-brand" /> Matéria-Prima Mais Valiosa
                </div>
                {loading ? (
                  <div className="text-sm font-bold text-foreground mt-1">...</div>
                ) : topIngredient ? (
                  <div className="mt-1">
                    <div className="text-sm font-black text-foreground uppercase truncate max-w-full">
                      {topIngredient.name}
                    </div>
                    <div className="text-xs font-mono text-brand font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(topIngredient.cost)}
                      <span className="text-[9px] text-muted-foreground font-sans lowercase ml-1">por {topIngredient.unit}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1 italic">Nenhum ingrediente com custo</div>
                )}
              </div>
            </div>

            <div className="mt-6 p-3 bg-muted/30 border border-border/50 rounded-xl relative z-10 text-[10px] text-muted-foreground">
              Os valores e métricas são consolidados automaticamente a partir das fórmulas de produtos e preços inseridos em seu inventário de matérias-primas.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
