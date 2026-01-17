import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 3034;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'settings.db');

app.use(cors());
app.use(express.json());

const DEFAULT_DATA = {
  widgets: [
    { id: '1', type: 'clock', title: 'Clock', config: { showDate: true, showSeconds: false, use24Hour: false, colSpan: 2 } },
    { id: '2', type: 'weather', title: 'Weather', config: { tint: 'blue' } },
    { id: '3', type: 'stocks', title: 'SPY', config: { symbol: 'SPY', tint: 'green' } },
    { id: '4', type: 'shortcuts', title: 'Shortcuts', config: { tint: 'orange' } },
  ],
  appTitle: 'Nexus',
  showTitle: true,
  enableSearchPreview: true,
};

const db = new sqlite3.Database(DB_FILE);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function handleRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const ensureSettingsRow = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const existing = await get('SELECT data FROM settings WHERE id = 1');
  if (!existing) {
    await run('INSERT INTO settings (id, data) VALUES (1, ?)', [JSON.stringify(DEFAULT_DATA)]);
  }
};

const readSettings = async () => {
  const row = await get('SELECT data FROM settings WHERE id = 1');
  if (!row) {
    await run('INSERT INTO settings (id, data) VALUES (1, ?)', [JSON.stringify(DEFAULT_DATA)]);
    return DEFAULT_DATA;
  }
  return JSON.parse(row.data);
};

const writeSettings = async (data) => {
  await run(
    "UPDATE settings SET data = ?, updated_at = datetime('now') WHERE id = 1",
    [JSON.stringify(data)],
  );
};

app.get('/api/settings', async (req, res) => {
  try {
    const data = await readSettings();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newData = req.body;
    await writeSettings(newData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

const startServer = async () => {
  try {
    await ensureSettingsRow();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
