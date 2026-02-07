import Dexie from 'dexie';
import { saveBackup } from '../lib/backup';

export const db = new Dexie('ProductionDB');

db.version(1).stores({
    ingredients: '++id, name', // name as index for easy searching
    recipes: '++id, name',     // name index
    orders: '++id, date'       // date index
});

// Debounce backup to avoid too many saves
let backupTimeout = null;
const BACKUP_DELAY = 2000; // 2 seconds after last change

function triggerBackup() {
    if (backupTimeout) clearTimeout(backupTimeout);
    backupTimeout = setTimeout(() => {
        saveBackup(db);
    }, BACKUP_DELAY);
}

// Auto-backup on any data change
db.ingredients.hook('creating', () => { setTimeout(triggerBackup, 100); });
db.ingredients.hook('updating', () => { setTimeout(triggerBackup, 100); });
db.ingredients.hook('deleting', () => { setTimeout(triggerBackup, 100); });

db.recipes.hook('creating', () => { setTimeout(triggerBackup, 100); });
db.recipes.hook('updating', () => { setTimeout(triggerBackup, 100); });
db.recipes.hook('deleting', () => { setTimeout(triggerBackup, 100); });

db.orders.hook('creating', () => { setTimeout(triggerBackup, 100); });
db.orders.hook('updating', () => { setTimeout(triggerBackup, 100); });
db.orders.hook('deleting', () => { setTimeout(triggerBackup, 100); });
