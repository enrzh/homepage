import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT || 3034);
const dbFile = path.join(process.cwd(), 'data.db');

const DEFAULT_SETTINGS = {
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
  };
};

const readDatabase = async () => {
  try {
    const raw = await fs.readFile(dbFile, 'utf8');
    const parsed = JSON.parse(raw);
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
  await fs.writeFile(tempFile, payload, 'utf8');
  await fs.rename(tempFile, dbFile);
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
    const normalized = normalizeSettings(incoming);
    await writeDatabase(normalized);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings.', error);
    res.status(500).json({ error: 'Failed to save settings', detail: error?.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Settings API listening on http://0.0.0.0:${PORT}`);
});
