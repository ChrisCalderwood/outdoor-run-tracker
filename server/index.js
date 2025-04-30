const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Placeholder for receiving location data
app.post('/api/location', (req, res) => {
  console.log('Received location:', req.body);
  res.status(200).json({ message: 'Location received' });
});

// Placeholder for returning summary stats
app.get('/api/summary', (req, res) => {
  // Will return speed/distance summary later
  res.status(200).json({ message: 'Summary endpoint works!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});