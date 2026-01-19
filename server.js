import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = Number(process.env.PORT || 3034);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'data.db');

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
    const raw = await fsp.readFile(dbFile, 'utf8');
    const parsed = JSON.parse(raw);
    console.log(`[settings] Loaded settings from ${dbFile}`);
    return normalizeSettings(parsed);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read database, resetting to defaults.', error);
    }
    return { ...DEFAULT_SETTINGS };
  }
};

const writeDatabase = async (settings) => {
  const payload = JSON.stringify(settings, null, 2);
  const tempFile = `${dbFile}.tmp`;
  await fsp.mkdir(path.dirname(dbFile), { recursive: true });
  await fsp.writeFile(tempFile, payload, 'utf8');
  try {
    await fsp.rename(tempFile, dbFile);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await fsp.writeFile(dbFile, payload, 'utf8');
  }
  console.log(`[settings] Saved settings to ${dbFile}`);
};

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readDatabase();
    await writeDatabase(settings);
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
