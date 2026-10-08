import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const seenLeadIds = new Set();

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

function processAndBroadcastLead(leadId, fieldData) {
  if (!leadId || !fieldData) return;

  if (seenLeadIds.has(leadId)) return;

  const lead = fieldData.reduce((acc, field) => {
    acc[field.name] = field.values[0];
    return acc;
  }, { id: leadId });

  console.log('lead broadcasted:', lead);
  io.emit('lead', lead);
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0];
  const leadgenId = change?.value?.leadgen_id;

  if (!leadgenId) {
    return;
  }

  const url = `https://graph.facebook.com/v21.0/${leadgenId}?fields=field_data&access_token=${process.env.PAGE_ACCESS_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.field_data) {
    console.log('graph api error:', data);
    return;
  }

  processAndBroadcastLead(leadgenId, data.field_data);
});

httpServer.listen(PORT, () => {
  console.log(`server on port ${PORT}`);
});