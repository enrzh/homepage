import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const app = express();
const PORT = Number(process.env.PORT || 3034);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.resolve(__dirname, 'settings.db');
let db;
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const DEFAULT_SETTINGS = {
  widgets: [
    { id: '1', type: 'clock', title: 'Clock', config: { showDate: true, showSeconds: false, use24Hour: false, colSpan: 2 } },
    { id: '2', type: 'weather', title: 'Weather', config: { tint: 'blue' } },
    { id: '3', type: 'stocks', title: 'SPY', config: { symbol: 'SPY', tint: 'green' } },
    { id: '4', type: 'shortcuts', title: 'Shortcuts', config: { tint: 'orange' } },
  ],
  appTitle: 'Homepage',
  showTitle: true,
  enableSearchPreview: true,
  lockWidgets: false,
};

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const normalizeSettings = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    widgets: Array.isArray(payload.widgets) ? payload.widgets : DEFAULT_SETTINGS.widgets,
    appTitle: typeof payload.appTitle === 'string' ? payload.appTitle : DEFAULT_SETTINGS.appTitle,
    showTitle: typeof payload.showTitle === 'boolean' ? payload.showTitle : DEFAULT_SETTINGS.showTitle,
    enableSearchPreview:
      typeof payload.enableSearchPreview === 'boolean'
        ? payload.enableSearchPreview
        : DEFAULT_SETTINGS.enableSearchPreview,
    lockWidgets: typeof payload.lockWidgets === 'boolean' ? payload.lockWidgets : DEFAULT_SETTINGS.lockWidgets,
  };
};

const openDatabase = () => new Database(dbFile);

const initializeDatabase = () => {
  try {
    db = openDatabase();
    db.pragma('journal_mode = WAL');
  } catch (error) {
    if (error.code === 'SQLITE_NOTADB') {
      let legacySettings = null;
      try {
        const raw = fs.readFileSync(dbFile, 'utf8');
        legacySettings = JSON.parse(raw);
      } catch (legacyError) {
        console.warn('[settings] Failed to parse legacy JSON settings.', legacyError);
      }
      try {
        const backupFile = `${dbFile}.json-backup-${Date.now()}`;
        fs.renameSync(dbFile, backupFile);
        console.warn(`[settings] Backed up legacy JSON database to ${backupFile}`);
      } catch (renameError) {
        console.error('[settings] Failed to backup legacy JSON database.', renameError);
      }
      db = openDatabase();
      db.pragma('journal_mode = WAL');
      const normalizedLegacy = normalizeSettings(legacySettings);
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      db.prepare('INSERT INTO settings (id, payload) VALUES (1, ?)').run(JSON.stringify(normalizedLegacy));
      return;
    }
    throw error;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const row = db.prepare('SELECT payload FROM settings WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO settings (id, payload) VALUES (1, ?)').run(JSON.stringify(DEFAULT_SETTINGS));
  }
};

initializeDatabase();

const mergeSettings = (current, incoming) => ({
  widgets: Array.isArray(incoming.widgets) ? incoming.widgets : current.widgets,
  appTitle: typeof incoming.appTitle === 'string' ? incoming.appTitle : current.appTitle,
  showTitle: typeof incoming.showTitle === 'boolean' ? incoming.showTitle : current.showTitle,
  enableSearchPreview:
    typeof incoming.enableSearchPreview === 'boolean' ? incoming.enableSearchPreview : current.enableSearchPreview,
  lockWidgets: typeof incoming.lockWidgets === 'boolean' ? incoming.lockWidgets : current.lockWidgets,
});

const readDatabase = async () => {
  try {
    const row = db.prepare('SELECT payload FROM settings WHERE id = 1').get();
    if (!row) {
      console.warn('[settings] Missing settings row, returning defaults.');
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(row.payload);
    console.log(`[settings] Loaded settings from sqlite ${dbFile}`);
    return normalizeSettings(parsed);
  } catch (error) {
    console.error('Failed to read database, resetting to defaults.', error);
    return { ...DEFAULT_SETTINGS };
  }
};

const writeDatabase = async (settings) => {
  const payload = JSON.stringify(settings, null, 2);
  db.prepare(
    `
      INSERT INTO settings (id, payload, updated_at)
      VALUES (1, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
  ).run(payload);
  console.log(`[settings] Saved settings to sqlite ${dbFile}`);
};

app.get('/api/stock-proxy', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  try {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=15m&range=1d`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://finance.yahoo.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[stock-proxy] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readDatabase();
    res.json(settings);
  } catch (error) {
    console.error('Failed to load settings.', error);
    res.status(500).json({ error: 'Failed to load settings', detail: error?.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    console.log('[settings] Received settings update', incoming);
    const current = await readDatabase();
    const merged = mergeSettings(current, incoming);
    const normalized = normalizeSettings(merged);
    console.log('[settings] Normalized settings update', normalized);
    await writeDatabase(normalized);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings.', error);
    res.status(500).json({ error: 'Failed to save settings', detail: error?.message });
  }
});

const distPath = path.join(__dirname, 'dist');
const distIndex = path.join(distPath, 'index.html');
const hasClientBuild = fs.existsSync(distIndex);

if (hasClientBuild) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(distIndex);
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Settings API listening on http://0.0.0.0:${PORT}`);
});

const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server.`);
  db.close();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Force exiting after shutdown timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
