import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 5000;

// ✅ Middlewares
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form bodies

// 🔹 POST /analyze
app.post("/analyze", async (req, res) => {
  try {
    const body = req.body || {};
    const situation = body.situation;
    const context = body.context || "";

    if (!situation) return res.status(400).json({ error: "Situation is required" });

    const prompt = `
You are a clarity assistant.
Context: ${context}
Situation: ${situation}

Respond ONLY with valid JSON:
{
  "reality": "string",
  "variables": ["string", "string"],
  "nextStep": "string"
}
`;

    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-light",
        prompt,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!data.generations || !data.generations[0]?.text) {
      throw new Error("Empty AI response");
    }

    // 🔐 Extract JSON safely
    const rawText = data.generations[0].text;
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Invalid AI output format" });

    const json = JSON.parse(match[0]);
    res.json(json);

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
