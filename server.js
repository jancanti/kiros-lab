import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const BACKUP_DIR = path.join(__dirname, 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, 'kiros-lab-backup.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Save backup
app.post('/api/backup', (req, res) => {
    try {
        const data = req.body;
        const backup = {
            timestamp: new Date().toISOString(),
            data
        };
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
        console.log(`✅ Backup saved at ${backup.timestamp}`);
        res.json({ success: true, timestamp: backup.timestamp });
    } catch (error) {
        console.error('❌ Backup failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Load backup
app.get('/api/backup', (req, res) => {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
            const backup = JSON.parse(content);
            console.log(`📂 Backup loaded from ${backup.timestamp}`);
            res.json(backup);
        } else {
            res.json({ data: null });
        }
    } catch (error) {
        console.error('❌ Load backup failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🔄 Backup server running on http://localhost:${PORT}`);
    console.log(`📁 Backups saved to: ${BACKUP_DIR}`);
});
