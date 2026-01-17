import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3034;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to start the settings API.');
}

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

const pool = new Pool({ connectionString: DATABASE_URL });

const ensureSettingsRow = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await pool.query('SELECT data FROM settings WHERE id = 1');
  if (existing.rowCount === 0) {
    await pool.query('INSERT INTO settings (id, data) VALUES (1, $1)', [DEFAULT_DATA]);
  }
};

const readSettings = async () => {
  const result = await pool.query('SELECT data FROM settings WHERE id = 1');
  if (result.rowCount === 0) {
    await pool.query('INSERT INTO settings (id, data) VALUES (1, $1)', [DEFAULT_DATA]);
    return DEFAULT_DATA;
  }
  return result.rows[0].data;
};

const writeSettings = async (data) => {
  await pool.query(
    'UPDATE settings SET data = $1, updated_at = NOW() WHERE id = 1',
    [data],
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
