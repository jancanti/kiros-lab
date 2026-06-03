import React, { useState, useEffect } from 'react';
import { productsApi, ordersApi, quotesApi } from '../lib/api';
import { Calculator, ClipboardList, Plus, Trash2, Loader2, Search, X, Save, History, ChevronRight, ChevronDown, Calendar, Droplets, Printer } from 'lucide-react';
import { cn, normalizeText } from '../lib/utils';
export default function Orders() {
    const [products, setProducts] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Searchable recipe state
    const [recipeSearch, setRecipeSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [quantity, setQuantity] = useState('');

    // Selected quote state
    const [selectedQuoteId, setSelectedQuoteId] = useState('');

    // List of recipes to produce (staging)
    const [productionList, setProductionList] = useState([]);

    // Aggregated requirements
    const [requirements, setRequirements] = useState(null);

    // View state
    const [expandedOrder, setExpandedOrder] = useState(null);

    // Multiselect & consolidated printing state
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [activePrintJob, setActivePrintJob] = useState(null);

    // Modal for selecting items to print (can be single or consolidated)
    const [printModalJob, setPrintModalJob] = useState(null);
    const [selectedPrintItems, setSelectedPrintItems] = useState([]);
    
    // Custom name for the production order (e.g. client name from quote)
    const [customOrderName, setCustomOrderName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recs, ords, qts] = await Promise.all([
                productsApi.getAll(),
                ordersApi.getAll(),
                quotesApi.getAll()
            ]);
            setProducts(recs);
            setPastOrders(ords);
            setQuotes(qts || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Import all products (including custom ones) from a past Quote into the staging productionList
    const addQuoteToProductionList = (quoteId) => {
        if (!quoteId) return;
        const quote = quotes.find(q => q.id === quoteId);
        if (!quote) return;

        let addedCount = 0;
        let customCount = 0;
        const newStagingItems = [];

        quote.items?.forEach(quoteItem => {
            if (!quoteItem) return;

            const itemId = quoteItem.productId || quoteItem.recipeId || '';
            const itemName = quoteItem.productName || quoteItem.recipeName || quoteItem.name || '';
            const itemQty = Number(quoteItem.quantity) || Number(quoteItem.qty) || 1;

            if (!itemName) return;

            // Find standard product recipe by ID or exact case-insensitive Name
            const product = products.find(p => 
                (itemId && p.id === itemId) || 
                (p.name && itemName && p.name.toLowerCase() === itemName.toLowerCase())
            );

            if (product) {
                newStagingItems.push({
                    recipeId: product.id,
                    recipeName: product.name,
                    targetQuantity: itemQty,
                    recipeYield: product.yield || 1,
                    ingredients: product.ingredients || []
                });
                addedCount++;
            } else {
                // Add custom item with empty ingredients list so it doesn't crash calculations
                newStagingItems.push({
                    recipeId: itemId || `custom-${Date.now()}-${Math.random()}`,
                    recipeName: itemName,
                    targetQuantity: itemQty,
                    recipeYield: 1,
                    ingredients: []
                });
                customCount++;
            }
        });

        if (newStagingItems.length > 0) {
            setProductionList(prev => [...prev, ...newStagingItems]);
            setRequirements(null); // Reset calculated requirements
            setSelectedQuoteId('');
            setCustomOrderName(quote.client_name);
        }

        if (customCount > 0) {
            alert(`Importação concluída: ${addedCount} produtos padrão e ${customCount} itens personalizados do orçamento de "${quote.client_name}" foram carregados com sucesso!`);
        } else {
            alert(`Todos os ${addedCount} produtos do orçamento de "${quote.client_name}" foram carregados com sucesso para o planejamento de produção!`);
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
        const customProducts = [];

        productionList.forEach(item => {
            if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
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
            } else {
                // Custom product with no standard raw materials recipe
                customProducts.push({
                    name: item.recipeName,
                    unit: 'un',
                    requiredQty: item.targetQuantity,
                    isCustomProduct: true
                });
            }
        });

        const ingList = Object.values(aggregatedIngredients).sort((a, b) => a.name.localeCompare(b.name));
        const customList = customProducts.sort((a, b) => a.name.localeCompare(b.name));

        setRequirements([...ingList, ...customList]);
    };

    const saveOrder = async () => {
        if (!requirements || productionList.length === 0) return;

        setSaving(true);
        try {
            const orderData = {
                date: new Date().toISOString(),
                recipe_name: customOrderName.trim() || productionList.map(p => `${p.targetQuantity}x ${p.recipeName}`).join(', '),
                quantity: productionList.reduce((acc, p) => acc + p.targetQuantity, 0),
                items: requirements // Store the calculated requirements
            };

            await ordersApi.add(orderData);
            setProductionList([]);
            setRequirements(null);
            setCustomOrderName('');
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

    const toggleOrderSelection = (orderId) => {
        setSelectedOrders(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId) 
                : [...prev, orderId]
        );
    };

    const consolidateSelectedOrders = () => {
        if (selectedOrders.length === 0) return;
        const selectedList = pastOrders.filter(o => selectedOrders.includes(o.id));
        
        const consolidatedIngredients = {};
        const consolidatedCustomProducts = {};

        selectedList.forEach(order => {
            order.items?.forEach(item => {
                if (item.isCustomProduct) {
                    if (!consolidatedCustomProducts[item.name]) {
                        consolidatedCustomProducts[item.name] = {
                            name: item.name,
                            unit: item.unit || 'un',
                            requiredQty: 0,
                            isCustomProduct: true
                        };
                    }
                    consolidatedCustomProducts[item.name].requiredQty += Number(item.requiredQty) || 0;
                } else {
                    if (!consolidatedIngredients[item.name]) {
                        consolidatedIngredients[item.name] = {
                            name: item.name,
                            unit: item.unit || 'g',
                            requiredQty: 0
                        };
                    }
                    consolidatedIngredients[item.name].requiredQty += Number(item.requiredQty) || 0;
                }
            });
        });

        const sortedIngList = Object.values(consolidatedIngredients).sort((a, b) => a.name.localeCompare(b.name));
        const sortedCustomList = Object.values(consolidatedCustomProducts).sort((a, b) => a.name.localeCompare(b.name));

        const consolidatedItems = [...sortedIngList, ...sortedCustomList];

        setPrintModalJob({
            type: 'consolidated',
            orders: selectedList,
            items: consolidatedItems
        });
        setSelectedPrintItems(consolidatedItems.map(item => item.name));
    };

    const handlePrintSingle = (order) => {
        setPrintModalJob({
            type: 'single',
            order,
            items: order.items || []
        });
        // Pre-select all items by default
        setSelectedPrintItems(order.items?.map(item => item.name) || []);
    };

    const triggerPrintJob = () => {
        if (!printModalJob) return;
        const filteredItems = (printModalJob.items || []).filter(item => 
            selectedPrintItems.includes(item.name)
        );

        if (printModalJob.type === 'consolidated') {
            setActivePrintJob({
                type: 'consolidated',
                orders: printModalJob.orders,
                items: filteredItems
            });
        } else {
            setActivePrintJob({
                type: 'single',
                order: printModalJob.order,
                items: filteredItems
            });
        }

        setPrintModalJob(null); // Close modal
        setTimeout(() => {
            window.print();
        }, 150);
    };

    return (
        <div className="space-y-10 pb-20">
            
            {/* Custom Print Style injected on-demand */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #print-order-sheet, #print-order-sheet * {
                        visibility: visible !important;
                    }
                    #print-order-sheet {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                }
            `}</style>

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
                    {/* Order Identification / Client Name Input */}
                    <div className="md:col-span-12 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificação da Ordem / Cliente (Opcional)</label>
                        <input
                            type="text"
                            value={customOrderName}
                            onChange={e => setCustomOrderName(e.target.value)}
                            placeholder="ex: Lote de Teste, Hotel Boutique Aurora..."
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-medium"
                        />
                    </div>

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
                                    ?.filter(r => normalizeText(r.name).includes(normalizeText(recipeSearch)))
                                    .map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => {
                                                setSelectedRecipeId(r.id);
                                                setRecipeSearch(r.name);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-4 py-3 hover:bg-accent cursor-pointer text-sm text-foreground flex justify-between items-center group transition-colors"
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

                {quotes.length > 0 && (
                    <>
                        <div className="border-t border-border/40 my-6"></div>

                        {/* Add from Quote Section */}
                        <div className="space-y-4 relative z-10">
                            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Importar Produtos de um Orçamento Existente</h4>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-9 space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Orçamento Salvo</label>
                                    <select
                                        value={selectedQuoteId}
                                        onChange={e => setSelectedQuoteId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-brand transition-all"
                                    >
                                        <option value="">-- Selecionar Orçamento --</option>
                                        {quotes.map(q => {
                                            const dateStr = new Date(q.created_at).toLocaleDateString('pt-BR');
                                            return (
                                                <option key={q.id} value={q.id}>
                                                    {q.client_name} ({q.items?.length || 0} produtos) - {dateStr} - R$ {q.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <button
                                    onClick={() => addQuoteToProductionList(selectedQuoteId)}
                                    disabled={!selectedQuoteId}
                                    className="md:col-span-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 uppercase h-[48px] text-xs tracking-wider"
                                >
                                    <ClipboardList size={18} /> Importar Itens
                                </button>
                            </div>
                        </div>
                    </>
                )}
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
                                                <td className="px-5 py-4 text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                                                    <span>{item.name}</span>
                                                    {item.isCustomProduct && (
                                                        <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                                                            Item Personalizado
                                                        </span>
                                                    )}
                                                </td>
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
                                    <div className="mt-1.5 shrink-0 flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => toggleOrderSelection(order.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-4.5 h-4.5 rounded-md border-border text-indigo-600 focus:ring-indigo-500 bg-background cursor-pointer accent-indigo-600"
                                        />
                                        <div className="text-muted-foreground">
                                            {expandedOrder === order.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
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
                                <div className="flex items-center gap-2 self-end md:self-center mt-4 md:mt-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrintSingle(order); }}
                                        className="p-2.5 text-muted-foreground hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                                        title="Imprimir Ordem de Produção"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => deleteOrder(order.id, e)}
                                        className="p-2.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
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

            {/* Floating Batch Operations Bar */}
            {selectedOrders.length > 0 && (
                <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-auto bg-slate-900 dark:bg-indigo-950 text-white px-6 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-indigo-500/30 flex flex-col sm:flex-row items-center gap-4 z-40 animate-in slide-in-from-bottom-6 duration-300">
                    <div className="text-sm font-bold flex items-center gap-2">
                        <span className="bg-indigo-500 text-slate-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs">
                            {selectedOrders.length}
                        </span>
                        <span>{selectedOrders.length === 1 ? 'Ordem selecionada' : 'Ordens selecionadas'}</span>
                    </div>
                    <div className="flex gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={consolidateSelectedOrders}
                            className="flex-1 sm:flex-initial bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                        >
                            <Printer size={14} /> Consolidar e Imprimir
                        </button>
                        <button
                            onClick={() => setSelectedOrders([])}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all active:scale-95"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            )}

            {/* A4 Dynamic Printable Sheet (Hidden on screen, visible on print) */}
            {activePrintJob && (
                <div className="hidden print:block">
                    <div 
                        id="print-order-sheet" 
                        className="bg-white text-slate-900 border border-slate-200 rounded-none p-12 text-left"
                    >
                        {/* Timbrado */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-8">
                            <div>
                                <h4 className="font-serif font-black text-2xl tracking-widest uppercase text-slate-950 leading-none">KIROS</h4>
                                <p className="text-[8px] text-indigo-600 font-sans font-bold uppercase tracking-[0.1em] mt-1 leading-none">Aromas para Casa</p>
                                <p className="text-[9px] text-slate-400 font-sans mt-3 font-light">oi@usekiros.com.br</p>
                            </div>
                            <div className="text-right max-w-xs">
                                <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 tracking-wider">
                                    {activePrintJob.type === 'consolidated' ? 'CONSOLIDAÇÃO DE ORDENS' : 'ORDEM DE PRODUÇÃO'}
                                </span>
                                {activePrintJob.type !== 'consolidated' && activePrintJob.order?.recipe_name && (
                                    <p className="text-[10px] text-slate-900 font-bold uppercase tracking-tight mt-1 leading-snug">
                                        {activePrintJob.order.recipe_name}
                                    </p>
                                )}
                                <p className="text-[9px] text-slate-400 font-mono mt-1">
                                    Data: {new Date().toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>

                        {/* List of orders included in consolidation */}
                        {activePrintJob.type === 'consolidated' && (
                            <div className="mb-6 font-sans border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                                <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ORDENS CONSOLIDADAS ({activePrintJob.orders.length})</h5>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                    {activePrintJob.orders.map((o, idx) => {
                                        const dateStr = new Date(o.date).toLocaleDateString('pt-BR');
                                        return (
                                            <div key={idx} className="text-[10px] text-slate-600 flex items-start gap-1">
                                                <span className="font-mono text-slate-400 font-semibold">#{(idx+1).toString().padStart(2, '0')}</span>
                                                <span className="font-bold">{dateStr}</span>
                                                <span className="truncate text-slate-500">— {o.recipe_name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Ingredients / Materials needed Checklist */}
                        <div className="space-y-4 font-sans">
                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                                {activePrintJob.type === 'consolidated' ? 'MATÉRIAS-PRIMAS CONSOLIDADAS' : 'MATÉRIAS-PRIMAS NECESSÁRIAS (CONSOLIDADO)'}
                            </h5>
                            <table className="w-full text-left text-xs mb-8">
                                <thead className="bg-slate-100 text-[8px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 w-12 text-center">OK</th>
                                        <th className="px-4 py-2">Material / Produto</th>
                                        <th className="px-4 py-2 text-right w-32">Quantidade Necessária</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {activePrintJob.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2.5 text-center align-middle w-12">
                                                <div className="w-4 h-4 border border-slate-400 rounded mx-auto bg-white"></div>
                                            </td>
                                            <td className="px-4 py-2.5 font-bold text-slate-900 uppercase tracking-tight text-[11px]">
                                                <span>{item.name}</span>
                                                {item.isCustomProduct && (
                                                    <span className="ml-2 text-[7px] bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.5 rounded font-sans font-black tracking-wider">
                                                        ITEM PERSONALIZADO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-950 text-[11px]">
                                                {item.requiredQty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                                                <span className="text-[9px] text-slate-400 ml-1.5 uppercase font-sans font-normal">{item.unit}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Signature */}
                        <div className="border-t border-slate-100 pt-8 mt-12 flex justify-between items-center text-[10px] text-slate-400">
                            <div>
                                <p className="font-bold text-[8px] uppercase tracking-wider text-slate-500">Operador</p>
                                <div className="w-32 border-b border-slate-300 mt-6"></div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[8px] uppercase tracking-wider text-slate-500">Responsável / Qualidade</p>
                                <div className="w-32 border-b border-slate-300 mt-6 ml-auto"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Itens para Impressão */}
            {printModalJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250">
                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-widest text-foreground">
                                    {printModalJob.type === 'consolidated' ? 'Consolidar e Imprimir Ordens' : 'Imprimir Ordem de Produção'}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {printModalJob.type === 'consolidated' 
                                        ? `${printModalJob.orders.length} ordens selecionadas`
                                        : printModalJob.order?.recipe_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setPrintModalJob(null)}
                                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
                            <p className="text-xs text-muted-foreground">Selecione quais matérias-primas você deseja incluir na impressão:</p>
                            
                            {/* Toggle All checkbox */}
                            <label className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50 cursor-pointer hover:border-indigo-500/40 transition-all font-bold text-xs select-none">
                                <input
                                    type="checkbox"
                                    checked={selectedPrintItems.length === (printModalJob.items?.length || 0)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedPrintItems(printModalJob.items?.map(i => i.name) || []);
                                        } else {
                                            setSelectedPrintItems([]);
                                        }
                                    }}
                                    className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 bg-background cursor-pointer accent-indigo-600"
                                />
                                <span>Selecionar Todos</span>
                            </label>

                            <div className="space-y-2.5">
                                {printModalJob.items?.map((item, idx) => (
                                    <label
                                        key={idx}
                                        className={cn(
                                            "flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none text-xs",
                                            selectedPrintItems.includes(item.name)
                                                ? "border-indigo-500/20 bg-indigo-500/5 text-foreground font-bold"
                                                : "border-border/60 bg-transparent text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedPrintItems.includes(item.name)}
                                                onChange={() => {
                                                    setSelectedPrintItems(prev => 
                                                        prev.includes(item.name)
                                                            ? prev.filter(name => name !== item.name)
                                                            : [...prev, item.name]
                                                    );
                                                }}
                                                className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 bg-background cursor-pointer accent-indigo-600"
                                            />
                                            <span className="uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        <span className="font-mono text-muted-foreground">
                                            {item.requiredQty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {item.unit}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border flex gap-3 justify-end bg-muted/10">
                            <button
                                onClick={() => setPrintModalJob(null)}
                                className="px-5 py-3 bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-border active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={triggerPrintJob}
                                disabled={selectedPrintItems.length === 0}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                <Printer size={15} /> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
