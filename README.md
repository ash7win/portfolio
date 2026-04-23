# Portfolio

A collection of AI-powered applications built with modern language models, computer vision, and generative media tools.

---

## Projects

### 1. Social Media Dashboard
**Stack:** React · Node.js · Python · Groq (LLaMA 3.3) · Cloudflare Workers AI · moviepy

An end-to-end AI content creation and management dashboard for Instagram. Designed to take a marketer from brief to publish-ready content in minutes.

**Features:**
- Generate 3 AI-written Instagram captions from a campaign brief and tone description
- Auto-generate matching images using Cloudflare Workers AI (FLUX.1-schnell)
- Inline edit captions and hashtags directly on the post card
- AI-powered post improvement — describe what to change, Groq rewrites it
- Generate short-form video (MP4) from a brief — AI writes 4 scenes, generates images for each, stitches into a Reels-ready video
- Regenerate videos with directional feedback, with option to keep or replace the caption
- Download images and videos directly from the dashboard
- Posts persist across sessions via SQLite database
- Videos persist via localStorage

**How to run:**
```bash
# Terminal 1 — Frontend
cd social-dashboard
npm install
npm start

# Terminal 2 — Backend
cd social-backend
npm install
node server.js

# Terminal 3 — Video server (optional, only needed for video generation)
cd social-video
pip install -r requirements.txt
python video_server.py
```

**Environment variables required:**

`social-backend/.env`
```
GROQ_API_KEY=your_groq_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_token
```

`social-video/.env`
```
GROQ_API_KEY=your_groq_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_token
```

All AI services used are free tier — no paid subscriptions required.

---

### 2. Football Player Detection — Computer Vision
**Stack:** Python · YOLOv10 · PyTorch · OpenCV · Ultralytics

Real-time football player detection system using a custom-trained YOLOv10 model. The model is fine-tuned on football match footage to accurately identify and localise players on the pitch, drawing bounding boxes around each detected player in real time.

**Features:**
- Real-time player detection using a fine-tuned YOLOv10 model
- Bounding box localisation for each detected player across frames
- High accuracy in crowded scenes typical of match footage
- Processes both video files and live camera input
- Lightweight inference suitable for real-time applications

**How to run:**
```bash
cd football-cv
pip install -r requirements.txt
python detect.py
```

**Notes:**
- Model weights file: `football_player_detection_YOLOv10.pt` — place in the project root before running
- GPU recommended for real-time performance but CPU inference is supported
- Built with the Ultralytics YOLOv10 framework

---

## About

These projects were built to explore practical applications of AI in media, content creation, and sports analytics. They use a mix of large language models, generative image/video models, and computer vision techniques.

Feel free to reach out with any questions.