 import { useEffect, useState, useRef } from "react"
import axios from "axios"

/* ── Waveform visualiser ── */
function WaveVisualiser({ active, color = "#6ee7b7" }) {
  const heights = [10, 18, 26, 34, 26, 18, 10, 22, 30, 22]

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color,
        height: 36,
      }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            height: active ? h : 4,
            borderRadius: 4,
            background: "currentColor",
            transition: "height 0.3s ease",
            animation: active
              ? `wavePulse 1.1s ease-in-out ${(i * 0.09).toFixed(2)}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </span>
  )
}

/* ── Stat card ── */
function StatCard({ label, value, icon, accent }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: accent + "22",
          border: `1px solid ${accent}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f1f5f9",
            fontFamily: "'Syne', sans-serif",
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

/* ── History item ── */
function HistoryItem({ item, index, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const safeText = item?.text || ""
  const preview = safeText.length > 120 ? safeText.slice(0, 120) + "…" : safeText

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "18px 22px",
        transition: "border-color 0.2s, background 0.2s",
        animation: `fadeUp 0.4s ease ${index * 0.06}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(110,231,183,0.35)"
        e.currentTarget.style.background = "rgba(110,231,183,0.04)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"
        e.currentTarget.style.background = "rgba(255,255,255,0.025)"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          onClick={() => setExpanded((e) => !e)}
          style={{ minWidth: 0, flex: 1, cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                background: "rgba(110,231,183,0.12)",
                color: "#6ee7b7",
                border: "1px solid rgba(110,231,183,0.2)",
                borderRadius: 6,
                padding: "2px 8px",
                letterSpacing: "0.08em",
              }}
            >
              #{String(index + 1).padStart(2, "0")}
            </span>

            <span
              style={{
                fontSize: 12,
                color: "#475569",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {new Date(item.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              marginBottom: 4,
              fontFamily: "'DM Mono', monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            📁 {item.fileName}
          </p>

          <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>
            {expanded ? safeText : preview}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              color: "#475569",
              fontSize: 12,
              flexShrink: 0,
              marginTop: 2,
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "none",
            }}
          >
            ▾
          </span>

          <button
            onClick={() => onDelete(item._id)}
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [recording, setRecording] = useState(false)

  const inputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/history")
      setHistory(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("History fetch failed:", error)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const uploadAudio = async () => {
    if (!file) {
      alert("Please select an audio file first")
      return
    }

    const formData = new FormData()
    formData.append("audio", file)

    try {
      setLoading(true)
      setText("Processing transcription...")

      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (res.data && typeof res.data.text === "string" && res.data.text.trim() !== "") {
        setText(res.data.text)
      } else {
        setText("No transcription text returned from backend")
      }

      await fetchHistory()
    } catch (error) {
      console.error("Upload failed:", error)
      setText("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const formData = new FormData()
        formData.append("audio", blob, "recording.webm")

        try {
          setLoading(true)
          setText("Processing recording...")

          const res = await axios.post("http://localhost:5000/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          if (res.data && typeof res.data.text === "string" && res.data.text.trim() !== "") {
            setText(res.data.text)
          } else {
            setText("No transcription text returned from backend")
          }

          await fetchHistory()
        } catch (error) {
          console.error("Recording upload failed:", error)
          setText("Recording failed")
        } finally {
          setLoading(false)
        }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error("Microphone access failed:", error)
      alert("Microphone permission denied or unavailable")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    setRecording(false)
  }

  const deleteHistoryItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/history/${id}`)
      await fetchHistory()
    } catch (error) {
      console.error("Delete failed:", error)
      alert("Delete failed")
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const wordCount =
    text &&
    text !== "Processing transcription..." &&
    text !== "Processing recording..." &&
    text !== "No transcription text returned from backend" &&
    text !== "Upload failed" &&
    text !== "Recording failed"
      ? text.trim().split(/\s+/).filter(Boolean).length
      : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #060810;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        #root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 70% 50% at 15% 10%, rgba(110,231,183,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 80%, rgba(56,189,248,0.05) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%);
        }

        @keyframes wavePulse {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmerMove 1.8s ease infinite;
        }

        @keyframes shimmerMove {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(110,231,183,0.25); }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 64px" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
            animation: "fadeUp 0.5s ease both",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg, #6ee7b7, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(110,231,183,0.3)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: "-0.02em",
                  color: "#f8fafc",
                }}
              >
                VoiceScript
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Speech · to · Text
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#6ee7b7",
                boxShadow: "0 0 8px #6ee7b7",
                display: "inline-block",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#6ee7b7",
                  animation: "pulse-ring 1.8s ease infinite",
                }}
              />
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#64748b",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              System Online
            </span>
          </div>
        </header>

        <section
          style={{
            borderRadius: 28,
            padding: "52px 56px",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(110,231,183,0.15)",
            background:
              "linear-gradient(135deg, rgba(110,231,183,0.08) 0%, rgba(56,189,248,0.06) 50%, rgba(99,102,241,0.08) 100%)",
            animation: "fadeUp 0.5s ease 0.05s both",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(110,231,183,0.12), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: 80,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(110,231,183,0.1)",
                border: "1px solid rgba(110,231,183,0.2)",
                borderRadius: 100,
                padding: "4px 14px",
                marginBottom: 20,
              }}
            >
              <WaveVisualiser active={loading || recording} />
              <span
                style={{
                  fontSize: 11,
                  color: "#6ee7b7",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.1em",
                }}
              >
                {recording
                  ? "RECORDING VOICE"
                  : loading
                  ? "PROCESSING AUDIO"
                  : "READY TO TRANSCRIBE"}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "#f8fafc",
                marginBottom: 16,
              }}
            >
              Turn Speech Into
              <br />
              <span
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  backgroundImage: "linear-gradient(90deg, #6ee7b7, #38bdf8)",
                }}
              >
                Structured Text
              </span>
            </h1>

            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 460, lineHeight: 1.7 }}>
              Upload your audio file, record your voice, receive AI-generated transcription instantly, and browse your full history below.
            </p>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 28,
            animation: "fadeUp 0.5s ease 0.1s both",
          }}
        >
          <StatCard label="Records Saved" value={history.length} icon="🗂️" accent="#6ee7b7" />
          <StatCard label="Word Count" value={wordCount || "—"} icon="📝" accent="#38bdf8" />
          <StatCard label="Selected File" value={file ? "Ready" : recording ? "Mic" : "None"} icon="🎵" accent="#a78bfa" />
          <StatCard label="Engine" value="Deepgram" icon="⚙️" accent="#f59e0b" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <section
            style={{
              background: "rgba(255,255,255,0.025)",
              border: dragOver
                ? "1.5px dashed rgba(110,231,183,0.6)"
                : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 24,
              padding: "32px 28px",
              animation: "fadeUp 0.5s ease 0.15s both",
              transition: "border 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(110,231,183,0.1)",
                  border: "1px solid rgba(110,231,183,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🎤
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: "#f1f5f9",
                  }}
                >
                  Upload Audio
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>mp3, wav, m4a, webm, ogg</div>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: "1.5px dashed",
                borderColor: dragOver ? "rgba(110,231,183,0.6)" : "rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(110,231,183,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? "🎵" : "📂"}</div>

              {file ? (
                <>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      color: "#6ee7b7",
                      marginBottom: 4,
                      wordBreak: "break-all",
                      padding: "0 8px",
                    }}
                  >
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 4 }}>
                    Drop file here or <span style={{ color: "#6ee7b7" }}>browse</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    Supports all major audio formats
                  </div>
                </>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <button
              onClick={uploadAudio}
              disabled={loading || recording}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                border: "none",
                background: loading || recording
                  ? "rgba(110,231,183,0.15)"
                  : "linear-gradient(135deg, #6ee7b7, #38bdf8)",
                color: loading || recording ? "#6ee7b7" : "#0f172a",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading || recording ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "all 0.2s",
                boxShadow: loading || recording ? "none" : "0 0 28px rgba(110,231,183,0.25)",
                marginBottom: 12,
              }}
            >
              {loading ? "Processing…" : "Transcribe Audio"}
            </button>

            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                border: "none",
                background: recording
                  ? "linear-gradient(135deg, #ef4444, #f97316)"
                  : "rgba(255,255,255,0.06)",
                color: "#f8fafc",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "all 0.2s",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: recording ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.08)",
              }}
            >
              {recording ? "Stop Recording" : "Start Voice Recording"}
            </button>
          </section>

          <section
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 24,
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              animation: "fadeUp 0.5s ease 0.2s both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                📄
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: "#f1f5f9",
                  }}
                >
                  Latest Transcription
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>Most recent processed result</div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14,
                padding: "20px 22px",
                minHeight: 160,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "linear-gradient(90deg, #6ee7b7, #38bdf8, transparent)",
                }}
              />

              {loading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    paddingTop: 4,
                  }}
                >
                  {[90, 75, 85, 60].map((w, i) => (
                    <div key={i} className="shimmer" style={{ height: 12, borderRadius: 6, width: `${w}%` }} />
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 14,
                    color: text ? "#cbd5e1" : "#334155",
                    lineHeight: 1.75,
                    fontStyle: text ? "normal" : "italic",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {text || "No transcription yet"}
                </p>
              )}
            </div>

            {text &&
              text !== "Upload failed" &&
              text !== "Recording failed" &&
              text !== "Processing transcription..." &&
              text !== "Processing recording..." &&
              text !== "No transcription text returned from backend" && (
                <button
                  onClick={() => navigator.clipboard.writeText(text)}
                  style={{
                    marginTop: 14,
                    padding: "10px 0",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                >
                  Copy to clipboard
                </button>
              )}
          </section>
        </div>

        <section
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            padding: "32px 28px",
            animation: "fadeUp 0.5s ease 0.25s both",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🗃️
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: "#f1f5f9",
                  }}
                >
                  Transcription History
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>Click any entry to expand</div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 100,
                padding: "4px 14px",
                fontSize: 12,
                color: "#a78bfa",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {history.length} record{history.length !== 1 ? "s" : ""}
            </div>
          </div>

          {history.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                border: "1.5px dashed rgba(255,255,255,0.06)",
                borderRadius: 18,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>🎙️</div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: "#334155",
                  marginBottom: 6,
                }}
              >
                No records yet
              </div>
              <div style={{ fontSize: 13, color: "#1e293b" }}>
                Upload your first audio file to get started
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((item, i) => (
                <HistoryItem
                  key={item._id}
                  item={item}
                  index={i}
                  onDelete={deleteHistoryItem}
                />
              ))}
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#1e293b",
              letterSpacing: "0.15em",
            }}
          >
            VOICESCRIPT · MERN STACK · SPEECH-TO-TEXT ENGINE
          </div>
        </footer>
      </div>
    </>
  )
}