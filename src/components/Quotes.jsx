import React, { useState, useEffect, useMemo } from 'react';
import { 
    ingredientsApi, 
    productsApi, 
    quotesApi 
} from '../lib/api';
import { 
    Plus, 
    Trash2, 
    Search, 
    X, 
    Save, 
    Printer, 
    Share2, 
    Loader2, 
    FileText, 
    Calendar, 
    DollarSign, 
    Layers, 
    ChevronDown, 
    ChevronRight,
    Sparkles,
    Check,
    AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Quotes() {
    const [allIngredients, setAllIngredients] = useState([]);
    const [products, setProducts] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Quote Main Metadata State
    const [clientName, setClientName] = useState('');
    const [notes, setNotes] = useState('');
    const [expiryDate, setExpiryDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 15); // Default 15 days validity
        return date.toISOString().split('T')[0];
    });
    const [markup, setMarkup] = useState(2.0); // Default to 2.0x as requested!

    // Quote Items Staging List (Draft)
    const [stagingItems, setStagingItems] = useState([]);

    // Staging Item Form State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantityInput, setQuantityInput] = useState('10');
    const [productSearch, setProductSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // History and Filter state
    const [historySearch, setHistorySearch] = useState('');
    const [expandedQuote, setExpandedQuote] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ings, prods, qts] = await Promise.all([
                ingredientsApi.getAll(),
                productsApi.getAll(),
                quotesApi.getAll()
            ]);
            setAllIngredients(ings);
            setProducts(prods);
            setQuotes(qts || []);
        } catch (error) {
            console.error('Falha ao carregar dados do módulo de orçamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Selected product helper for staging form
    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId) || null;
    }, [products, selectedProductId]);

    // Calculate cost of any product based on current ingredient costs
    const getProductUnitCost = (product) => {
        if (!product || !product.ingredients || !allIngredients.length) return 0;
        return product.ingredients.reduce((acc, item) => {
            const ing = allIngredients.find(i => i.id === item.ingredientId);
            const cost = ing ? (ing.cost || 0) : 0;
            return acc + (item.quantity * cost);
        }, 0);
    };

    // Calculate current item unit cost
    const currentUnitCost = useMemo(() => {
        return getProductUnitCost(selectedProduct);
    }, [selectedProduct, allIngredients]);

    // Add selected product to staging list
    const handleAddItemToStaging = (e) => {
        e.preventDefault();
        if (!selectedProductId || !quantityInput) return;

        const qty = Number(quantityInput) || 10;
        const unitCost = currentUnitCost;

        setStagingItems(prev => {
            const existingIndex = prev.findIndex(item => item.productId === selectedProductId);
            if (existingIndex > -1) {
                // Update quantity if already in staging
                const updated = [...prev];
                updated[existingIndex].quantity += qty;
                return updated;
            } else {
                // Add new item
                return [
                    ...prev,
                    {
                        productId: selectedProductId,
                        productName: selectedProduct.name,
                        quantity: qty,
                        unitCost: unitCost
                    }
                ];
            }
        });

        // Reset item selector input
        setSelectedProductId('');
        setProductSearch('');
        setQuantityInput('10');
        setIsDropdownOpen(false);
    };

    // Update item quantity directly in the staging list
    const handleUpdateStagingQuantity = (productId, newQty) => {
        const qty = Math.max(1, Number(newQty) || 1);
        setStagingItems(prev => prev.map(item => 
            item.productId === productId ? { ...item, quantity: qty } : item
        ));
    };

    // Remove item from staging list
    const handleRemoveFromStaging = (productId) => {
        setStagingItems(prev => prev.filter(item => item.productId !== productId));
    };

    // Compute preview price totals for staging list
    const stagingCalculations = useMemo(() => {
        const items = stagingItems.map(item => {
            const unitPrice = item.unitCost * markup;
            const totalPrice = item.quantity * unitPrice;
            return {
                ...item,
                unitPrice,
                totalPrice
            };
        });
        const totalSum = items.reduce((acc, item) => acc + item.totalPrice, 0);
        return {
            items,
            totalSum
        };
    }, [stagingItems, markup]);

    // Save multi-product quote to Supabase
    const handleSaveQuote = async (e) => {
        e.preventDefault();
        if (!clientName || stagingItems.length === 0) return;

        setSaving(true);
        try {
            const quoteData = {
                client_name: clientName,
                items: stagingCalculations.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                })),
                markup: Number(markup),
                total_price: stagingCalculations.totalSum,
                notes: notes || null,
                expiry_date: expiryDate || null
            };

            await quotesApi.add(quoteData);
            
            // Reset inputs
            setClientName('');
            setStagingItems([]);
            setNotes('');
            setMarkup(2.0); // Reset to 2.0x default
            
            // Reload history
            const updatedQuotes = await quotesApi.getAll();
            setQuotes(updatedQuotes || []);
            alert('Orçamento salvo com sucesso!');
        } catch (error) {
            console.error('Falha ao salvar orçamento:', error);
            alert('Erro ao salvar orçamento no Supabase.');
        } finally {
            setSaving(false);
        }
    };

    // Delete quote
    const handleDeleteQuote = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Excluir este orçamento do histórico?')) {
            try {
                await quotesApi.delete(id);
                setQuotes(prev => prev.filter(q => q.id !== id));
            } catch (error) {
                console.error('Falha ao excluir orçamento:', error);
            }
        }
    };

    // Copy formatted Proposal to WhatsApp
    const handleCopyWhatsApp = (quote, e) => {
        e.stopPropagation();
        
        const formattedDate = new Date(quote.created_at || Date.now()).toLocaleDateString('pt-BR');
        const formattedExpiry = quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('pt-BR') : 'A combinar';
        
        const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        // Build list of products in proposal
        let itemsListText = '';
        quote.items.forEach(item => {
            itemsListText += `*${item.quantity}x ${item.productName}*\nUnitário: ${formatBRL(item.unitPrice)} | Subtotal: ${formatBRL(item.totalPrice)}\n\n`;
        });

        const text = `✨ *KIROS — Aromas para Casa* ✨
📄 *PROPOSTA COMERCIAL DE AROMAS*

Olá, *${quote.client_name}*! Segue abaixo o detalhamento do orçamento solicitado para o seu lote de produtos exclusivos:

----------------------------------------
${itemsListText.trim()}
----------------------------------------
💰 *VALOR TOTAL DA PROPOSTA:* ${formatBRL(quote.total_price)}

*Informações Adicionais:*
📅 *Data do Orçamento:* ${formattedDate}
⏳ *Validade da Proposta:* ${formattedExpiry}
${quote.notes ? `📝 *Observações:* ${quote.notes}` : ''}

Agradecemos a oportunidade de criar aromas únicos com você! Para aprovar este pedido ou fazer alterações, basta responder esta mensagem.

🧪 *Kiros — Aromas para Casa*`;

        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(quote.id || 'form');
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    // Trigger Print window for the elegant A4 paper
    const handlePrint = (quoteId) => {
        setExpandedQuote(quoteId);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    // Filter past quotes
    const filteredQuotes = useMemo(() => {
        return quotes.filter(q => 
            q.client_name.toLowerCase().includes(historySearch.toLowerCase()) ||
            q.items.some(item => item.productName.toLowerCase().includes(historySearch.toLowerCase()))
        );
    }, [quotes, historySearch]);

    return (
        <div className="space-y-10 pb-20 font-sans">
            
            {/* Custom Print Style injected on-demand */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #print-sheet, #print-sheet * {
                        visibility: visible !important;
                    }
                    #print-sheet {
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

            <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-serif font-black tracking-widest uppercase">Orçamentos</h2>
                    <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-brand/20">Multi-Produto</span>
                </div>
                {(loading || saving) && <Loader2 className="animate-spin text-brand" size={24} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left: Metadata & Staging Form */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Metadata Header Card */}
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl rounded-full translate-x-16 -translate-y-16"></div>
                        
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10">
                            <FileText size={16} className="text-brand" /> Dados Principais da Proposta
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            <div className="space-y-1.5 col-span-1 sm:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Cliente</label>
                                <input
                                    type="text"
                                    required
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    placeholder="ex: Hotel Boutique Aurora"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Validade da Proposta</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={e => setExpiryDate(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Condições (Opcional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="ex: Prazo: 15 dias. Pagamento 50% na aprovação."
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Add Item Staging Form */}
                    <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl relative">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-brand" /> Adicionar Produto ao Rascunho
                        </h3>

                        <form onSubmit={handleAddItemToStaging} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Product selection search box */}
                            <div className="md:col-span-6 space-y-1.5 relative">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Produto</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar produto..."
                                        value={productSearch}
                                        onChange={e => {
                                            setProductSearch(e.target.value);
                                            setIsDropdownOpen(true);
                                            if (!e.target.value) setSelectedProductId('');
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pl-10 text-sm text-foreground focus:outline-none focus:border-brand transition-all"
                                    />
                                    <Search className="absolute left-3.5 top-3.5 text-muted-foreground" size={14} />
                                    {productSearch && (
                                        <button
                                            type="button"
                                            onClick={() => { setProductSearch(''); setSelectedProductId(''); setIsDropdownOpen(false); }}
                                            className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute z-30 w-full mt-1 bg-surface border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 text-xs">
                                        {products
                                            ?.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                            .map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProductId(p.id);
                                                        setProductSearch(p.name);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="px-4 py-2.5 hover:bg-accent cursor-pointer text-foreground flex justify-between items-center group transition-colors"
                                                >
                                                    <span className="group-hover:text-brand transition-colors font-bold">{p.name}</span>
                                                    <span className="bg-background px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getProductUnitCost(p))}</span>
                                                </div>
                                            ))}
                                        {products?.length === 0 && <div className="p-3 text-muted-foreground text-xs italic">Nenhum produto cadastrado</div>}
                                    </div>
                                )}
                            </div>

                            {/* Quantity Input */}
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qtd</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantityInput}
                                    onChange={e => setQuantityInput(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-center font-bold focus:outline-none focus:border-brand"
                                />
                            </div>

                            {/* Add Trigger */}
                            <button
                                type="submit"
                                disabled={!selectedProductId}
                                className="md:col-span-3 bg-brand hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-brand/10 uppercase text-[10px] tracking-wider h-11"
                            >
                                <Plus size={14} /> Inserir Item
                            </button>
                        </form>
                    </div>

                    {/* Staging Items Draft List Table */}
                    {stagingItems.length > 0 && (
                        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-3">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} className="text-brand" /> Produtos no Rascunho
                            </h3>

                            <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
                                <table className="w-full text-left text-xs min-w-[400px]">
                                    <thead className="bg-muted/70 text-[9px] text-muted-foreground uppercase font-black tracking-widest border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3.5">Nome do Produto</th>
                                            <th className="px-4 py-3.5 text-center w-24">Qtd</th>
                                            <th className="px-4 py-3.5 text-right w-28">Custo Unit.</th>
                                            <th className="px-4 py-3.5 text-right w-32">Preço Unit (x{markup.toFixed(1)})</th>
                                            <th className="px-4 py-3.5 text-center w-12">Excluir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {stagingCalculations.items.map((item) => (
                                            <tr key={item.productId} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-bold text-foreground uppercase tracking-tight">{item.productName}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {/* IN-LINE QUANTITY EDITOR */}
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => handleUpdateStagingQuantity(item.productId, e.target.value)}
                                                        className="w-16 bg-background border border-border rounded px-2 py-1 text-center font-mono font-bold text-xs focus:outline-none focus:border-brand"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitCost)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFromStaging(item.productId)}
                                                        className="text-red-400 hover:text-red-300 p-1"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Global Markup Slider (Defaults to 2.0x as requested) */}
                            <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Markup Global (Multiplicador de Lucro)</label>
                                    <span className="text-sm font-black font-mono text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded">{markup.toFixed(2)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="10.0"
                                    step="0.1"
                                    value={markup}
                                    onChange={e => setMarkup(Number(e.target.value))}
                                    className="w-full h-1.5 bg-background border border-border rounded-lg appearance-none cursor-pointer accent-brand"
                                />
                                <div className="flex justify-between text-[9px] text-muted-foreground">
                                    <span>1.0x (Preço de Custo)</span>
                                    <span>2.0x (Padrão)</span>
                                    <span>5.0x (Médio)</span>
                                    <span>10.0x (Luxo)</span>
                                </div>
                            </div>

                            {/* Finalize proposal save trigger */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveQuote}
                                    disabled={!clientName || stagingItems.length === 0 || saving}
                                    className="w-full sm:w-auto bg-brand hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand/20 uppercase text-xs tracking-wider"
                                >
                                    <Save size={16} /> Salvar Orçamento Completo
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Right: Live A4 PDF Letterhead Preview */}
                <div className="lg:col-span-5 space-y-6">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Folha de Proposta A4 Timbrada</h3>
                    
                    {stagingItems.length > 0 ? (
                        <div className="space-y-4">
                            
                            {/* Live Letterhead Preview Container */}
                            <div 
                                id="print-sheet" 
                                className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-2xl relative min-h-[580px] flex flex-col justify-between"
                            >
                                <div className="space-y-8">
                                    {/* Paper Head */}
                                    <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                                        <div>
                                            <h4 className="font-serif font-black text-xl tracking-widest uppercase text-slate-950 leading-none">KIROS</h4>
                                            <p className="text-[8px] text-indigo-600 font-sans font-bold uppercase tracking-[0.2em] mt-1 leading-none">Aromas para Casa</p>
                                            <p className="text-[9px] text-slate-400 font-sans mt-3 leading-tight font-light">oi@usekiros.com.br<br />Tel: (15) 99731-6430</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 tracking-wider">PROPOSTA COMERCIAL</span>
                                            <p className="text-[9px] text-slate-400 font-mono mt-2">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-3 gap-4 text-[11px] leading-tight">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">CLIENTE</span>
                                            <span className="font-bold text-slate-800 uppercase block">{clientName || 'NOME DO CLIENTE'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">VALIDADE DA PROPOSTA</span>
                                            <span className="font-bold text-slate-800 flex items-center gap-1">
                                                <Calendar size={11} className="text-indigo-600 shrink-0" />
                                                {expiryDate ? new Date(expiryDate).toLocaleDateString('pt-BR') : 'A combinar'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">CONDIÇÕES</span>
                                            <span className="font-bold text-slate-800 block text-xs truncate" title={notes}>{notes || 'Geral'}</span>
                                        </div>
                                    </div>

                                    {/* Table Items */}
                                    <div className="rounded-lg border border-slate-100 overflow-hidden bg-slate-50/50">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-slate-100 text-[8px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-2.5">Produto</th>
                                                    <th className="px-4 py-2.5 text-center w-12">Qtd</th>
                                                    <th className="px-4 py-2.5 text-right w-20">Unitário</th>
                                                    <th className="px-4 py-2.5 text-right w-20">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {stagingCalculations.items.map((item, idx) => (
                                                    <tr key={item.productId || idx}>
                                                        <td className="px-4 py-3.5 font-bold text-slate-900 uppercase tracking-tight">{item.productName}</td>
                                                        <td className="px-4 py-3.5 text-center font-bold font-mono">{item.quantity}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-950">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-slate-200 bg-slate-100/50 font-bold text-slate-950">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right text-[9px] uppercase tracking-wider text-slate-500 font-black">VALOR TOTAL DA PROPOSTA</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs text-indigo-600">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stagingCalculations.totalSum)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Additional conditions */}
                                    {notes && (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">CONDIÇÕES E OBSERVAÇÕES</span>
                                            <p className="whitespace-pre-wrap leading-relaxed">{notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Paper Footer */}
                                <div className="border-t border-slate-100 pt-4 mt-8 flex justify-between items-center text-[9px] text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Sparkles size={11} className="text-indigo-600 animate-pulse shrink-0" />
                                    </div>
                                    <div className="w-20 border-t border-slate-300 text-center pt-1 font-bold text-[8px] uppercase tracking-wider text-slate-500">
                                        Aprovação
                                    </div>
                                </div>

                            </div>

                            {/* Staging actions triggers */}
                            <div className="flex gap-3 bg-surface border border-border rounded-xl p-4 shadow-sm items-center justify-between">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <AlertCircle className="text-brand shrink-0" size={15} />
                                    <span>Controle global aplicado</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => handleCopyWhatsApp({
                                            client_name: clientName || 'Cliente',
                                            items: stagingCalculations.items,
                                            total_price: stagingCalculations.totalSum,
                                            notes: notes,
                                            expiry_date: expiryDate
                                        }, e)}
                                        className="px-3.5 py-2.5 bg-brand/10 text-brand border border-brand/20 hover:bg-brand hover:text-slate-950 transition-all rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                    >
                                        {copiedId === 'form' ? <Check size={14} /> : <Share2 size={14} />}
                                        {copiedId === 'form' ? 'Copiado!' : 'WhatsApp'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePrint('form')}
                                        className="px-3.5 py-2.5 bg-foreground text-background hover:opacity-90 transition-all rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                    >
                                        <Printer size={14} /> Imprimir PDF
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[400px]">
                            <FileText className="mx-auto opacity-10 mb-4" size={56} />
                            <p className="font-bold uppercase tracking-tighter text-sm">Orçamento Vazio</p>
                            <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-xs">Adicione os produtos que deseja cotar usando o formulário ao lado. A visualização A4 e cotações de preços atualizarão dinamicamente.</p>
                        </div>
                    )}

                </div>

            </div>

            {/* History Section */}
            <div className="space-y-6 mt-16 border-t border-border/60 pt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FileText className="text-muted-foreground" size={20} />
                        <h3 className="text-xl font-bold uppercase tracking-tighter">Histórico de Orçamentos</h3>
                        <span className="bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground font-bold">{filteredQuotes.length}</span>
                    </div>
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Buscar cliente ou produto..."
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-brand"
                        />
                        <Search className="absolute left-3.5 top-3.5 text-muted-foreground" size={14} />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredQuotes.map(quote => (
                        <div 
                            key={quote.id} 
                            className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-border/80 transition-all"
                        >
                            <div
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group"
                                onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="mt-1 shrink-0 text-muted-foreground">
                                        {expandedQuote === quote.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div className="space-y-1 w-full">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={13} className="text-brand" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                            {quote.expiry_date && (
                                                <span className={cn(
                                                    "text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold",
                                                    new Date(quote.expiry_date) < new Date() 
                                                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                        : "bg-green-500/10 text-green-500 border-green-500/20"
                                                )}>
                                                    {new Date(quote.expiry_date) < new Date() ? 'Expirado' : `Validade: ${new Date(quote.expiry_date).toLocaleDateString('pt-BR')}`}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight uppercase group-hover:text-brand transition-colors text-foreground">
                                            {quote.client_name}
                                        </h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                            <span className="text-muted-foreground font-bold">Composição: <span className="text-foreground">{quote.items?.length || 0} produto(s)</span></span>
                                            <span className="text-muted-foreground font-mono">Markup: {quote.markup.toFixed(2)}x</span>
                                            <span className="text-brand font-mono font-bold">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_price)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-end gap-2 self-end md:self-center mt-4 md:mt-0">
                                    <button
                                        onClick={(e) => handleCopyWhatsApp(quote, e)}
                                        className="p-2.5 text-muted-foreground hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                                        title="Copiar p/ WhatsApp"
                                    >
                                        {copiedId === quote.id ? <Check size={18} className="text-brand" /> : <Share2 size={18} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrint(quote.id); }}
                                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                        title="Imprimir PDF"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteQuote(quote.id, e)}
                                        className="p-2.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                            </div>

                            {/* Expanded multi-row invoice table for historical views */}
                            {expandedQuote === quote.id && (
                                <div className="px-5 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="bg-background/50 rounded-2xl border border-border p-6 shadow-inner space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-xs font-bold text-muted-foreground uppercase">
                                            <FileText size={14} className="text-brand" /> 
                                            <span>Detalhamento dos Itens da Proposta</span>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-muted/50 text-[9px] text-muted-foreground uppercase font-black tracking-widest border-b border-border">
                                                    <tr>
                                                        <th className="px-4 py-3">Produto Adicionado</th>
                                                        <th className="px-4 py-3 text-center w-20">Qtd</th>
                                                        <th className="px-4 py-3 text-right w-28">Preço Custo</th>
                                                        <th className="px-4 py-3 text-right w-36">Preço Venda (x{quote.markup.toFixed(1)})</th>
                                                        <th className="px-4 py-3 text-right w-36">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border text-foreground/80">
                                                    {quote.items?.map((item, idx) => (
                                                        <tr key={item.productId || idx}>
                                                            <td className="px-4 py-3 font-bold text-foreground uppercase tracking-tight text-xs">{item.productName}</td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitCost)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="border-t border-border bg-muted/20 font-bold text-foreground">
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-3 text-right text-xs" >Valor Global Total</td>
                                                        <td className="px-4 py-3 text-right font-mono text-brand">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_price)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {quote.notes && (
                                            <div className="p-3 bg-background rounded-lg border border-border/50 text-xs text-muted-foreground">
                                                <span className="text-[9px] font-bold text-foreground block mb-1">Notas do Orçamento:</span>
                                                <p className="whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
                                            </div>
                                        )}

                                        {/* A4 Printable container inside historical expands (for direct printing) */}
                                        <div className="hidden">
                                            <div 
                                                id="print-sheet" 
                                                className="bg-white text-slate-900 border border-slate-200 rounded-none p-12 text-left"
                                            >
                                                <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-8">
                                                    <div>
                                                        <h4 className="font-serif font-black text-2xl tracking-widest uppercase text-slate-950 leading-none">KIROS</h4>
                                                        <p className="text-[8px] text-indigo-600 font-sans font-bold uppercase tracking-[0.1em] mt-1 leading-none">Aromas para Casa</p>
                                                        <p className="text-[9px] text-slate-400 font-sans mt-3">oi@usekiros.com.br<br />Tel: (15) 99731-6430</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 tracking-wider">PROPOSTA COMERCIAL</span>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-2">Data: {new Date(quote.created_at).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 text-xs mb-8">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">CLIENTE</span>
                                                        <span className="font-bold text-slate-800 uppercase block">{quote.client_name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">VALIDADE DA PROPOSTA</span>
                                                        <span className="font-bold text-slate-800 block">{quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('pt-BR') : 'A combinar'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">CONDIÇÕES</span>
                                                        <span className="font-bold text-slate-800 block text-xs">{quote.notes || 'Geral'}</span>
                                                    </div>
                                                </div>

                                                <table className="w-full text-left text-xs mb-8">
                                                    <thead className="bg-slate-100 text-[8px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-4 py-2.5">Produto</th>
                                                            <th className="px-4 py-2.5 text-center w-12">Qtd</th>
                                                            <th className="px-4 py-2.5 text-right w-20">Unitário</th>
                                                            <th className="px-4 py-2.5 text-right w-20">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                                        {quote.items?.map((item, idx) => (
                                                            <tr key={item.productId || idx}>
                                                                <td className="px-4 py-4 font-bold text-slate-900 uppercase tracking-tight">{item.productName}</td>
                                                                <td className="px-4 py-4 text-center font-bold font-mono">{item.quantity}</td>
                                                                <td className="px-4 py-4 text-right font-mono text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}</td>
                                                                <td className="px-4 py-4 text-right font-mono font-bold text-slate-950 text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="border-t border-slate-200 bg-slate-100 font-bold text-slate-950">
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-3 text-right text-[8px] uppercase tracking-widest font-black text-slate-500">VALOR GLOBAL TOTAL</td>
                                                            <td className="px-4 py-3 text-right font-mono text-indigo-600 text-xs">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_price)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>

                                                {quote.notes && (
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-8">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">CONDIÇÕES E OBSERVAÇÕES</span>
                                                        <p className="whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
                                                    </div>
                                                )}

                                                <div className="border-t border-slate-100 pt-5 mt-16 flex justify-between items-center text-[10px] text-slate-400">
                                                    <div className="w-24 border-t border-slate-300 text-center pt-1 font-bold text-[9px] uppercase tracking-wider text-slate-500 ml-auto">
                                                        Aprovação
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>
                    ))}

                    {filteredQuotes.length === 0 && !loading && (
                        <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-3xl">
                            <FileText className="mx-auto text-muted-foreground mb-4 opacity-20" size={48} />
                            <p className="text-muted-foreground font-bold uppercase tracking-tighter">Nenhum orçamento arquivado</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
