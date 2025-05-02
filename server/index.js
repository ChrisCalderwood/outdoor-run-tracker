require('dotenv').config();
const express               = require('express');
const cors                  = require('cors');
const AWS                   = require('aws-sdk');
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const app = express();
const PORT = process.env.PORT || 5050;

// ——— Cognito JWT Verifier ———
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse:   'id',
  clientId:   process.env.COGNITO_APP_CLIENT_ID,
});

// ——— Configure DynamoDB ———
AWS.config.update({ region: process.env.AWS_REGION });
const ddb = new AWS.DynamoDB.DocumentClient();

// ——— Middleware ———
app.use(cors());
app.use(express.json());

// ——— Health-check ———
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ——— Protected Location Endpoint ———
app.post('/api/location', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  let payload;
  try {
    payload = await verifier.verify(token);
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Extract the Cognito user ID (sub) from the token
  const userId   = payload.sub;
  const { latitude, longitude, runId } = req.body;
  // Server assigns a unique timestamp
  const timestamp = Date.now();

  const params = {
    TableName: process.env.LOCATION_TABLE,
    Item:      { userId, runId, timestamp, latitude, longitude }
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


app.get('/api/summary/:runId', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  
  let payload;
  try {
   payload = await verifier.verify(token);
  } catch {
   return res.status(403).json({ error: 'Invalid token' });
  }
  const userId = payload.sub;
  const runId  = req.params.runId;
  
  // Query all points for this user/run
  const params = {
    TableName: process.env.LOCATION_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ConsistentRead: true
   };

  try {
    const { Items: allItems } = await ddb.query(params).promise();
    const Items = allItems.filter(item => item.runId === runId);
    if (!Items.length) return res.json({ message: 'No points found.' });
   
    // Sort by timestamp
    Items.sort((a, b) => a.timestamp - b.timestamp);

    if (Items.length < 2) {
      return res.json({
        message: 'Not enough data to summarize',
        pointCount: Items.length
      });
    }

    const totalTime = (Items[Items.length-1].timestamp - Items[0].timestamp) / 1000;
    if (totalTime <= 0) {
      return res.json({
        message: 'Run duration too short',
        pointCount: Items.length
      });
    }
   
    // Haversine formula
    const toRad = x => (x * Math.PI) / 180;
    const distBetween = (p1, p2) => {
      const R = 6371000;
      const φ1 = toRad(p1.latitude), φ2 = toRad(p2.latitude);
      const Δφ = toRad(p2.latitude - p1.latitude);
      const Δλ = toRad(p2.longitude - p1.longitude);
      const a = Math.sin(Δφ/2)**2 +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };
   
    let totalDist = 0, maxSpeed = 0;
    for (let i = 1; i < Items.length; i++) {
      const d  = distBetween(Items[i-1], Items[i]);
      const dt = (Items[i].timestamp - Items[i-1].timestamp) / 1000;
      const speed = d / dt;
      totalDist += d;
      if (speed > maxSpeed) maxSpeed = speed;
    }
    
    const avgSpeed  = totalDist / totalTime;
   
    res.json({
      totalDistanceMeters: totalDist,
      totalTimeSeconds:    totalTime,
      averageSpeedMps:     avgSpeed,
      maxSpeedMps:         maxSpeed,
      pointCount:          Items.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

// GET /api/runs
app.get('/api/runs', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  let payload;
  try {
    payload = await verifier.verify(token);
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
  const userId = payload.sub;

  // Query all items for this user, strongly consistent
  const params = {
    TableName: process.env.LOCATION_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ConsistentRead: true
  };
  const { Items } = await ddb.query(params).promise();

  // Group by runId -> pick earliest timestamp as startTime
  const runsMap = Items.reduce((map, item) => {
    const { runId, timestamp } = item;
    if (!map[runId] || timestamp < map[runId].startTime) {
      map[runId] = { runId, startTime: timestamp };
    }
    return map;
  }, {});

  // Convert to array & sort descending by startTime
  const runs = Object.values(runsMap)
    .sort((a,b) => b.startTime - a.startTime);

  res.json(runs);
});

// ——— Start the Server ———
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
