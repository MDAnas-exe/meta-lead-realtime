import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const seenLeadIds = new Set();
let isInitialized = false;

const PORT = process.env.PORT || 3000;

app.use(express.json());

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
  seenLeadIds.add(leadId);

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

function seedExistingLeads(leads) {
  leads.forEach((item) => seenLeadIds.add(item.id));
  isInitialized = true;
}

async function pollFormLeads() {
  if (!process.env.FORM_ID || !process.env.PAGE_ACCESS_TOKEN) return;

  try {
    const url = `https://graph.facebook.com/v21.0/${process.env.FORM_ID}/leads?fields=id,created_time,field_data&access_token=${process.env.PAGE_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.error) {
      console.log('meta api error:', result.error.message);
      return;
    }

    if (!result.data || !Array.isArray(result.data)) {
      return;
    }

    if (!isInitialized) {
      seedExistingLeads(result.data);
      console.log('initialized with', result.data.length, 'existing leads');
      return;
    }

    for (const item of result.data) {
      if (!seenLeadIds.has(item.id)) {
        processAndBroadcastLead(item.id, item.field_data);
      }
    }
  } catch (err) {
    console.error('polling error:', err.message);
  }
}

httpServer.listen(PORT, () => {
  console.log(`meta-lead-realtime server running on port ${PORT}`);
  pollFormLeads();
  setInterval(pollFormLeads, 5000);
});