import React, { useState, useEffect } from 'react';
import { ingredientsApi, productsApi } from '../lib/api';
import { Plus, Trash2, ChevronRight, ChevronDown, Save, Edit, Copy, Search, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Products() {
  const [allIngredients, setAllIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    ingredients: [],
    yieldVal: 1,
    unit: 'un'
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
        productsApi.getAll()
      ]);
      setAllIngredients(ings);
      setProducts(recs.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIngredientToProduct = () => {
    if (!selectedIngId || !selectedIngQty) return;

    const ing = allIngredients.find(i => i.id === selectedIngId);
    if (!ing) return;

    setNewProduct(prev => ({
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

  const removeIngredientFromProduct = (id) => {
    setNewProduct(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.ingredientId !== id)
    }));
  };

  const saveProduct = async () => {
    if (!newProduct.name || newProduct.ingredients.length === 0) return;

    const productData = {
      name: newProduct.name,
      ingredients: newProduct.ingredients,
      yield: Number(newProduct.yieldVal),
      unit: newProduct.unit || 'un'
    };

    try {
      if (editingId) {
        await productsApi.update(editingId, productData);
      } else {
        await productsApi.add(productData);
      }
      setNewProduct({ name: '', ingredients: [], yieldVal: 1, unit: 'un' });
      setIsCreating(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save recipe:', error);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Excluir este produto?')) {
      try {
        await productsApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete recipe:', error);
      }
    }
  };

  const duplicateProduct = async (product) => {
    const newName = `${product.name} (Duplicado)`;
    const productData = {
      name: newName,
      ingredients: product.ingredients,
      yield: product.yield,
      unit: product.unit || 'un'
    };

    try {
      await productsApi.add(recipeData);
      fetchData();
    } catch (error) {
      console.error('Failed to duplicate recipe:', error);
    }
  };

  const startEditing = (product) => {
    setNewProduct({
      name: product.name,
      ingredients: product.ingredients,
      yieldVal: product.yield,
      unit: product.unit || 'un'
    });
    setEditingId(product.id);
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewProduct({ name: '', ingredients: [], yieldVal: 1, unit: 'un' });
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
          <h2 className="text-3xl font-bold uppercase tracking-tighter">Produtos</h2>
          {loading && <Loader2 className="animate-spin text-brand" size={24} />}
        </div>
        <button
          onClick={isCreating ? cancelEditing : () => setIsCreating(true)}
          className="bg-brand hover:opacity-90 text-slate-950 px-4 py-2 rounded-xl flex items-center gap-2 font-black transition-all active:scale-95 shadow-lg shadow-brand/20 uppercase text-xs"
        >
          {isCreating ? 'Cancelar' : <><Plus size={18} /> Novo Produto</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-white">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nome do Produto</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-brand/50 outline-none transition-colors"
                placeholder="ex: Vela de Lavanda"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Rendimento (Qtd Final)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newProduct.yieldVal}
                  onChange={e => setNewProduct({ ...newProduct, yieldVal: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-brand/50 outline-none transition-colors"
                  placeholder="1"
                />
                <select
                  value={newProduct.unit}
                  onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-20 bg-background border border-border rounded-lg px-2 py-2 text-foreground focus:border-brand/50 outline-none transition-colors text-xs"
                >
                  <option value="un">un</option>
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="l">l</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Composição</h3>
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
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 pl-9 text-foreground focus:outline-none focus:border-brand transition-colors"
                    />
                    <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                    {ingredientSearch && (
                      <button
                        onClick={() => {
                          setIngredientSearch('');
                          setSelectedIngId('');
                          setIsIngredientDropdownOpen(false);
                        }}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {isIngredientDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
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
                            className="px-4 py-2 hover:bg-accent cursor-pointer text-sm flex justify-between group"
                          >
                            <span className="group-hover:text-brand transition-colors font-bold">{ing.name} ({ing.unit})</span>
                            <span className="font-mono text-muted-foreground text-xs">
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-brand outline-none"
                  placeholder="Qtd"
                />
              </div>
              <button
                onClick={addIngredientToProduct}
                className="w-full md:w-auto bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg transition-colors border border-border"
              >
                Adicionar
              </button>
            </div>

            {newProduct.ingredients.length > 0 && (
              <div className="bg-background/50 border border-border p-4 rounded-lg overflow-x-auto">
                <ul className="space-y-2 mb-4 min-w-[300px]">
                  {newProduct.ingredients.map((item, idx) => {
                    const cost = item.quantity * getIngredientCost(item.ingredientId);
                    return (
                      <li key={idx} className="flex justify-between items-center text-sm gap-2">
                        <span className="text-foreground/80 truncate flex-1">{item.name}</span>
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                          <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                          <span className="text-muted-foreground font-mono hidden md:inline">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                          </span>
                          <button onClick={() => removeIngredientFromProduct(item.ingredientId)} className="text-red-400 hover:text-red-300 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-border pt-2 flex flex-col md:flex-row justify-end gap-2 md:gap-6 text-sm">
                  <div className="flex justify-between md:block">
                    <span className="text-muted-foreground">Total Custo: </span>
                    <span className="font-bold font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(newProduct.ingredients))}
                    </span>
                  </div>
                  <div className="flex justify-between md:block">
                    <span className="text-muted-foreground">Sugerido (3x): </span>
                    <span className="text-brand font-bold font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(newProduct.ingredients) * 3)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={saveProduct}
              disabled={!newProduct.name || newProduct.ingredients.length === 0}
              className="w-full md:w-auto bg-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand/20 active:scale-95 uppercase tracking-tighter"
            >
              <Save size={18} /> {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
            </button>
          </div>
        </div>
      )}

      {/* Recipe List */}
      <div className="grid gap-4">
        {products?.map(product => (
          <div key={product.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div
              className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors gap-4"
              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 shrink-0">
                  {expandedProduct === product.id ? <ChevronDown size={20} className="text-brand" /> : <ChevronRight size={20} className="text-muted-foreground" />}
                </div>
                <div className="space-y-1 w-full">
                  <h3 className="font-bold text-lg tracking-tight">{product.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] md:text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border">Rendimento: {product.yield} {product.unit || 'un'}</span>
                    </span>
                    <span className="text-muted-foreground font-mono font-bold flex items-center gap-1">
                      Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(product.ingredients))}
                    </span>
                    <span className="text-brand font-mono font-bold flex items-center gap-1">
                      Sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(product.ingredients) * 3)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 md:gap-2 self-end md:self-center">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateProduct(product); }}
                  className="text-muted-foreground hover:text-blue-400 p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Duplicar"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); startEditing(product); }}
                  className="text-muted-foreground hover:text-green-500 p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                  className="text-muted-foreground hover:text-red-400 p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedProduct === product.id && (
              <div className="px-4 md:px-12 pb-6 pt-0 overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground min-w-[400px]">
                  <thead className="text-[10px] uppercase bg-muted/30 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Ingrediente</th>
                      <th className="px-4 py-3">Qtd</th>
                      <th className="px-4 py-3">Un</th>
                      <th className="px-4 py-3 text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border border-b border-border">
                    {[...product.ingredients].sort((a, b) => a.name.localeCompare(b.name)).map((ing, i) => {
                      const cost = ing.quantity * getIngredientCost(ing.ingredientId);
                      return (
                        <tr key={i} className="hover:bg-accent/20">
                          <td className="px-4 py-3 text-foreground/80">{ing.name}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{ing.quantity}</td>
                          <td className="px-4 py-3 text-muted-foreground">{ing.unit}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground text-xs text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-bold text-foreground">
                      <td className="px-4 py-3 text-right text-xs" colSpan={3}>Custo Total</td>
                      <td className="px-4 py-3 font-mono text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(product.ingredients))}
                      </td>
                    </tr>
                    <tr className="bg-muted/30 font-bold border-t border-border">
                      <td className="px-4 py-3 text-right text-xs text-brand" colSpan={3}>Venda Sugerida (3x)</td>
                      <td className="px-4 py-3 font-mono text-brand text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalCost(product.ingredients) * 3)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ))}

        {!loading && products?.length === 0 && !isCreating && (
          <div className="border border-dashed border-border rounded-xl text-center py-20 text-muted-foreground">
            Nenhum produto criado ainda. <br />
            Clique em <span className="text-brand font-bold uppercase tracking-tighter">"Novo Produto"</span> para começar.
          </div>
        )}
      </div>
    </div>
  );
}
