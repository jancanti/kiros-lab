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
        })
            .then(() => console.log('📂 Backup local salvo com sucesso'))
            .catch(() => console.log('⚠️ Local backup server indisponível'));

        // 2. Try Supabase Cloud Backup
        if (supabase) {
            console.log('☁️ Tentando sincronizar com Supabase...');
            const { error } = await supabase
                .from('backups')
                .upsert({ id: 1, data, updated_at: new Date().toISOString() });

            if (error) {
                if (error.code === 'PGRST204' || error.message.includes('schema cache')) {
                    console.error('❌ Tabela "backups" não encontrada no Supabase. Por favor, crie a tabela no dashboard do Supabase.');
                } else {
                    console.error('❌ Erro Supabase:', error.message, error.details);
                }
            } else {
                console.log('☁️ Sincronizado com Supabase com sucesso!');
            }
        } else {
            console.warn('⚠️ Supabase não configurado corretamente no cliente.');
        }

        return true;
    } catch (error) {
        console.error('❌ Falha crítica no sistema de backup:', error);
    }
    return false;
}

// Load data from backup sources
export async function loadBackup() {
    let cloudData = null;

    // 1. Try Supabase Cloud First
    if (supabase) {
        try {
            console.log('☁️ Buscando dados no Supabase...');
            const { data, error } = await supabase
                .from('backups')
                .select('data')
                .eq('id', 1)
                .single();

            if (!error && data) {
                console.log('☁️ Dados carregados da nuvem (Supabase)');
                cloudData = data.data;
            } else if (error) {
                console.log('ℹ️ Supabase: Nenhum backup encontrado ou erro no acesso.', error.message);
            }
        } catch (e) {
            console.error('❌ Falha ao carregar do Supabase:', e);
        }
    }

    if (cloudData) return cloudData;

    // 2. Fallback to Local Backup Server
    try {
        const response = await fetch(BACKUP_API);
        if (response.ok) {
            const backup = await response.json();
            if (backup.data) {
                console.log('📂 Dados carregados do servidor local');
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
    try {
        const data = await loadBackup();
        if (!data) return false;

        const ingredientCount = await db.ingredients.count();
        const recipeCount = await db.recipes.count();
        const orderCount = await db.orders.count();

        // Só restaura se o banco local estiver vazio
        if (ingredientCount === 0 && recipeCount === 0 && orderCount === 0) {
            console.log('✨ Restaurando do backup...');
            if (data.ingredients?.length > 0) await db.ingredients.bulkPut(data.ingredients);
            if (data.recipes?.length > 0) await db.recipes.bulkPut(data.recipes);
            if (data.orders?.length > 0) await db.orders.bulkPut(data.orders);
            console.log('✅ Restauração completa!');
            return true;
        } else {
            // Se já tem dados, faz apenas um backup de segurança
            console.log('ℹ️ Banco local já contém dados. Sincronizando apenas a nuvem...');
            saveBackup(db);
        }
    } catch (error) {
        console.error('❌ Erro no processo de restauração:', error);
    }
    return false;
}
