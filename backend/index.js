import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

console.log('env loaded, port:', PORT);

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!process.env.VERIFY_TOKEN) {
    console.error('VERIFY_TOKEN not set');
    return res.sendStatus(500);
  }

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0];
  const leadgenId = change?.value?.leadgen_id;

  if (!leadgenId) {
    return res.sendStatus(400);
  }

  const url = `https://graph.facebook.com/v21.0/${leadgenId}?fields=field_data&access_token=${process.env.PAGE_ACCESS_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.field_data) {
    console.log('graph api error:', data);
    return;
  }

  console.log('lead fetched:', data.field_data);

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`server on port ${PORT}`);
});