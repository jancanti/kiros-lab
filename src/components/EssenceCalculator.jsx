import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Sparkles, Droplets, Scale, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { productsApi } from '../lib/api';

export default function EssenceCalculator() {
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [numPots, setNumPots] = useState(1);
    const [potVolume, setPotVolume] = useState(200);
    const [essencePercent, setEssencePercent] = useState(10);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const data = await productsApi.getAll();
                setProducts(data || []);
            } catch (error) {
                console.error('Falha ao carregar produtos na calculadora:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    // Get selected product object
    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId) || null;
    }, [products, selectedProductId]);

    // Automatically set essence percentage if a product is selected and contains essence/oils
    useEffect(() => {
        if (selectedProduct && selectedProduct.ingredients?.length > 0) {
            // Find total quantity of ingredients in the formula
            const totalQty = selectedProduct.ingredients.reduce((acc, ing) => acc + (ing.quantity || 0), 0);
            
            // Try to find ingredients that represent essence or oil (usually has "essência", "óleo" or "aroma" in name)
            const essenceQty = selectedProduct.ingredients
                .filter(ing => {
                    const name = ing.name.toLowerCase();
                    return name.includes('essência') || name.includes('oleo') || name.includes('óleo') || name.includes('aroma') || name.includes('fragrância') || name.includes('fragrancia');
                })
                .reduce((acc, ing) => acc + (ing.quantity || 0), 0);

            if (totalQty > 0 && essenceQty > 0) {
                const calculatedPercent = Math.round((essenceQty / totalQty) * 100);
                setEssencePercent(calculatedPercent || 10);
            }
        }
    }, [selectedProduct]);

    // Calculate core wax & essence amounts
    const result = useMemo(() => {
        const totalWeight = numPots * potVolume;
        const divisor = 1 + (essencePercent / 100);
        const waxAmount = Math.round(totalWeight / divisor);
        const essenceAmount = Math.round(totalWeight - waxAmount);

        // If a product is selected, calculate detailed breakdown for EACH ingredient in the formula
        let detailedIngredients = [];
        if (selectedProduct && selectedProduct.ingredients?.length > 0) {
            const totalFormulaQty = selectedProduct.ingredients.reduce((acc, ing) => acc + (ing.quantity || 0), 0);
            
            detailedIngredients = selectedProduct.ingredients.map(ing => {
                const proportion = totalFormulaQty > 0 ? (ing.quantity / totalFormulaQty) : 0;
                const percent = Math.round(proportion * 1000) / 10;
                const batchWeight = Math.round(totalWeight * proportion * 10) / 10;
                return {
                    id: ing.ingredientId,
                    name: ing.name,
                    unit: ing.unit,
                    proportionPercent: percent,
                    weightRequired: batchWeight
                };
            }).sort((a, b) => b.proportionPercent - a.proportionPercent);
        }

        return {
            totalWeight,
            waxAmount,
            essenceAmount,
            detailedIngredients
        };
    }, [numPots, potVolume, essencePercent, selectedProduct]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-serif font-black tracking-widest uppercase">Calculadora</h2>
                    <span className="bg-brand/10 text-brand text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-brand/20">Avançada</span>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand/5 blur-3xl rounded-full translate-x-20 -translate-y-20"></div>
                
                <h3 className="text-lg font-medium text-foreground/90 mb-8 flex items-center gap-3 relative z-10 font-serif">
                    <Calculator className="text-brand shrink-0" size={28} />
                    <span>Cálculo preciso de proporções para lotes de produção</span>
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                    {/* Select Product */}
                    <div className="space-y-2 lg:col-span-4 bg-muted/40 border border-border/60 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <BookOpen className="text-brand shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Vincular a um Roteiro de Produto</h4>
                                <p className="text-muted-foreground text-xs">Aplica a fórmula exata do produto cadastrado</p>
                            </div>
                        </div>
                        <select
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            disabled={loading}
                            className="w-full md:w-80 bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                        >
                            <option value="">-- Cálculo Genérico (Manual) --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Rendimento: {p.yield} {p.unit})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Número de Potes</label>
                        <input
                            type="number"
                            min="1"
                            value={numPots}
                            onChange={e => setNumPots(Number(e.target.value) || 1)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground text-lg font-bold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Volume do Pote (g / ml)</label>
                        <input
                            type="number"
                            min="1"
                            value={potVolume}
                            onChange={e => setPotVolume(Number(e.target.value) || 1)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground text-lg font-bold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                        />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            Proporção de Essência (%) 
                            {selectedProduct && <span className="text-brand text-[10px] ml-2 font-bold uppercase tracking-widest">(Calculado da Fórmula)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={essencePercent}
                                onChange={e => setEssencePercent(Number(e.target.value) || 1)}
                                disabled={!!selectedProduct}
                                className="w-full bg-background border border-border disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-4 py-3.5 pr-12 text-foreground text-lg font-bold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                            />
                            <span className="absolute right-4 top-4 text-muted-foreground font-bold">%</span>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-muted/30 border border-border rounded-2xl p-6 relative z-10 space-y-8">
                    <div>
                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Scale size={14} className="text-brand" /> Métricas Base do Lote
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface border border-border/50 rounded-xl p-5 text-center flex flex-col justify-center min-h-[120px] transition-all hover:shadow-md group">
                                <div className="text-muted-foreground text-[10px] font-black uppercase tracking-wider mb-2">Massa Total Cadastrada</div>
                                <div className="text-3xl font-black font-mono group-hover:text-brand transition-colors">{result.totalWeight} g</div>
                            </div>
                            <div className="bg-surface border border-border/50 rounded-xl p-5 text-center flex flex-col justify-center min-h-[120px] transition-all hover:shadow-md">
                                <div className="text-muted-foreground text-[10px] font-black uppercase tracking-wider mb-2">Base / Cera Necessária</div>
                                <div className="text-3xl font-black text-foreground/80 font-mono">{result.waxAmount} g</div>
                            </div>
                            <div className="bg-brand/10 border border-brand/20 rounded-xl p-5 text-center flex flex-col justify-center min-h-[120px] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-brand/10 blur-xl rounded-full"></div>
                                <div className="text-brand text-[10px] font-black uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                                    <Droplets size={12} /> Essência Total
                                </div>
                                <div className="text-3xl font-black text-brand font-mono group-hover:scale-105 transition-transform">{result.essenceAmount} g</div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Product Recipe Detail */}
                    {selectedProduct && result.detailedIngredients?.length > 0 && (
                        <div className="pt-6 border-t border-border/60 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} className="text-brand" /> Divisão Detalhada dos Ingredientes (Balança)
                                </h4>
                                <span className="text-[10px] text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Fórmula: {selectedProduct.name}
                                </span>
                            </div>

                            <div className="bg-surface border border-border/50 rounded-xl overflow-hidden shadow-inner">
                                <div className="divide-y divide-border/40">
                                    {result.detailedIngredients.map((item, idx) => (
                                        <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-foreground uppercase tracking-tight">{item.name}</span>
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                                                        {item.proportionPercent}%
                                                    </span>
                                                </div>
                                                {/* Percentage bar indicator */}
                                                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-brand h-1.5 rounded-full" 
                                                        style={{ width: `${item.proportionPercent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                <span className="text-2xl font-black font-mono text-foreground">{item.weightRequired.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-[10px] text-muted-foreground text-center bg-background/50 py-3 rounded-lg border border-border/40 flex items-center justify-center gap-2">
                        <Sparkles size={12} className="text-brand animate-pulse" />
                        <span>Fórmula Científica: Essência = Peso Total - (Peso Total / (1 + %Essência/100))</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
