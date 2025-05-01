require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const PORT = process.env.PORT || 5050;

// ----- Configure DynamoDB -----
AWS.config.update({ region: process.env.AWS_REGION });
const ddb = new AWS.DynamoDB.DocumentClient();

// ----- Middleware -----
app.use(cors());
app.use(express.json());

// ----- Health-check route -----
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ----- Location endpoint -----
app.post('/api/location', async (req, res) => {
  const { latitude, longitude, timestamp } = req.body;

  // TODO: replace with real userId once you add Cognito
  const userId = 'demo-user';

  const params = {
    TableName: process.env.LOCATION_TABLE,
    Item: {
      userId,
      timestamp,
      latitude,
      longitude
    }
  };

  try {
    await ddb.put(params).promise();
    console.log('Saved to DynamoDB:', params.Item);
    res.status(200).json({ message: 'Location saved.' });
  } catch (err) {
    console.error('DynamoDB error:', err);
    res.status(500).json({ error: 'Could not save location' });
  }
});

// ----- Start server -----
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
