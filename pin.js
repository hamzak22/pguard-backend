import lighthouse from "@lighthouse-web3/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, encryptedBase64 } = req.body;
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error: Missing API Key" });
  }

  if (!name || !encryptedBase64) {
    return res.status(400).json({ error: "Missing name or encryptedBase64" });
  }

  try {
    // Wrap the base64 string as a Blob
    const blob = new Blob([encryptedBase64], { type: "text/plain" });
    const file = new File([blob], `${name}.pguard.json`);

    // Upload using Lighthouse SDK
    const response = await lighthouse.upload(file, apiKey);

    // Return the CID
    return res.status(200).json({ cid: response.data.Hash });
  } catch (error) {
    console.error("Lighthouse upload error:", error);
    return res.status(500).json({ error: error.message });
  }
}
