import lighthouse from '@lighthouse-web3/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cid } = req.body;
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  if (!cid) {
    return res.status(400).json({ error: 'Missing CID' });
  }

  try {
    // Attempt to remove/unpin
    // Note: deleteFile is available in the SDK
    const response = await lighthouse.deleteFile(cid, apiKey);
    
    return res.status(200).json({ success: true, message: 'File deleted/unpinned', response });
  } catch (error) {
    console.error('Lighthouse delete error:', error);
    return res.status(500).json({ error: error.message });
  }
}
