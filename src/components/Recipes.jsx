import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Plus, Trash2, ChevronRight, ChevronDown, Save, Edit, Copy, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Recipes() {
  const allIngredients = useLiveQuery(() => db.ingredients.orderBy('name').toArray());
  const recipes = useLiveQuery(() => db.recipes.orderBy('name').toArray());

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track which recipe is being edited
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: [],
    yieldVal: 1
  });

  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedIngQty, setSelectedIngQty] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [isIngredientDropdownOpen, setIsIngredientDropdownOpen] = useState(false);

  const addIngredientToRecipe = () => {
    if (!selectedIngId || !selectedIngQty) return;

    const ing = allIngredients.find(i => i.id === Number(selectedIngId));
    if (!ing) return;

    setNewRecipe(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredientId: ing.id,
          name: ing.name,
          unit: ing.unit,
          quantity: Number(selectedIngQty)
        }
      ]
    }));

    setSelectedIngId('');
    setSelectedIngQty('');
    setIngredientSearch('');
  };

  const removeIngredientFromRecipe = (id) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.ingredientId !== id)
    }));
  };

  const saveRecipe = async () => {
    if (!newRecipe.name || newRecipe.ingredients.length === 0) return;

    const recipeData = {
      name: newRecipe.name,
      ingredients: newRecipe.ingredients,
      yield: Number(newRecipe.yieldVal)
    };

    try {
      if (editingId) {
        await db.recipes.update(editingId, recipeData);
      } else {
        await db.recipes.add(recipeData);
      }
      setNewRecipe({ name: '', ingredients: [], yieldVal: 1 });
      setIsCreating(false);
      setEditingId(null);
      setIngredientSearch('');
      setSelectedIngId('');
      setSelectedIngQty('');
    } catch (error) {
      console.error('Failed to save recipe:', error);
    }
  };

  const deleteRecipe = async (id) => {
    if (window.confirm('Excluir esta receita?')) {
      await db.recipes.delete(id);
    }
  };

  const duplicateRecipe = async (recipe) => {
    const newName = `${recipe.name} (Duplicado)`;
    const recipeData = {
      name: newName,
      ingredients: recipe.ingredients,
      yield: recipe.yield
    };

    try {
      const id = await db.recipes.add(recipeData);
      // Optional: Automatically open the new recipe for editing
      startEditing({ ...recipeData, id });
    } catch (error) {
      console.error('Failed to duplicate recipe:', error);
      alert('Erro ao duplicar receita.');
    }
  };

  const startEditing = (recipe) => {
    setNewRecipe({
      name: recipe.name,
      ingredients: recipe.ingredients,
      yieldVal: recipe.yield
    });
    setEditingId(recipe.id);
    setIsCreating(true);
    // Scroll to top or ensure form is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewRecipe({ name: '', ingredients: [], yieldVal: 1 });
    setIngredientSearch('');
    setSelectedIngId('');
    setSelectedIngQty('');
  };

  // Helper to find ingredient cost
  const getIngredientCost = (ingId) => {
    const ing = allIngredients?.find(i => i.id === ingId);
    return ing ? (ing.cost || 0) : 0;
  };

  const calculateTotalCost = (ingredientsList) => {
    return ingredientsList.reduce((acc, item) => {
      const unitCost = getIngredientCost(item.ingredientId);
      return acc + (item.quantity * unitCost);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Receitas</h2>
        <button
          onClick={isCreating ? cancelEditing : () => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {isCreating ? 'Cancelar' : <><Plus size={18} /> Nova Receita</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-white">{editingId ? 'Editar Receita' : 'Nova Receita'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Nome da Receita</label>
              <input
                type="text"
                value={newRecipe.name}
                onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="ex: Bolo de Cenoura"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Rendimento (Qtd Final)</label>
              <input
                type="number"
                value={newRecipe.yieldVal}
                onChange={e => setNewRecipe({ ...newRecipe, yieldVal: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="1"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Composição</h3>
            <div className="flex gap-3 mb-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={ingredientSearch}
                      onChange={(e) => {
                        setIngredientSearch(e.target.value);
                        setIsIngredientDropdownOpen(true);
                        if (!e.target.value) setSelectedIngId('');
                      }}
                      onFocus={() => setIsIngredientDropdownOpen(true)}
                      placeholder="Buscar ingrediente..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pl-9 text-white focus:outline-none focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    {ingredientSearch && (
                      <button
                        onClick={() => {
                          setIngredientSearch('');
                          setSelectedIngId('');
                          setIsIngredientDropdownOpen(false);
                        }}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {isIngredientDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {allIngredients
                        ?.filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(ing => (
                          <div
                            key={ing.id}
                            onClick={() => {
                              setSelectedIngId(ing.id);
                              setIngredientSearch(ing.name);
                              setIsIngredientDropdownOpen(false);
                            }}
                            className="px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm text-slate-300 flex justify-between"
                          >
                            <span>{ing.name} ({ing.unit})</span>
                            <span className="font-mono text-slate-500">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ing.cost || 0)}
                            </span>
                          </div>
                        ))}
                      {allIngredients?.length === 0 && (
                        <div className="px-4 py-2 text-slate-500 text-sm">Nenhum ingrediente cadastrado.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  value={selectedIngQty}
                  onChange={e => setSelectedIngQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  placeholder="Qtd"
                />
              </div>
              <button
                onClick={addIngredientToRecipe}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
              >
                Adicionar
              </button>
            </div>

            {newRecipe.ingredients.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-lg">
                <ul className="space-y-2 mb-4">
                  {[...newRecipe.ingredients].sort((a, b) => a.name.localeCompare(b.name)).map((item, idx) => {
                    const cost = item.quantity * getIngredientCost(item.ingredientId);
                    return (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500">{item.quantity}</span>
                          <span className="text-slate-600">{item.unit}</span>
                          <span className="text-slate-400 font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                          </span>
                          <button onClick={() => removeIngredientFromRecipe(item.ingredientId)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-slate-800 pt-2 flex justify-end gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Total Custo: </span>
                    <span className="text-green-400 font-bold font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(newRecipe.ingredients))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sugerido: </span>
                    <span className="text-blue-400 font-bold font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(newRecipe.ingredients) * 3)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={saveRecipe}
              disabled={!newRecipe.name || newRecipe.ingredients.length === 0}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Save size={18} /> {editingId ? 'Atualizar Receita' : 'Salvar Receita'}
            </button>
          </div>
        </div>
      )}

      {/* Recipe List */}
      <div className="grid gap-4">
        {recipes?.map(recipe => (
          <div key={recipe.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
            >
              <div className="flex items-center gap-3">
                {expandedRecipe === recipe.id ? <ChevronDown size={20} className="text-blue-500" /> : <ChevronRight size={20} className="text-slate-500" />}
                <div>
                  <h3 className="font-medium text-white">{recipe.name}</h3>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Rendimento: {recipe.yield} unidade(s)</span>
                    <span className="text-green-500 font-mono">
                      Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients))}
                    </span>
                    <span className="text-blue-500 font-mono">
                      Sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients) * 3)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateRecipe(recipe); }}
                  className="text-slate-600 hover:text-blue-400 p-2"
                  title="Duplicar"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); startEditing(recipe); }}
                  className="text-slate-600 hover:text-green-400 p-2"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id); }}
                  className="text-slate-600 hover:text-red-400 p-2"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedRecipe === recipe.id && (
              <div className="px-4 md:px-12 pb-4 pt-0 overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400 min-w-[400px]">
                  <thead className="text-xs uppercase bg-slate-950/50">
                    <tr>
                      <th className="px-2 md:px-4 py-2 text-xs">Ingrediente</th>
                      <th className="px-2 md:px-4 py-2 text-xs">Qtd</th>
                      <th className="px-2 md:px-4 py-2 text-xs">Un</th>
                      <th className="px-2 md:px-4 py-2 text-xs">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[...recipe.ingredients].sort((a, b) => a.name.localeCompare(b.name)).map((ing, i) => {
                      const cost = ing.quantity * getIngredientCost(ing.ingredientId);
                      return (
                        <tr key={i}>
                          <td className="px-2 md:px-4 py-2">{ing.name}</td>
                          <td className="px-2 md:px-4 py-2">{ing.quantity}</td>
                          <td className="px-2 md:px-4 py-2 text-slate-500">{ing.unit}</td>
                          <td className="px-2 md:px-4 py-2 font-mono text-slate-300 text-xs md:text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-950/30 font-bold text-white">
                      <td className="px-2 md:px-4 py-2 text-right text-xs md:text-sm" colSpan={3}>Total</td>
                      <td className="px-2 md:px-4 py-2 font-mono text-green-400 text-xs md:text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients))}
                      </td>
                    </tr>
                    <tr className="bg-slate-950/30 font-bold text-white">
                      <td className="px-2 md:px-4 py-2 text-right text-blue-300 text-xs md:text-sm" colSpan={3}>Sugerido</td>
                      <td className="px-2 md:px-4 py-2 font-mono text-blue-400 text-xs md:text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients) * 3)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {recipes?.length === 0 && !isCreating && (
          <div className="text-center py-12 text-slate-500">
            Nenhuma receita criada ainda. Clique em "Nova Receita" para começar.
          </div>
        )}
      </div>
    </div>
  );
}
