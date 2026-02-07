import { supabase } from './supabase';

/**
 * INGREDIENTS API
 */
export const ingredientsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async add(ingredient) {
        const { data, error } = await supabase
            .from('ingredients')
            .insert([ingredient])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('ingredients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

/**
 * PRODUCTS API
 */
export const productsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async add(recipe) {
        const { data, error } = await supabase
            .from('recipes')
            .insert([recipe])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('recipes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

/**
 * ORDERS API
 */
export const ordersApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async add(order) {
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};
