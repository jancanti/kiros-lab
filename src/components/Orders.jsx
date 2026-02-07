import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Calculator, ClipboardList, CheckCircle, Plus, Trash2 } from 'lucide-react';

export default function Orders() {
    const recipes = useLiveQuery(() => db.recipes.orderBy('name').toArray());

    // Staging state for adding a new item
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [quantity, setQuantity] = useState('');

    // List of recipes to produce
    const [productionList, setProductionList] = useState([]);

    // Aggregated requirements
    const [requirements, setRequirements] = useState(null);

    const addToProductionList = () => {
        if (!selectedRecipeId || !quantity) return;
        const recipe = recipes.find(r => r.id === Number(selectedRecipeId));
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
        setRequirements(null); // Clear previous results until recalculated
    };

    const removeFromList = (index) => {
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

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Planejamento de Produção</h2>

            {/* Selection Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600/20 p-3 rounded-lg text-blue-400">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Adicionar à Ordem</h3>
                        <p className="text-slate-400 text-sm">Monte sua lista de produção</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Receita</label>
                        <select
                            value={selectedRecipeId}
                            onChange={e => setSelectedRecipeId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Escolha...</option>
                            {recipes?.map(r => (
                                <option key={r.id} value={r.id}>{r.name} (Rendimento: {r.yield})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Quantidade Desejada</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Qtd"
                        />
                    </div>

                    <button
                        onClick={addToProductionList}
                        disabled={!selectedRecipeId || !quantity}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors h-[50px]"
                    >
                        <Plus size={18} /> Adicionar
                    </button>
                </div>
            </div>

            {/* Production List & Actions */}
            {productionList.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Itens da Ordem</h3>
                        <ul className="space-y-3">
                            {productionList.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <div>
                                        <div className="font-medium text-white">{item.recipeName}</div>
                                        <div className="text-xs text-slate-500">Produzir: {item.targetQuantity} un</div>
                                    </div>
                                    <button
                                        onClick={() => removeFromList(idx)}
                                        className="text-red-400 hover:text-red-300 p-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <button
                                onClick={calculateRequirements}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Calculator size={18} /> Calcular Materiais
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {requirements && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ClipboardList className="text-green-400" />
                                    Relatório Consolidado
                                </h3>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-slate-800">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Ingrediente</th>
                                            <th className="px-4 py-3 text-right">Necessário</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {requirements.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/20">
                                                <td className="px-4 py-3 text-slate-200 text-sm font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-right font-mono text-blue-400">
                                                    {item.requiredQty.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">{item.unit}</span>
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
        </div>
    );
}
