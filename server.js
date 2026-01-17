const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3034;
const DATA_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Default configuration if no DB exists
const DEFAULT_DATA = {
  widgets: [
    { id: '1', type: 'clock', title: 'Clock', config: { showDate: true, showSeconds: false, use24Hour: false, colSpan: 2 } },
    { id: '2', type: 'weather', title: 'Weather', config: { tint: 'blue' } },
    { id: '3', type: 'stocks', title: 'SPY', config: { symbol: 'SPY', tint: 'green' } },
    { id: '4', type: 'shortcuts', title: 'Shortcuts', config: { tint: 'orange' } },
  ],
  appTitle: 'Nexus',
  showTitle: true,
  enableSearchPreview: true
};

// Helper to read data
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default and create file
    await writeData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
};

// Helper to write data
const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

// GET Settings
app.get('/api/settings', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// POST Settings
app.post('/api/settings', async (req, res) => {
  try {
    const newData = req.body;
    // Basic validation could go here
    await writeData(newData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});