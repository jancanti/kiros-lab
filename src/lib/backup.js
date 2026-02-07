import { supabase } from './supabase';

const BACKUP_API = 'http://localhost:3001/api/backup';

// Save all data to backup server and Supabase
export async function saveBackup(db) {
    try {
        const [ingredients, recipes, orders] = await Promise.all([
            db.ingredients.toArray(),
            db.recipes.toArray(),
            db.orders.toArray()
        ]);

        const data = { ingredients, recipes, orders };

        // 1. Try Local Backup Server
        fetch(BACKUP_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(() => console.log('⚠️ Local backup server indisponível'));

        // 2. Try Supabase Cloud Backup
        if (supabase) {
            const { error } = await supabase
                .from('backups')
                .upsert({ id: 1, data, updated_at: new Date().toISOString() });

            if (error) console.error('❌ Supabase backup failed:', error);
            else console.log('☁️ Backup na nuvem (Supabase) realizado');
        }

        return true;
    } catch (error) {
        console.error('❌ Backup failed:', error);
    }
    return false;
}

// Load data from backup sources
export async function loadBackup() {
    let cloudData = null;

    // 1. Try Supabase Cloud First (usually most up-to-date across devices)
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('backups')
                .select('data')
                .eq('id', 1)
                .single();

            if (!error && data) {
                console.log('☁️ Backup carregado da nuvem (Supabase)');
                cloudData = data.data;
            }
        } catch (e) {
            console.error('❌ Supabase load failed:', e);
        }
    }

    if (cloudData) return cloudData;

    // 2. Fallback to Local Backup Server
    try {
        const response = await fetch(BACKUP_API);
        if (response.ok) {
            const backup = await response.json();
            if (backup.data) {
                console.log('📂 Backup carregado do servidor local');
                return backup.data;
            }
        }
    } catch (error) {
        console.log('⚠️ Local backup server indisponível');
    }
    return null;
}

// Restore data from backup to database
export async function restoreFromBackup(db) {
    const data = await loadBackup();
    if (!data) return false;

    try {
        const ingredientCount = await db.ingredients.count();
        const recipeCount = await db.recipes.count();
        const orderCount = await db.orders.count();

        if (ingredientCount === 0 && recipeCount === 0 && orderCount === 0) {
            if (data.ingredients?.length > 0) await db.ingredients.bulkPut(data.ingredients);
            if (data.recipes?.length > 0) await db.recipes.bulkPut(data.recipes);
            if (data.orders?.length > 0) await db.orders.bulkPut(data.orders);
            console.log('✅ Dados restaurados do backup!');
            return true;
        }
    } catch (error) {
        console.error('❌ Erro ao restaurar backup:', error);
    }
    return false;
}
