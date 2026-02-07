import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Plus, Trash2, Save, Edit, X } from 'lucide-react';

export default function Ingredients() {
    const ingredients = useLiveQuery(async () => {
        const items = await db.ingredients.toArray();
        return items.sort((a, b) => a.name.localeCompare(b.name));
    });
    const [newIng, setNewIng] = useState({ name: '', unit: 'kg', cost: 0 });

    // Inline editing state
    const [editingId, setEditingId] = useState(null);
    const [editIng, setEditIng] = useState({ name: '', unit: '', cost: 0 });

    const addIngredient = async (e) => {
        e.preventDefault();
        if (!newIng.name) return;

        try {
            await db.ingredients.add({
                name: newIng.name,
                unit: newIng.unit,
                cost: Number(newIng.cost)
            });
            setNewIng({ name: '', unit: 'kg', cost: 0 });
        } catch (error) {
            console.error('Failed to add ingredient:', error);
        }
    };

    const deleteIngredient = async (id) => {
        if (window.confirm('Excluir este ingrediente?')) {
            await db.ingredients.delete(id);
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
            // Update the ingredient itself
            await db.ingredients.update(editingId, {
                name: editIng.name,
                unit: editIng.unit,
                cost: Number(editIng.cost)
            });

            // Cascade update to all recipes containing this ingredient
            const allRecipes = await db.recipes.toArray();
            for (const recipe of allRecipes) {
                const hasIngredient = recipe.ingredients.some(ing => ing.ingredientId === editingId);
                if (hasIngredient) {
                    const updatedIngredients = recipe.ingredients.map(ing =>
                        ing.ingredientId === editingId
                            ? { ...ing, name: editIng.name, unit: editIng.unit }
                            : ing
                    );
                    await db.recipes.update(recipe.id, { ingredients: updatedIngredients });
                }
            }

            setEditingId(null);
            setEditIng({ name: '', unit: '', cost: 0 });
        } catch (error) {
            console.error('Failed to update ingredient:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Ingredientes</h2>
            </div>

            {/* Add Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Adicionar Novo Material</h3>
                <form onSubmit={addIngredient} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Nome</label>
                        <input
                            type="text"
                            value={newIng.name}
                            onChange={e => setNewIng({ ...newIng, name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="ex: Farinha"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Unidade</label>
                        <select
                            value={newIng.unit}
                            onChange={e => setNewIng({ ...newIng, unit: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">L</option>
                            <option value="ml">ml</option>
                            <option value="un">un</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Custo (opcional)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newIng.cost}
                            onChange={e => setNewIng({ ...newIng, cost: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Adicionar
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Unidade</th>
                            <th className="px-6 py-4">Custo</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {ingredients?.map((ing) => (
                            <tr key={ing.id} className="hover:bg-slate-800/50 transition-colors">
                                {editingId === ing.id ? (
                                    // Editing Mode
                                    <>
                                        <td className="px-6 py-3">
                                            <input
                                                type="text"
                                                value={editIng.name}
                                                onChange={e => setEditIng({ ...editIng, name: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <select
                                                value={editIng.unit}
                                                onChange={e => setEditIng({ ...editIng, unit: e.target.value })}
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="kg">kg</option>
                                                <option value="g">g</option>
                                                <option value="l">L</option>
                                                <option value="ml">ml</option>
                                                <option value="un">un</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editIng.cost}
                                                onChange={e => setEditIng({ ...editIng, cost: e.target.value })}
                                                className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={saveEditing}
                                                    className="text-green-500 hover:text-green-400 transition-colors p-1"
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
                                        <td className="px-6 py-4 text-slate-200">{ing.name}</td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-sm">{ing.unit}</td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-sm">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ing.cost || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEditing(ing)}
                                                    className="text-slate-500 hover:text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteIngredient(ing.id)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {ingredients?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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
