import React, { useState, useEffect } from 'react';
import { ingredientsApi, productsApi } from '../lib/api';
import { Plus, Trash2, Save, Edit, X, Loader2 } from 'lucide-react';

export default function Ingredients() {
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newIng, setNewIng] = useState({ name: '', unit: 'kg', cost: 0 });

    // Inline editing state
    const [editingId, setEditingId] = useState(null);
    const [editIng, setEditIng] = useState({ name: '', unit: '', cost: 0 });

    useEffect(() => {
        fetchIngredients();
    }, []);

    const fetchIngredients = async () => {
        setLoading(true);
        try {
            const data = await ingredientsApi.getAll();
            setIngredients(data);
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        } finally {
            setLoading(false);
        }
    };

    const addIngredient = async (e) => {
        e.preventDefault();
        if (!newIng.name) return;

        try {
            await ingredientsApi.add({
                name: newIng.name,
                unit: newIng.unit,
                cost: Number(newIng.cost)
            });
            setNewIng({ name: '', unit: 'kg', cost: 0 });
            fetchIngredients();
        } catch (error) {
            console.error('Failed to add ingredient:', error);
        }
    };

    const deleteIngredient = async (id) => {
        if (window.confirm('Excluir este ingrediente?')) {
            try {
                await ingredientsApi.delete(id);
                fetchIngredients();
            } catch (error) {
                console.error('Failed to delete ingredient:', error);
            }
        }
    };

    const startEditing = (ing) => {
        setEditingId(ing.id);
        setEditIng({ name: ing.name, unit: ing.unit, cost: ing.cost || 0 });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditIng({ name: '', unit: '', cost: 0 });
    };

    const saveEditing = async () => {
        if (!editIng.name) return;

        try {
            // Update the ingredient in Supabase
            await ingredientsApi.update(editingId, {
                name: editIng.name,
                unit: editIng.unit,
                cost: Number(editIng.cost)
            });

            // Cascade update to all recipes containing this ingredient
            // (Note: In a pure cloud model, we fetch products and update them one by one)
            const allProducts = await productsApi.getAll();
            for (const product of allProducts) {
                const hasIngredient = product.ingredients.some(ing => ing.ingredientId === editingId);
                if (hasIngredient) {
                    const updatedIngredients = product.ingredients.map(ing =>
                        ing.ingredientId === editingId
                            ? { ...ing, name: editIng.name, unit: editIng.unit }
                            : ing
                    );
                    await productsApi.update(product.id, { ingredients: updatedIngredients });
                }
            }

            setEditingId(null);
            setEditIng({ name: '', unit: '', cost: 0 });
            fetchIngredients();
        } catch (error) {
            console.error('Failed to update ingredient:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold uppercase tracking-tighter">Ingredientes</h2>
                {loading && <Loader2 className="animate-spin text-brand" size={24} />}
            </div>

            {/* Add Form */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold uppercase tracking-tighter mb-4">Novo Material</h3>
                <form onSubmit={addIngredient} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nome</label>
                        <input
                            type="text"
                            value={newIng.name}
                            onChange={e => setNewIng({ ...newIng, name: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-brand transition-colors"
                            placeholder="ex: Cera de coco"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Unidade</label>
                        <select
                            value={newIng.unit}
                            onChange={e => setNewIng({ ...newIng, unit: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-brand transition-colors font-mono"
                            style={{ fontFamily: 'ui-monospace, monospace' }}
                        >
                            <option value="kg" className="font-mono">kg</option>
                            <option value="g" className="font-mono">g</option>
                            <option value="l" className="font-mono">L</option>
                            <option value="ml" className="font-mono">ml</option>
                            <option value="un" className="font-mono">un</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Custo (opcional)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newIng.cost}
                            onChange={e => setNewIng({ ...newIng, cost: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-brand transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-brand hover:opacity-90 text-slate-950 font-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand/20 uppercase text-xs"
                    >
                        <Plus size={18} /> Adicionar
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-surface border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-left min-w-[500px] md:min-w-full">
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                        <tr>
                            <th className="px-4 md:px-6 py-4">Nome</th>
                            <th className="px-4 md:px-6 py-4">Unidade</th>
                            <th className="px-4 md:px-6 py-4">Custo</th>
                            <th className="px-4 md:px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {ingredients?.map((ing) => (
                            <tr key={ing.id} className="hover:bg-slate-800/50 transition-colors">
                                {editingId === ing.id ? (
                                    // Editing Mode
                                    <>
                                        <td className="px-4 md:px-6 py-3">
                                            <input
                                                type="text"
                                                value={editIng.name}
                                                onChange={e => setEditIng({ ...editIng, name: e.target.value })}
                                                className="w-full bg-background border border-border rounded px-2 py-1 text-foreground text-sm focus:outline-none focus:border-brand transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-3">
                                            <select
                                                value={editIng.unit}
                                                onChange={e => setEditIng({ ...editIng, unit: e.target.value })}
                                                className="bg-background border border-border rounded px-2 py-1 text-foreground text-sm focus:outline-none focus:border-brand transition-colors font-mono"
                                                style={{ fontFamily: 'ui-monospace, monospace' }}
                                            >
                                                <option value="kg" className="font-mono">kg</option>
                                                <option value="g" className="font-mono">g</option>
                                                <option value="l" className="font-mono">L</option>
                                                <option value="ml" className="font-mono">ml</option>
                                                <option value="un" className="font-mono">un</option>
                                            </select>
                                        </td>
                                        <td className="px-4 md:px-6 py-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editIng.cost}
                                                onChange={e => setEditIng({ ...editIng, cost: e.target.value })}
                                                className="w-24 bg-background border border-border rounded px-2 py-1 text-foreground text-sm focus:outline-none focus:border-brand transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={saveEditing}
                                                    className="text-brand hover:text-brand/80 transition-colors p-1"
                                                    title="Salvar"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                                                    title="Cancelar"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    // Display Mode
                                    <>
                                        <td className="px-4 md:px-6 py-4">{ing.name}</td>
                                        <td className="px-4 md:px-6 py-4 text-muted-foreground font-mono text-sm">{ing.unit}</td>
                                        <td className="px-4 md:px-6 py-4 text-muted-foreground font-mono text-sm">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ing.cost || 0)}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => startEditing(ing)}
                                                    className="text-slate-500 hover:text-brand transition-colors p-1"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteIngredient(ing.id)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {!loading && ingredients?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 md:px-6 py-8 text-center text-slate-500">
                                    Nenhum ingrediente adicionado ainda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
