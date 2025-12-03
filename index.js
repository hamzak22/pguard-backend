import express from 'express';
import cors from 'cors';
import lighthouse from '@lighthouse-web3/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',                  // Local development
    'https://hamzak22.github.io'              // Your deployed frontend
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5000;

// --- Route: Upload & Pin ---
app.post('/pin', async (req, res) => {
  const { name, encryptedBase64 } = req.body;
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });
  if (!name || !encryptedBase64) return res.status(400).json({ error: 'Missing name or data' });

  const tempFilePath = path.join(process.cwd(), `${name}.pguard.json`);

  try {
    // Convert Base64 to Buffer and write to temp file
    const buffer = Buffer.from(encryptedBase64, 'base64');
    fs.writeFileSync(tempFilePath, buffer);

    // Upload temp file
    const response = await lighthouse.upload(tempFilePath, apiKey);

    return res.status(200).json({ cid: response.data.Hash });
  } catch (err) {
    console.error('Pin error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
});

// --- Route: Unpin (Delete) using Lighthouse HTTP API ---
app.post('/unpin', async (req, res) => {
  const { cid } = req.body;
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });
  if (!cid) return res.status(400).json({ error: 'Missing CID' });

  try {
    const response = await fetch(`https://api.lighthouse.storage/api/v0/pinning/${cid}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to unpin: ${text}`);
    }

    const data = await response.json();
    return res.status(200).json({ message: 'Unpinned successfully', data });
  } catch (err) {
    console.error('Unpin error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
