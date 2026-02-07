import React, { useState, useEffect } from 'react';
import { ingredientsApi, recipesApi } from '../lib/api';
import { Plus, Trash2, ChevronRight, ChevronDown, Save, Edit, Copy, Search, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Recipes() {
  const [allIngredients, setAllIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ings, recs] = await Promise.all([
        ingredientsApi.getAll(),
        recipesApi.getAll()
      ]);
      setAllIngredients(ings);
      setRecipes(recs);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIngredientToRecipe = () => {
    if (!selectedIngId || !selectedIngQty) return;

    const ing = allIngredients.find(i => i.id === selectedIngId);
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
        await recipesApi.update(editingId, recipeData);
      } else {
        await recipesApi.add(recipeData);
      }
      setNewRecipe({ name: '', ingredients: [], yieldVal: 1 });
      setIsCreating(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save recipe:', error);
    }
  };

  const deleteRecipe = async (id) => {
    if (window.confirm('Excluir esta receita?')) {
      try {
        await recipesApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete recipe:', error);
      }
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
      await recipesApi.add(recipeData);
      fetchData();
    } catch (error) {
      console.error('Failed to duplicate recipe:', error);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewRecipe({ name: '', ingredients: [], yieldVal: 1 });
  };

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
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-white">Receitas</h2>
          {loading && <Loader2 className="animate-spin text-blue-500" size={24} />}
        </div>
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                placeholder="ex: Bolo de Cenoura"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Rendimento (Qtd Final)</label>
              <input
                type="number"
                value={newRecipe.yieldVal}
                onChange={e => setNewRecipe({ ...newRecipe, yieldVal: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                placeholder="1"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Composição</h3>
            <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
              <div className="flex-1 w-full">
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
                            <span className="font-mono text-slate-500 text-xs">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ing.cost || 0)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full md:w-32">
                <input
                  type="number"
                  value={selectedIngQty}
                  onChange={e => setSelectedIngQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  placeholder="Qtd"
                />
              </div>
              <button
                onClick={addIngredientToRecipe}
                className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>

            {newRecipe.ingredients.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                <ul className="space-y-2 mb-4 min-w-[300px]">
                  {newRecipe.ingredients.map((item, idx) => {
                    const cost = item.quantity * getIngredientCost(item.ingredientId);
                    return (
                      <li key={idx} className="flex justify-between items-center text-sm gap-2">
                        <span className="text-slate-300 truncate flex-1">{item.name}</span>
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                          <span className="text-slate-500">{item.quantity} {item.unit}</span>
                          <span className="text-slate-400 font-mono hidden md:inline">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                          </span>
                          <button onClick={() => removeIngredientFromRecipe(item.ingredientId)} className="text-red-400 hover:text-red-300 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-slate-800 pt-2 flex flex-col md:flex-row justify-end gap-2 md:gap-6 text-sm">
                  <div className="flex justify-between md:block">
                    <span className="text-slate-400">Total Custo: </span>
                    <span className="text-green-400 font-bold font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(newRecipe.ingredients))}
                    </span>
                  </div>
                  <div className="flex justify-between md:block">
                    <span className="text-slate-400">Sugerido (3x): </span>
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
              className="w-full md:w-auto bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Save size={18} /> {editingId ? 'Atualizar Receita' : 'Salvar Receita'}
            </button>
          </div>
        </div>
      )}

      {/* Recipe List */}
      <div className="grid gap-4">
        {recipes?.map(recipe => (
          <div key={recipe.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div
              className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors gap-4"
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 shrink-0">
                  {expandedRecipe === recipe.id ? <ChevronDown size={20} className="text-blue-500" /> : <ChevronRight size={20} className="text-slate-500" />}
                </div>
                <div className="space-y-1 w-full">
                  <h3 className="font-bold text-white text-lg tracking-tight">{recipe.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] md:text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">Rendimento: {recipe.yield} un</span>
                    </span>
                    <span className="text-green-400 font-mono font-bold flex items-center gap-1">
                      Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients))}
                    </span>
                    <span className="text-blue-400 font-mono font-bold flex items-center gap-1">
                      Sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients) * 3)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 md:gap-2 self-end md:self-center">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateRecipe(recipe); }}
                  className="text-slate-500 hover:text-blue-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Duplicar"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); startEditing(recipe); }}
                  className="text-slate-500 hover:text-green-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id); }}
                  className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedRecipe === recipe.id && (
              <div className="px-4 md:px-12 pb-6 pt-0 overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400 min-w-[400px]">
                  <thead className="text-[10px] uppercase bg-slate-950/50 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Ingrediente</th>
                      <th className="px-4 py-3">Qtd</th>
                      <th className="px-4 py-3">Un</th>
                      <th className="px-4 py-3 text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 border-b border-slate-800">
                    {recipe.ingredients.map((ing, i) => {
                      const cost = ing.quantity * getIngredientCost(ing.ingredientId);
                      return (
                        <tr key={i} className="hover:bg-slate-950/20">
                          <td className="px-4 py-3 text-slate-300">{ing.name}</td>
                          <td className="px-4 py-3 font-medium">{ing.quantity}</td>
                          <td className="px-4 py-3 text-slate-500">{ing.unit}</td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-xs text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950/50 font-bold text-white">
                      <td className="px-4 py-3 text-right text-xs" colSpan={3}>Custo Total</td>
                      <td className="px-4 py-3 font-mono text-green-400 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients))}
                      </td>
                    </tr>
                    <tr className="bg-slate-950/50 font-bold text-white border-t border-slate-800/50">
                      <td className="px-4 py-3 text-right text-xs text-blue-300" colSpan={3}>Venda Sugerida (3x)</td>
                      <td className="px-4 py-3 font-mono text-blue-400 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(recipe.ingredients) * 3)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ))}

        {!loading && recipes?.length === 0 && !isCreating && (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center py-20 text-slate-500">
            Nenhuma receita criada ainda. <br />
            Clique em <span className="text-blue-500 font-bold">"Nova Receita"</span> para começar.
          </div>
        )}
      </div>
    </div>
  );
}
