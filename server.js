import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3034;
const dataDir = path.join(process.cwd(), 'server', 'data');

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

fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DB_FILE || path.join(dataDir, 'settings.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

const selectSettings = db.prepare('SELECT data FROM settings WHERE key = ?');
const upsertSettings = db.prepare(`
  INSERT INTO settings (key, data, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET
    data = excluded.data,
    updated_at = excluded.updated_at
`);

const saveSettings = (key, data) => {
  const payload = JSON.stringify(data);
  upsertSettings.run(key, payload, new Date().toISOString());
};

const normalizeSettings = (data) => {
  if (!data || typeof data !== 'object') {
    return DEFAULT_DATA;
  }
  return {
    widgets: Array.isArray(data.widgets) ? data.widgets : DEFAULT_DATA.widgets,
    appTitle: typeof data.appTitle === 'string' ? data.appTitle : DEFAULT_DATA.appTitle,
    showTitle: typeof data.showTitle === 'boolean' ? data.showTitle : DEFAULT_DATA.showTitle,
    enableSearchPreview:
      typeof data.enableSearchPreview === 'boolean'
        ? data.enableSearchPreview
        : DEFAULT_DATA.enableSearchPreview,
  };
};

const readSettings = (key) => {
  const row = selectSettings.get(key);
  if (!row) {
    saveSettings(key, DEFAULT_DATA);
    return DEFAULT_DATA;
  }
  try {
    const parsed = JSON.parse(row.data);
    const normalized = normalizeSettings(parsed);
    if (normalized === DEFAULT_DATA) {
      saveSettings(key, DEFAULT_DATA);
    }
    return normalized;
  } catch (error) {
    console.error('Failed to parse settings payload, resetting to defaults.', error);
    saveSettings(key, DEFAULT_DATA);
    return DEFAULT_DATA;
  }
};

app.get('/api/settings', (req, res) => {
  try {
    const data = readSettings('settings');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const newData = req.body;
    if (!newData || typeof newData !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    saveSettings('settings', newData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
