import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/analyze", async (req, res) => {
  try {
    const { situation, context } = req.body ?? {};

    if (!situation) {
      return res.status(400).json({ error: "Situation is required" });
    }

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus-08-2024",
        message: `
You are a clarity assistant.

Context: ${context}
Situation: ${situation}

Return ONLY valid JSON:
{
  "reality": "string",
  "variables": ["string", "string"],
  "nextStep": "string"
}
        `,
        temperature: 0.6,
      }),
    });

    const data = await response.json();

    console.log("COHERE CHAT RAW:", JSON.stringify(data, null, 2));

    const text = data.text;
    if (!text) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: "Invalid AI format" });
    }

    res.json(JSON.parse(match[0]));

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
