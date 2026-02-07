import React, { useState, useEffect } from 'react';
import { productsApi, ordersApi } from '../lib/api';
import { Calculator, ClipboardList, Plus, Trash2, Loader2, Search, X, Save, History, ChevronRight, ChevronDown, Calendar, Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Orders() {
    const [products, setProducts] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Searchable recipe state
    const [recipeSearch, setRecipeSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [quantity, setQuantity] = useState('');

    // List of recipes to produce (staging)
    const [productionList, setProductionList] = useState([]);

    // Aggregated requirements
    const [requirements, setRequirements] = useState(null);

    // View state
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recs, ords] = await Promise.all([
                productsApi.getAll(),
                ordersApi.getAll()
            ]);
            setProducts(recs);
            setPastOrders(ords);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToProductionList = () => {
        if (!selectedRecipeId || !quantity) return;
        const recipe = products.find(r => r.id === selectedRecipeId);
        if (!recipe) return;

        setProductionList(prev => [
            ...prev,
            {
                recipeId: recipe.id,
                recipeName: recipe.name,
                targetQuantity: Number(quantity),
                recipeYield: recipe.yield,
                ingredients: recipe.ingredients
            }
        ]);

        // Reset inputs
        setSelectedRecipeId('');
        setQuantity('');
        setRecipeSearch('');
        setRequirements(null);
    };

    const removeFromStaging = (index) => {
        setProductionList(prev => prev.filter((_, i) => i !== index));
        setRequirements(null);
    };

    const calculateRequirements = () => {
        if (productionList.length === 0) return;

        const aggregatedIngredients = {};

        productionList.forEach(item => {
            const ratio = item.targetQuantity / item.recipeYield;

            item.ingredients.forEach(ing => {
                if (!aggregatedIngredients[ing.ingredientId]) {
                    aggregatedIngredients[ing.ingredientId] = {
                        name: ing.name,
                        unit: ing.unit,
                        requiredQty: 0
                    };
                }
                aggregatedIngredients[ing.ingredientId].requiredQty += (ing.quantity * ratio);
            });
        });

        setRequirements(Object.values(aggregatedIngredients).sort((a, b) => a.name.localeCompare(b.name)));
    };

    const saveOrder = async () => {
        if (!requirements || productionList.length === 0) return;

        setSaving(true);
        try {
            const orderData = {
                date: new Date().toISOString(),
                recipe_name: productionList.map(p => `${p.targetQuantity}x ${p.recipeName}`).join(', '),
                quantity: productionList.reduce((acc, p) => acc + p.targetQuantity, 0),
                items: requirements // Store the calculated requirements
            };

            await ordersApi.add(orderData);
            setProductionList([]);
            setRequirements(null);
            fetchData(); // Refresh history
            alert('Ordem salva com sucesso!');
        } catch (error) {
            console.error('Failed to save order:', error);
            alert('Erro ao salvar ordem.');
        } finally {
            setSaving(false);
        }
    };

    const deleteOrder = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Excluir este registro histórico?')) {
            try {
                await ordersApi.delete(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete history item:', error);
            }
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Planejamento de Produção</h2>
                {(loading || saving) && <Loader2 className="animate-spin text-brand" size={24} />}
            </div>

            {/* Selection Section */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl rounded-full translate-x-16 -translate-y-16"></div>

                <div className="flex items-center gap-3 mb-8 font-bold relative z-10">
                    <div className="bg-brand/20 p-3 rounded-xl text-brand">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl uppercase tracking-tighter">Criar Nova Ordem</h3>
                        <p className="text-muted-foreground text-xs font-normal">Selecione os produtos e quantidades</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
                    {/* Searchable input */}
                    <div className="md:col-span-7 space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Produto</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={recipeSearch}
                                onChange={(e) => {
                                    setRecipeSearch(e.target.value);
                                    setIsDropdownOpen(true);
                                    if (!e.target.value) setSelectedRecipeId('');
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Buscar produto..."
                                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 pl-11 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                            />
                            <Search className="absolute left-4 top-4 text-muted-foreground" size={18} />
                            {recipeSearch && (
                                <button
                                    onClick={() => { setRecipeSearch(''); setSelectedRecipeId(''); setIsDropdownOpen(false); }}
                                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {isDropdownOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                {products
                                    ?.filter(r => r.name.toLowerCase().includes(recipeSearch.toLowerCase()))
                                    .map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => {
                                                setSelectedRecipeId(r.id);
                                                setRecipeSearch(r.name);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-4 py-3 hover:bg-slate-800 cursor-pointer text-sm text-slate-300 flex justify-between items-center group"
                                        >
                                            <span className="group-hover:text-brand transition-colors font-bold">{r.name}</span>
                                            <span className="text-[10px] bg-background px-2 py-1 rounded text-muted-foreground uppercase border border-border/50">Rend: {r.yield} un</span>
                                        </div>
                                    ))}
                                {products?.length === 0 && <div className="p-4 text-muted-foreground text-sm italic">Nenhum produto encontrado</div>}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantidade</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-center font-bold transition-all"
                            placeholder="0"
                        />
                    </div>

                    <button
                        onClick={addToProductionList}
                        disabled={!selectedRecipeId || !quantity}
                        className="md:col-span-3 bg-brand hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,125,83,0.3)] active:scale-95 shadow-brand/20 uppercase"
                    >
                        <Plus size={18} /> ADICIONAR
                    </button>
                </div>
            </div>

            {/* Current Order (Staging) */}
            {productionList.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* List */}
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-black text-muted-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList size={16} /> Itens Selecionados
                        </h3>
                        <ul className="space-y-3">
                            {productionList.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-background p-4 rounded-xl border border-border/50 group hover:border-border transition-colors">
                                    <div>
                                        <div className="font-bold text-lg leading-tight">{item.recipeName}</div>
                                        <div className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-tighter">
                                            Meta: <span className="text-brand">{item.targetQuantity}</span> unidades
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromStaging(idx)}
                                        className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <button
                                onClick={calculateRequirements}
                                className="w-full bg-foreground text-background font-black px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 uppercase tracking-tighter"
                            >
                                <Calculator size={20} /> Calcular Necessidades
                            </button>
                        </div>
                    </div>

                    {/* Results & Saving */}
                    {requirements && (
                        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Droplets className="text-brand" size={16} /> Materiais Totais
                                </h3>
                                <button
                                    onClick={saveOrder}
                                    disabled={saving}
                                    className="px-4 py-2 bg-brand/10 text-brand border border-brand/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand hover:text-slate-950 transition-all flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Salvar Ordem
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden rounded-xl border border-border bg-background/50">
                                <table className="w-full text-left">
                                    <thead className="bg-muted text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-5 py-4">Ingrediente</th>
                                            <th className="px-5 py-4 text-right">Qtd Nec.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {requirements.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-accent/30">
                                                <td className="px-5 py-4 text-sm font-bold uppercase tracking-tight">{item.name}</td>
                                                <td className="px-5 py-4 text-right font-mono text-brand font-black text-lg">
                                                    {item.requiredQty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                                                    <span className="text-[10px] text-muted-foreground font-bold ml-1.5 uppercase">{item.unit}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* History Section */}
            <div className="space-y-6 mt-16">
                <div className="flex items-center gap-3">
                    <History className="text-muted-foreground" size={20} />
                    <h3 className="text-xl font-bold uppercase tracking-tighter">Histórico de Ordens</h3>
                </div>

                <div className="grid gap-4">
                    {pastOrders?.map(order => (
                        <div key={order.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-border/80 transition-all">
                            <div
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="mt-1 shrink-0 text-muted-foreground">
                                        {expandedOrder === order.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <Calendar size={14} className="text-brand" />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                {new Date(order.date).toLocaleDateString('pt-BR')}
                                                <span className="ml-2 opacity-50">{new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </span>
                                        </div>
                                        <h3 className="font-bold group-hover:text-brand transition-colors">{order.recipe_name}</h3>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold mt-1">
                                            Total: {order.quantity} unidades produzidas
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => deleteOrder(order.id, e)}
                                    className="self-end md:self-center p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all mt-4 md:mt-0"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {expandedOrder === order.id && (
                                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="bg-background/50 rounded-xl border border-border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Material Utilizado</th>
                                                    <th className="px-4 py-3 text-right">Qtd</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {order.items?.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-muted-foreground font-medium uppercase tracking-tight text-xs">{item.name}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-foreground font-bold">
                                                            {item.requiredQty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                                                            <span className="text-[9px] text-muted-foreground ml-1 uppercase">{item.unit}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {pastOrders?.length === 0 && !loading && (
                        <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-3xl">
                            <History className="mx-auto text-muted-foreground mb-4 opacity-20" size={48} />
                            <p className="text-muted-foreground font-bold uppercase tracking-tighter">Nenhum histórico disponível</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
