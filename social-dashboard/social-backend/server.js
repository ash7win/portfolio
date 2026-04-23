const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const db = require("./database");

require("dotenv").config();

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/api/generate", async (req, res) => {
  const { brief, tone } = req.body;
  if (!brief || !tone) return res.status(400).json({ error: "brief and tone are required" });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: "You are a social media manager writing Instagram posts. You always respond with valid JSON only — no explanation, no markdown, no backticks.",
        },
        {
          role: "user",
          content: `Campaign brief: ${brief}
Tone: ${tone}

Generate exactly 3 distinct Instagram post options for this campaign.

Respond ONLY with a JSON array in this exact format:
[
  { "caption": "the post text here", "hashtags": "#tag1 #tag2 #tag3 #tag4" },
  { "caption": "...", "hashtags": "..." },
  { "caption": "...", "hashtags": "..." }
]`,
        },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    const posts = JSON.parse(raw);

    const result = posts.map((p, i) => ({
      id: Date.now() + i,
      caption: p.caption,
      hashtags: p.hashtags,
      tone: tone,
      status: "draft",
      image: null,
      created_at: new Date().toISOString(),
    }));

    result.forEach((post) => db.savePost(post));
    db.deleteOldestIfOver(15);

    res.json({ posts: result });
  } catch (err) {
    console.error("Error calling Groq:", err.message);
    res.status(500).json({ error: "Failed to generate posts" });
  }
});

app.post("/api/image-prompt", async (req, res) => {
  const { caption, postId } = req.body;
  if (!caption) return res.status(400).json({ error: "caption is required" });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: "You write short image generation prompts. Respond with only the prompt — no explanation, no quotes, no punctuation at the end. Max 20 words. Make it visual, specific, and photographic.",
        },
        {
          role: "user",
          content: `Write an Instagram image generation prompt for this caption:\n\n"${caption}"\n\nDescribe a real photographic scene that matches the mood and subject. No text or logos in the image.`,
        },
      ],
    });

    const prompt = completion.choices[0].message.content.trim();
    console.log("Image prompt:", prompt);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt + ", instagram photo, high quality, photorealistic",
          num_steps: 8,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      throw new Error(`Cloudflare returned ${cfRes.status}: ${errText}`);
    }

    const cfData = await cfRes.json();
    const base64 = cfData.result.image;
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    if (postId) db.updatePost(postId, { image: dataUrl });

    console.log("Image generated successfully");
    res.json({ prompt, imageUrl: dataUrl });
  } catch (err) {
    console.error("Error generating image:", err.message);
    if (err.name === "AbortError") {
      res.status(504).json({ error: "Image generation timed out — try again" });
    } else {
      res.status(500).json({ error: "Failed to generate image: " + err.message });
    }
  }
});

app.get("/api/posts", (req, res) => {
  try {
    res.json({ posts: db.getAllPosts() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/posts/:id", (req, res) => {
  try {
    db.updatePost(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/posts/:id", (req, res) => {
  try {
    db.deletePost(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── Improve post ─────────────────────────────────────────────────────────────

app.post("/api/posts/:id/improve", async (req, res) => {
  const postId = Number(req.params.id);
  const { instruction } = req.body;

  if (!instruction) return res.status(400).json({ error: "instruction is required" });

  const posts = db.getAllPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: "You are a social media manager improving Instagram posts. Respond with valid JSON only — no explanation, no markdown, no backticks.",
        },
        {
          role: "user",
          content: `Here is an existing Instagram post:

Caption: ${post.caption}
Hashtags: ${post.hashtags}
Tone: ${post.tone}

The user wants you to improve it with this instruction: "${instruction}"

Rewrite the post following the instruction. Keep what works, change what's asked.

Respond ONLY with this JSON format:
{
  "caption": "improved caption here",
  "hashtags": "#tag1 #tag2 #tag3 #tag4"
}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    const improved = JSON.parse(raw);

    db.updatePost(postId, {
      caption: improved.caption,
      hashtags: improved.hashtags,
    });

    res.json({ caption: improved.caption, hashtags: improved.hashtags });
  } catch (err) {
    console.error("Improve error:", err.message);
    res.status(500).json({ error: "Failed to improve post" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", posts: db.getPostCount() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});