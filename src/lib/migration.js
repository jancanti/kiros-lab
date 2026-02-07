import { supabase } from './supabase';

export async function migrateLegacyBackup() {
    try {
        console.log('🔄 Iniciando recuperação de dados legados...');

        // 1. Buscar o backup da tabela antiga
        const { data: backupRow, error: fetchError } = await supabase
            .from('backups')
            .select('data')
            .eq('id', 1)
            .single();

        if (fetchError || !backupRow) {
            console.log('ℹ️ Nenhum backup legado encontrado para migrar.');
            return { success: false, message: 'Nenhum backup encontrado.' };
        }

        const legacyData = backupRow.data;
        const { ingredients = [], recipes = [], orders = [] } = legacyData;

        if (ingredients.length === 0 && recipes.length === 0) {
            return { success: false, message: 'Backup está vazio.' };
        }

        // 2. Mapeamento de IDs (Antigo Int -> Novo UUID)
        const idMapping = {};

        // 3. Migrar Ingredientes
        console.log(`🥕 Migrando ${ingredients.length} ingredientes...`);
        for (const ing of ingredients) {
            const { data: newIng, error: ingError } = await supabase
                .from('ingredients')
                .insert([{
                    name: ing.name,
                    unit: ing.unit,
                    cost: ing.cost || 0
                }])
                .select()
                .single();

            if (!ingError && newIng) {
                idMapping[ing.id] = newIng.id;
            }
        }

        // 4. Migrar Receitas (Ajustando referências de ingredientes)
        console.log(`📖 Migrando ${recipes.length} receitas...`);
        for (const recipe of recipes) {
            const updatedIngredients = recipe.ingredients.map(ri => ({
                ...ri,
                ingredientId: idMapping[ri.ingredientId] || ri.ingredientId
            }));

            await supabase
                .from('recipes')
                .insert([{
                    name: recipe.name,
                    yield: recipe.yield,
                    unit: recipe.unit || 'un',
                    ingredients: updatedIngredients
                }]);
        }

        // 5. Migrar Ordens
        console.log(`📦 Migrando ${orders.length} ordens...`);
        for (const order of orders) {
            await supabase
                .from('orders')
                .insert([{
                    date: order.date,
                    recipe_name: order.recipeName,
                    quantity: order.targetQuantity,
                    items: order.ingredients // As ordens antigas salvavam o estado dos ingredientes na época
                }]);
        }

        console.log('✅ Migração concluída com sucesso!');
        return { success: true, message: 'Dados recuperados com sucesso!' };

    } catch (error) {
        console.error('❌ Erro crítico na migração:', error);
        return { success: false, message: error.message };
    }
}
