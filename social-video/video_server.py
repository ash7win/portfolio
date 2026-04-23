import os
import io
import json
import time
import base64
import requests
import textwrap
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
from moviepy import ImageClip, concatenate_videoclips
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def ask_groq(system, user, max_tokens=500):
    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.3-70b-versatile",
            "max_tokens": max_tokens,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]
        },
        timeout=30
    )
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"].strip()


def generate_image(prompt):
    res = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell",
        headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}", "Content-Type": "application/json"},
        json={"prompt": prompt + ", cinematic, high quality, photorealistic", "num_steps": 8},
        timeout=60
    )
    if not res.ok:
        raise Exception(f"Cloudflare returned {res.status_code}: {res.text}")
    data = res.json()
    img_bytes = base64.b64decode(data["result"]["image"])
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")


def add_caption(image, caption):
    img = image.copy().resize((1080, 1080))
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle([(0, 780), (1080, 1080)], fill=(0, 0, 0, 160))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()
    wrapped = textwrap.fill(caption, width=40)
    y = 820
    for line in wrapped.split("\n"):
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((1080 - w) // 2, y), line, fill="white", font=font)
        y += 50
    return img


def pil_to_numpy(image):
    import numpy as np
    return np.array(image)


@app.route("/api/video/generate", methods=["POST"])
def generate_video():
    data = request.json
    brief = data.get("brief", "")
    caption = data.get("caption", "")
    tone = data.get("tone", "cinematic")

    if not brief:
        return jsonify({"error": "brief is required"}), 400

    try:
        print("Generating scene descriptions...")
        scenes_raw = ask_groq(
            "You write image generation prompts for video scenes. Return only a JSON array of 4 strings. No explanation, no markdown, no backticks.",
            f"""Campaign brief: {brief}
Tone: {tone}

Write 4 short visual scene prompts (max 15 words each) that together tell a visual story for this campaign.
Each should describe a distinct photographic moment.

Return ONLY a JSON array like:
["scene one description", "scene two description", "scene three description", "scene four description"]"""
        )

        scenes = json.loads(scenes_raw)
        print(f"Scenes: {scenes}")

        # Generate Instagram caption alongside scenes
        print("Generating caption...")
        caption_raw = ask_groq(
            "You are a social media manager writing Instagram captions. Respond with valid JSON only — no explanation, no markdown, no backticks.",
            f"""Campaign brief: {brief}
Tone: {tone if tone else "engaging and professional"}

Write one Instagram caption with hashtags for this video campaign.

Respond ONLY with this JSON format:
{{"caption": "the caption text here", "hashtags": "#tag1 #tag2 #tag3 #tag4"}}"""
        )
        try:
            caption_data = json.loads(caption_raw)
            ig_caption = caption_data.get("caption", "")
            ig_hashtags = caption_data.get("hashtags", "")
        except:
            ig_caption = caption_raw
            ig_hashtags = ""

        frames = []
        for i, scene in enumerate(scenes):
            print(f"Generating image {i+1}/4: {scene}")
            img = generate_image(scene)
            if i == len(scenes) - 1 and caption:
                img = add_caption(img, caption)
            frames.append(img)

        print("Stitching video...")
        clips = [ImageClip(pil_to_numpy(frame), duration=2.5) for frame in frames]
        final = concatenate_videoclips(clips, method="compose")

        filename = f"video_{int(time.time())}.mp4"
        filepath = os.path.join(OUTPUT_DIR, filename)
        final.write_videofile(filepath, fps=24, codec="libx264", audio=False, logger=None)
        final.close()

        print(f"Video saved: {filepath}")
        return jsonify({"filename": filename, "scenes": scenes, "caption": ig_caption, "hashtags": ig_hashtags})

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return jsonify({"error": "Failed to parse scene descriptions"}), 500
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/video/improve", methods=["POST"])
def improve_video_caption():
    data = request.json
    caption = data.get("caption", "")
    hashtags = data.get("hashtags", "")
    brief = data.get("brief", "")
    instruction = data.get("instruction", "")

    if not instruction:
        return jsonify({"error": "instruction is required"}), 400

    try:
        result_raw = ask_groq(
            "You are a social media manager improving Instagram captions for videos. Respond with valid JSON only — no explanation, no markdown, no backticks.",
            f"""Here is an existing Instagram caption for a video:

Caption: {caption}
Hashtags: {hashtags}
Original brief: {brief}

The user wants to improve it with this instruction: "{instruction}"

Rewrite the caption following the instruction. Keep what works, change what's asked.

Respond ONLY with this JSON format:
{{"caption": "improved caption here", "hashtags": "#tag1 #tag2 #tag3 #tag4"}}"""
        )
        result = json.loads(result_raw)
        return jsonify({"caption": result.get("caption", ""), "hashtags": result.get("hashtags", "")})
    except Exception as e:
        print(f"Improve error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/video/download/<filename>", methods=["GET"])
def download_video(filename):
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
    return send_file(filepath, mimetype="video/mp4", as_attachment=True, download_name=filename)


@app.route("/api/video/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("Video server running on http://localhost:3002")
    app.run(port=3002, debug=False)