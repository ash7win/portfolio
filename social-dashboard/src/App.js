import { useState, useEffect } from "react";

const BRAND = { name: "Luminary Co.", handle: "@luminaryco", avatar: "LC" };

const TONE_COLORS = [
  { accent: "#a78bfa", label: "#c4b5fd" },
  { accent: "#34d399", label: "#6ee7b7" },
  { accent: "#fb923c", label: "#fdba74" },
  { accent: "#f472b6", label: "#f9a8d4" },
  { accent: "#60a5fa", label: "#93c5fd" },
  { accent: "#facc15", label: "#fde68a" },
];

function getToneColor(tone, index) {
  if (index !== undefined) return TONE_COLORS[index % TONE_COLORS.length];
  if (!tone) return TONE_COLORS[0];
  return TONE_COLORS[Math.abs(tone.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % TONE_COLORS.length];
}

function ToneBadge({ tone, index }) {
  const c = getToneColor(tone, index);
  return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.label, background: c.accent + "22", border: `1px solid ${c.accent}44`, borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap" }}>
      {tone || "custom"}
    </span>
  );
}

function ImproveModal({ post, onClose, onDone }) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImprove = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/posts/${post.id}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onDone(post.id, data.caption, data.hashtags);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#141414", border: "1.5px solid #242424", borderRadius: 14, padding: 28, width: 480, maxWidth: "90vw" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", margin: "0 0 6px", fontFamily: "'Georgia', serif" }}>Improve this post</h3>
        <p style={{ fontSize: 12, color: "#555", margin: "0 0 16px" }}>Current caption:</p>
        <p style={{ fontSize: 13, color: "#888", fontFamily: "'Georgia', serif", lineHeight: 1.6, margin: "0 0 20px", padding: "10px 14px", background: "#0d0d0d", borderRadius: 8, border: "1px solid #1e1e1e" }}>{post.caption}</p>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>What to change</label>
        <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={`"make it shorter", "add more urgency", "make it funnier"`} rows={3} autoFocus style={{ width: "100%", background: "#0d0d0d", border: "1.5px solid #242424", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", lineHeight: 1.6, resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 16 }} />
        {error && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 12px" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontSize: 12, color: "#555", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleImprove} disabled={!instruction.trim() || loading} style={{ fontSize: 12, fontWeight: 600, color: instruction.trim() && !loading ? "#0d0d0d" : "#333", background: instruction.trim() && !loading ? "#f0f0f0" : "#1a1a1a", border: "none", borderRadius: 6, padding: "7px 16px", cursor: instruction.trim() && !loading ? "pointer" : "not-allowed" }}>
            {loading ? "Improving…" : "Improve →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, index, selected, onSelect, onDelete, onGenerateImage, onImprove, onEdit }) {
  const c = getToneColor(post.tone, index);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editingHashtags, setEditingHashtags] = useState(false);
  const [captionVal, setCaptionVal] = useState(post.caption);
  const [hashtagsVal, setHashtagsVal] = useState(post.hashtags);

  useEffect(() => { if (!editingCaption) setCaptionVal(post.caption); }, [post.caption]);
  useEffect(() => { if (!editingHashtags) setHashtagsVal(post.hashtags); }, [post.hashtags]);

  const saveCaption = () => { setEditingCaption(false); if (captionVal.trim() !== post.caption) onEdit(post.id, { caption: captionVal.trim() }); };
  const saveHashtags = () => { setEditingHashtags(false); if (hashtagsVal.trim() !== post.hashtags) onEdit(post.id, { hashtags: hashtagsVal.trim() }); };

  return (
    <div onClick={() => !editingCaption && !editingHashtags && onSelect(post.id)} style={{ background: selected ? "#1c1c1c" : "#141414", border: selected ? `1.5px solid ${c.accent}` : "1.5px solid #242424", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s", transform: selected ? "translateY(-2px)" : "none", position: "relative" }}>
      {selected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c.accent}00, ${c.accent}, ${c.accent}00)`, zIndex: 1 }} />}
      <div style={{ width: "100%", aspectRatio: "1", background: "#0d0d0d", position: "relative", overflow: "hidden" }}>
        {post.image === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${c.accent}33`, borderTop: `2px solid ${c.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 11, color: "#444" }}>Generating image…</span>
          </div>
        )}
        {post.image && post.image !== "loading" && <img src={post.image} alt="generated" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
        {!post.image && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: c.accent + "15", border: `1px solid ${c.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onGenerateImage(post.id, post.caption); }} style={{ fontSize: 11, fontWeight: 600, color: c.label, background: c.accent + "18", border: `1px solid ${c.accent}44`, borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Generate image</button>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <ToneBadge tone={post.tone} index={index} />
          <span style={{ fontSize: 10, color: "#444", fontWeight: 500 }}>Post</span>
        </div>
        {editingCaption
          ? <textarea autoFocus value={captionVal} onChange={(e) => setCaptionVal(e.target.value)} onBlur={saveCaption} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") { setCaptionVal(post.caption); setEditingCaption(false); } }} rows={4} style={{ width: "100%", background: "#0d0d0d", border: `1px solid ${c.accent}44`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "#e2e2e2", fontFamily: "'Georgia', serif", lineHeight: 1.65, resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
          : <p onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setEditingCaption(true); }} style={{ fontSize: 13, lineHeight: 1.65, color: "#e2e2e2", margin: "0 0 8px", fontFamily: "'Georgia', serif", cursor: "text", padding: "4px 6px", borderRadius: 4, border: "1px solid #2a2a2a" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#555"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}>{captionVal}</p>
        }
        {editingHashtags
          ? <input autoFocus value={hashtagsVal} onChange={(e) => setHashtagsVal(e.target.value)} onBlur={saveHashtags} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Enter") saveHashtags(); if (e.key === "Escape") { setHashtagsVal(post.hashtags); setEditingHashtags(false); } }} style={{ width: "100%", background: "#0d0d0d", border: `1px solid ${c.accent}44`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#888", fontFamily: "monospace", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
          : <p onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setEditingHashtags(true); }} style={{ fontSize: 11, color: "#555", margin: "0 0 12px", fontFamily: "monospace", cursor: "text", padding: "4px 6px", borderRadius: 4, border: "1px solid #2a2a2a" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#555"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}>{hashtagsVal}</p>
        }
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={(e) => { e.stopPropagation(); if (!post.image || post.image === "loading") return; const a = document.createElement("a"); a.href = post.image; a.download = `post-${post.id}.jpg`; a.click(); }} disabled={!post.image || post.image === "loading"} title={!post.image || post.image === "loading" ? "Generate an image first" : "Download image"} style={{ fontSize: 11, fontWeight: 600, color: post.image && post.image !== "loading" ? c.label : "#333", background: post.image && post.image !== "loading" ? c.accent + "18" : "transparent", border: `1px solid ${post.image && post.image !== "loading" ? c.accent + "44" : "#222"}`, borderRadius: 6, padding: "5px 12px", cursor: post.image && post.image !== "loading" ? "pointer" : "not-allowed" }}>Download</button>
          <button onClick={(e) => { e.stopPropagation(); onImprove(post); }} style={{ fontSize: 11, fontWeight: 600, color: c.label, background: c.accent + "18", border: `1px solid ${c.accent}44`, borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Improve</button>
          {post.image && post.image !== "loading" && <button onClick={(e) => { e.stopPropagation(); onGenerateImage(post.id, post.caption); }} style={{ fontSize: 11, fontWeight: 500, color: "#555", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>New image</button>}
          <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} style={{ fontSize: 11, fontWeight: 500, color: "#f87171", background: "transparent", border: "1px solid #3a1a1a", borderRadius: 6, padding: "5px 12px", cursor: "pointer", marginLeft: "auto" }}>Delete</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function VideoCard({ video, index, onDelete, onImprove, onEdit }) {
  const videoUrl = `http://localhost:3002/api/video/download/${video.filename}`;
  const [editingCaption, setEditingCaption] = useState(false);
  const [editingHashtags, setEditingHashtags] = useState(false);
  const [captionVal, setCaptionVal] = useState(video.caption || "");
  const [hashtagsVal, setHashtagsVal] = useState(video.hashtags || "");

  useEffect(() => { if (!editingCaption) setCaptionVal(video.caption || ""); }, [video.caption]);
  useEffect(() => { if (!editingHashtags) setHashtagsVal(video.hashtags || ""); }, [video.hashtags]);

  const saveCaption = () => { setEditingCaption(false); if (captionVal.trim() !== video.caption) onEdit(video.id, { caption: captionVal.trim() }); };
  const saveHashtags = () => { setEditingHashtags(false); if (hashtagsVal.trim() !== video.hashtags) onEdit(video.id, { hashtags: hashtagsVal.trim() }); };

  return (
    <div style={{ background: "#141414", border: "1.5px solid #242424", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      <div style={{ width: "100%", aspectRatio: "1", background: "#0d0d0d", position: "relative" }}>
        <video src={videoUrl} controls loop style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onClick={(e) => e.stopPropagation()} />
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c4b5fd", background: "#a78bfa22", border: "1px solid #a78bfa44", borderRadius: 4, padding: "2px 8px" }}>Video</span>
          <span style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>✓ Ready</span>
        </div>

        {editingCaption ? (
          <textarea autoFocus value={captionVal} onChange={(e) => setCaptionVal(e.target.value)} onBlur={saveCaption} onKeyDown={(e) => { if (e.key === "Escape") { setCaptionVal(video.caption || ""); setEditingCaption(false); } }} rows={4} style={{ width: "100%", background: "#0d0d0d", border: "1px solid #a78bfa44", borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "#e2e2e2", fontFamily: "'Georgia', serif", lineHeight: 1.65, resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
        ) : (
          <p onMouseDown={(e) => { e.preventDefault(); setEditingCaption(true); }} style={{ fontSize: 13, color: captionVal ? "#e2e2e2" : "#444", fontStyle: captionVal ? "normal" : "italic", margin: "0 0 8px", fontFamily: "'Georgia', serif", lineHeight: 1.65, cursor: "text", padding: "4px 6px", borderRadius: 4, border: "1px solid #2a2a2a" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#555"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}>
            {captionVal || video.brief || "Click to add a caption"}
          </p>
        )}

        {editingHashtags ? (
          <input autoFocus value={hashtagsVal} onChange={(e) => setHashtagsVal(e.target.value)} onBlur={saveHashtags} onKeyDown={(e) => { if (e.key === "Enter") saveHashtags(); if (e.key === "Escape") { setHashtagsVal(video.hashtags || ""); setEditingHashtags(false); } }} style={{ width: "100%", background: "#0d0d0d", border: "1px solid #a78bfa44", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#888", fontFamily: "monospace", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
        ) : (
          <p onMouseDown={(e) => { e.preventDefault(); setEditingHashtags(true); }} style={{ fontSize: 11, color: hashtagsVal ? "#444" : "#333", fontStyle: hashtagsVal ? "normal" : "italic", margin: "0 0 12px", fontFamily: "monospace", cursor: "text", padding: "4px 6px", borderRadius: 4, border: "1px solid #2a2a2a" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#555"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}>
            {hashtagsVal || "Click to add hashtags"}
          </p>
        )}

        <div style={{ marginBottom: 14 }}>
          {video.scenes && video.scenes.map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: "#333", marginBottom: 3 }}>Scene {i+1}: {s}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={videoUrl} download style={{ fontSize: 11, fontWeight: 600, color: "#0d0d0d", background: "#a78bfa", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", textDecoration: "none" }}>Download MP4</a>
          <button onClick={() => onImprove(video)} style={{ fontSize: 11, fontWeight: 600, color: "#c4b5fd", background: "#a78bfa18", border: "1px solid #a78bfa44", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Improve</button>
          <button onClick={() => onDelete(video.id)} style={{ fontSize: 11, fontWeight: 500, color: "#f87171", background: "transparent", border: "1px solid #3a1a1a", borderRadius: 6, padding: "5px 12px", cursor: "pointer", marginLeft: "auto" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [{ id: "generate", label: "Generate" }, { id: "drafts", label: "Drafts" }];
  return (
    <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, paddingTop: 8 }}>
      <div style={{ marginBottom: 28, paddingLeft: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{BRAND.avatar}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e2e2" }}>{BRAND.name}</div>
        <div style={{ fontSize: 11, color: "#555" }}>{BRAND.handle}</div>
      </div>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", textAlign: "left", background: activeTab === tab.id ? "#1e1e1e" : "transparent", border: "none", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? "#e2e2e2" : "#555", cursor: "pointer", transition: "all 0.1s" }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function GeneratePanel({ onGeneratePosts, onGenerateVideo, loading, error }) {
  const [mode, setMode] = useState("post");
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [videoTone, setVideoTone] = useState("");

  const canSubmitPost = brief.trim() && tone.trim() && !loading;
  const canSubmitVideo = brief.trim() && !loading;

  const toggleStyle = (active) => ({
    fontSize: 13, fontWeight: 600, padding: "7px 20px", borderRadius: 6, border: "none", cursor: "pointer", transition: "all 0.15s",
    background: active ? "#f0f0f0" : "transparent",
    color: active ? "#0d0d0d" : "#555",
  });

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", margin: "0 0 6px", fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>Generate content</h2>
      <p style={{ fontSize: 13, color: "#555", margin: "0 0 24px" }}>Choose what to create — AI-written posts with images, or a short video for Reels.</p>

      <div style={{ display: "inline-flex", background: "#141414", border: "1.5px solid #242424", borderRadius: 8, padding: 4, marginBottom: 28, gap: 2 }}>
        <button style={toggleStyle(mode === "post")} onClick={() => setMode("post")}>Post</button>
        <button style={toggleStyle(mode === "video")} onClick={() => setMode("video")}>Video</button>
      </div>

      {mode === "post" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Campaign brief</label>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="e.g. Announce our summer sale — 30% off everything. Should feel exclusive, not discount-y." rows={4} style={{ width: "100%", background: "#141414", border: "1.5px solid #242424", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tone</label>
            <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. witty, luxurious, warm, bold, Gen Z casual…" style={{ width: "100%", background: "#141414", border: "1.5px solid #242424", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            <p style={{ fontSize: 11, color: "#444", margin: "6px 0 0" }}>Write anything — "sarcastic but friendly", "like a luxury brand"</p>
          </div>
          {error && <div style={{ fontSize: 13, color: "#f87171", background: "#1f0e0e", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>{error}</div>}
          <button onClick={() => onGeneratePosts(brief, tone)} disabled={!canSubmitPost} style={{ fontSize: 13, fontWeight: 700, color: canSubmitPost ? "#0d0d0d" : "#333", background: canSubmitPost ? "#f0f0f0" : "#1a1a1a", border: "none", borderRadius: 8, padding: "11px 24px", cursor: canSubmitPost ? "pointer" : "not-allowed" }}>
            {loading ? "Writing…" : "Generate 3 posts →"}
          </button>
        </>
      )}

      {mode === "video" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Campaign brief</label>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="e.g. Summer collection launch — warm, golden hour, minimal aesthetic" rows={3} style={{ width: "100%", background: "#141414", border: "1.5px solid #242424", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Caption overlay <span style={{ color: "#333", fontWeight: 400 }}>(optional)</span></label>
            <input value={videoCaption} onChange={(e) => setVideoCaption(e.target.value)} placeholder="Text that appears on the final frame" style={{ width: "100%", background: "#141414", border: "1.5px solid #242424", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Visual tone <span style={{ color: "#333", fontWeight: 400 }}>(optional)</span></label>
            <input value={videoTone} onChange={(e) => setVideoTone(e.target.value)} placeholder="e.g. cinematic, moody, bright and airy, dark and dramatic" style={{ width: "100%", background: "#141414", border: "1.5px solid #242424", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
          </div>
          {error && <div style={{ fontSize: 13, color: "#f87171", background: "#1f0e0e", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>{error}</div>}
          {loading && (
            <div style={{ background: "#141414", border: "1.5px solid #242424", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, border: "2px solid #a78bfa33", borderTop: "2px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#888" }}>Generating scenes and images — 1–3 minutes…</span>
              </div>
              <p style={{ fontSize: 11, color: "#444", margin: 0 }}>Groq writes scenes → generates 4 images → moviepy stitches the video</p>
            </div>
          )}
          <button onClick={() => onGenerateVideo(brief, videoCaption, videoTone)} disabled={!canSubmitVideo} style={{ fontSize: 13, fontWeight: 700, color: canSubmitVideo ? "#0d0d0d" : "#333", background: canSubmitVideo ? "#f0f0f0" : "#1a1a1a", border: "none", borderRadius: 8, padding: "11px 24px", cursor: canSubmitVideo ? "pointer" : "not-allowed" }}>
            {loading ? "Generating…" : "Generate video →"}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}

function VideoRegenerateModal({ video, onClose, onDone }) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegenerate = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const improvedBrief = `${video.brief}. Additional direction: ${instruction}`;
      const res = await fetch("http://localhost:3002/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: improvedBrief, caption: "", tone: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      // Ask user what to do with the caption
      const choice = window.confirm(
        `AI generated this caption for your new video:\n\n"${data.caption}"\n\nClick OK to use this new caption, or Cancel to keep your previous caption.`
      );
      if (!choice) {
        // Restore previous caption and hashtags
        data.caption = video.caption || "";
        data.hashtags = video.hashtags || "";
      }

      onDone(video.id, data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#141414", border: "1.5px solid #242424", borderRadius: 14, padding: 28, width: 480, maxWidth: "90vw" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", margin: "0 0 6px", fontFamily: "'Georgia', serif" }}>Regenerate video</h3>
        <p style={{ fontSize: 12, color: "#555", margin: "0 0 6px" }}>Original brief:</p>
        <p style={{ fontSize: 12, color: "#666", fontFamily: "'Georgia', serif", margin: "0 0 20px", padding: "8px 12px", background: "#0d0d0d", borderRadius: 8, border: "1px solid #1e1e1e" }}>{video.brief}</p>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>What to change about the video</label>
        <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={`"make it more dramatic", "focus on close-up product shots", "darker moodier scenes", "add a sunrise setting"`} rows={3} autoFocus style={{ width: "100%", background: "#0d0d0d", border: "1.5px solid #242424", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#e2e2e2", fontFamily: "inherit", lineHeight: 1.6, resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 16 }} />
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: "2px solid #a78bfa33", borderTop: "2px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#555" }}>Regenerating video — 1–3 minutes…</span>
          </div>
        )}
        {error && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 12px" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontSize: 12, color: "#555", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleRegenerate} disabled={!instruction.trim() || loading} style={{ fontSize: 12, fontWeight: 600, color: instruction.trim() && !loading ? "#0d0d0d" : "#333", background: instruction.trim() && !loading ? "#f0f0f0" : "#1a1a1a", border: "none", borderRadius: 6, padding: "7px 16px", cursor: instruction.trim() && !loading ? "pointer" : "not-allowed" }}>
            {loading ? "Generating…" : "Regenerate video →"}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function DraftsPanel({ posts, videos, onDeletePost, onDeleteVideo, onGenerateImage, onImprove, onImproveVideo, onEdit, onEditVideo }) {
  const [selected, setSelected] = useState(null);
  const [improvingPost, setImprovingPost] = useState(null);
  const [improvingVideo, setImprovingVideo] = useState(null);
  const total = posts.length + videos.length;

  if (total === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", margin: "0 0 6px", fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>Drafts</h2>
        <p style={{ fontSize: 13, color: "#555", margin: 0 }}>Nothing yet — go to Generate to create posts or videos.</p>
      </div>
    );
  }

  const allItems = [
    ...posts.map((p) => ({ ...p, _type: "post", _sortKey: new Date(p.created_at).getTime() || Number(p.id) })),
    ...videos.map((v) => ({ ...v, _type: "video", _sortKey: new Date(v.created_at).getTime() || Number(v.id) })),
  ].sort((a, b) => b._sortKey - a._sortKey);

  return (
    <div>
      {improvingPost && (
        <ImproveModal post={improvingPost} onClose={() => setImprovingPost(null)} onDone={(id, caption, hashtags) => { onImprove(id, caption, hashtags); setImprovingPost(null); }} />
      )}
      {improvingVideo && (
        <VideoRegenerateModal video={improvingVideo} onClose={() => setImprovingVideo(null)} onDone={(id, data) => { onImproveVideo(id, data); setImprovingVideo(null); }} />
      )}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", margin: "0 0 4px", fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>Drafts</h2>
        <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{posts.length} posts · {videos.length} videos · {posts.length}/15 post slots used</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {allItems.map((item, i) =>
          item._type === "post"
            ? <PostCard key={`post-${item.id}`} post={item} index={i} selected={selected === item.id} onSelect={setSelected} onDelete={onDeletePost} onGenerateImage={onGenerateImage} onImprove={(p) => setImprovingPost(p)} onEdit={onEdit} />
            : <VideoCard key={`video-${item.id}`} video={item} index={i} onDelete={onDeleteVideo} onImprove={(v) => setImprovingVideo(v)} onEdit={onEditVideo} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("generate");
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("luminary_videos") || "[]"); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    try { localStorage.setItem("luminary_videos", JSON.stringify(videos)); } catch {}
  }, [videos]);

  useEffect(() => {
    fetch("http://localhost:3001/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {});
  }, []);

  const handleGeneratePosts = async (brief, tone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, tone }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Server error"); }
      const data = await res.json();
      setPosts((prev) => [...data.posts, ...prev].slice(0, 15));
      setActiveTab("drafts");
      showToast(`${data.posts.length} new drafts generated`);
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot reach the server. Make sure it is running on port 3001." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async (brief, caption, tone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3002/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, caption, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      const newVideo = { id: Date.now(), created_at: new Date().toISOString(), brief, filename: data.filename, scenes: data.scenes, caption: data.caption || "", hashtags: data.hashtags || "" };
      setVideos((prev) => [newVideo, ...prev]);
      setActiveTab("drafts");
      showToast("Video ready — check Drafts");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot reach the video server. Make sure it is running on port 3002." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    await fetch(`http://localhost:3001/api/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    showToast("Post deleted");
  };

  const handleDeleteVideo = (id) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    showToast("Video removed");
  };

  const handleGenerateImage = async (id, caption) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, image: "loading" } : p)));
    try {
      const res = await fetch("http://localhost:3001/api/image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, postId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, image: data.imageUrl } : p)));
      showToast("Image generated");
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, image: null } : p)));
      showToast("Image generation failed — try again");
    }
  };

  const handleImprove = (id, caption, hashtags) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, caption, hashtags } : p)));
    showToast("Post improved");
  };

  const handleImproveVideo = (id, data) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, filename: data.filename, scenes: data.scenes, caption: data.caption || "", hashtags: data.hashtags || "", created_at: new Date().toISOString() } : v)));
    showToast("Video regenerated");
  };

  const handleEdit = async (id, fields) => {
    await fetch(`http://localhost:3001/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
  };

  const handleEditVideo = (id, fields) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...fields } : v)));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e2e2e2", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ borderBottom: "1px solid #161616", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>Luminary Studio</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#444" }}>Instagram · Business</span>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>LC</div>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, padding: "32px 32px 32px 24px", gap: 40, maxWidth: 1100, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === "generate" && <GeneratePanel onGeneratePosts={handleGeneratePosts} onGenerateVideo={handleGenerateVideo} loading={loading} error={error} />}
          {activeTab === "drafts" && <DraftsPanel posts={posts} videos={videos} onDeletePost={handleDeletePost} onDeleteVideo={handleDeleteVideo} onGenerateImage={handleGenerateImage} onImprove={handleImprove} onImproveVideo={handleImproveVideo} onEdit={handleEdit} onEditVideo={handleEditVideo} />}
        </div>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 20px", fontSize: 13, color: "#e2e2e2", fontWeight: 500, zIndex: 100, pointerEvents: "none" }}>
          {toast}
        </div>
      )}
    </div>
  );
}