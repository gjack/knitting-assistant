import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#f8f5f0",
    color: "#2c2c2c",
  },
  sidebar: {
    width: 260,
    background: "#fff",
    borderRight: "1px solid #e0d8d0",
    display: "flex",
    flexDirection: "column",
    padding: "16px 0",
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: "0 16px 12px",
    borderBottom: "1px solid #e0d8d0",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#5a3e2b",
  },
  newBtn: {
    marginTop: 8,
    width: "100%",
    padding: "8px 0",
    background: "#5a3e2b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  patternList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  },
  patternItem: {
    padding: "10px 16px",
    cursor: "pointer",
    borderLeft: "3px solid transparent",
    transition: "background 0.15s",
  },
  patternItemActive: {
    borderLeft: "3px solid #5a3e2b",
    background: "#fdf6ee",
  },
  patternItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  patternItemDate: {
    fontSize: 11,
    color: "#888",
  },
  libraryErrorBox: {
    margin: "8px 16px",
    padding: "10px 12px",
    background: "#fdf0ee",
    border: "1px solid #e8b8ae",
    borderRadius: 6,
    fontSize: 12,
    color: "#a83c2e",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  retryBtn: {
    alignSelf: "flex-start",
    padding: "4px 10px",
    background: "#fff",
    color: "#a83c2e",
    border: "1px solid #a83c2e",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  uploadZone: {
    flex: 1,
    display: "flex",
    padding: 40,
    gap: 40,
    overflow: "hidden",
  },
  uploadZoneLeft: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadZoneRight: {
    width: 380,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    border: "1px solid #e0d8d0",
    borderRadius: 12,
    overflow: "hidden",
  },
  librarySourceRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  librarySourcePill: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 999,
    background: "#fdf6ee",
    border: "1px solid #e0d8d0",
    color: "#5a3e2b",
    cursor: "pointer",
  },
  dropArea: {
    width: "100%",
    maxWidth: 480,
    border: "2px dashed #c4a882",
    borderRadius: 12,
    padding: "48px 32px",
    textAlign: "center",
    background: "#fff",
    transition: "border-color 0.2s, background 0.2s",
  },
  dropAreaActive: {
    borderColor: "#5a3e2b",
    background: "#fdf6ee",
  },
  dropIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  dropText: {
    fontSize: 16,
    color: "#5a3e2b",
    fontWeight: 600,
    marginBottom: 8,
  },
  dropSubtext: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },
  fileInput: {
    display: "none",
  },
  chooseBtn: {
    padding: "10px 24px",
    background: "#5a3e2b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  statusBox: {
    marginTop: 20,
    padding: "12px 20px",
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e0d8d0",
    textAlign: "center",
    fontSize: 14,
    color: "#5a3e2b",
  },
  viewer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  viewerHeader: {
    padding: "16px 24px",
    background: "#fff",
    borderBottom: "1px solid #e0d8d0",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  viewerTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: "#5a3e2b",
    flex: 1,
  },
  deleteBtn: {
    padding: "6px 14px",
    background: "#fff",
    color: "#c0392b",
    border: "1px solid #c0392b",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  viewerBody: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  leftPanel: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    borderRight: "1px solid #e0d8d0",
  },
  rightPanel: {
    width: 360,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatPlaceholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    gap: 8,
  },
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "10px 16px",
    borderBottom: "1px solid #e0d8d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatHeaderTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#5a3e2b",
    margin: 0,
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#aaa",
    fontSize: 12,
    cursor: "pointer",
    padding: "2px 4px",
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  chatEmpty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#bbb",
    fontSize: 13,
    gap: 6,
    textAlign: "center",
  },
  bubble: {
    maxWidth: "88%",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 1.55,
    wordBreak: "break-word",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    background: "#5a3e2b",
    color: "#fff",
    borderBottomRightRadius: 2,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    background: "#fff",
    border: "1px solid #e0d8d0",
    color: "#2c2c2c",
    borderBottomLeftRadius: 2,
  },
  bubbleThinking: {
    alignSelf: "flex-start",
    background: "#f5f0eb",
    border: "1px solid #e0d8d0",
    color: "#aaa",
    fontStyle: "italic",
    fontSize: 13,
    padding: "8px 12px",
    borderRadius: 10,
  },
  chatInputRow: {
    display: "flex",
    gap: 6,
    padding: "10px 12px",
    borderTop: "1px solid #e0d8d0",
    background: "#fff",
  },
  chatInput: {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #d0c8c0",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
  },
  sendBtn: {
    padding: "8px 14px",
    background: "#5a3e2b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    alignSelf: "flex-end",
  },
  voiceControl: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "10px 12px",
    borderTop: "1px solid #e0d8d0",
    background: "#fdf6ee",
  },
  voiceControlHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  talkBtn: {
    width: 150,
    padding: "8px 14px",
    background: "#fff",
    color: "#5a3e2b",
    border: "1px solid #c4a882",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    userSelect: "none",
  },
  talkBtnActive: {
    background: "#5a3e2b",
    color: "#fff",
    border: "1px solid #5a3e2b",
  },
  voiceStateBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  voiceStateBadgeError: {
    color: "#c0392b",
  },
  stopSpeakingBtn: {
    marginLeft: "auto",
    padding: "4px 10px",
    background: "#fff",
    color: "#c0392b",
    border: "1px solid #c0392b",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },
  voiceErrorText: {
    fontSize: 12,
    color: "#c0392b",
  },
  voiceTranscriptRow: {
    display: "flex",
    gap: 6,
  },
  transcriptBox: {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #d0c8c0",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    background: "#fff",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#5a3e2b",
    margin: "20px 0 10px",
    borderBottom: "1px solid #e0d8d0",
    paddingBottom: 6,
  },
  preText: {
    fontSize: 13,
    lineHeight: 1.7,
    wordBreak: "break-word",
    background: "#fff",
    border: "1px solid #e0d8d0",
    borderRadius: 6,
    padding: "12px 16px",
    maxHeight: 400,
    overflowY: "auto",
  },
  chartCard: {
    background: "#fff",
    border: "1px solid #e0d8d0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  chartImg: {
    maxWidth: 200,
    maxHeight: 200,
    objectFit: "contain",
    borderRadius: 4,
    border: "1px solid #e0d8d0",
    flexShrink: 0,
  },
  chartDesc: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#444",
    flex: 1,
  },
  mdTableWrap: {
    overflowX: "auto",
    margin: "8px 0",
  },
  mdTable: {
    borderCollapse: "collapse",
    fontSize: 13,
  },
  mdTh: {
    background: "#fdf6ee",
    padding: "6px 10px",
    textAlign: "left",
    fontWeight: 600,
    border: "1px solid #e0d8d0",
    whiteSpace: "nowrap",
  },
  mdTd: {
    padding: "5px 10px",
    border: "1px solid #e0d8d0",
    whiteSpace: "nowrap",
  },
  abbrevTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  abbrevTh: {
    background: "#fdf6ee",
    padding: "6px 10px",
    textAlign: "left",
    fontWeight: 600,
    borderBottom: "2px solid #e0d8d0",
  },
  abbrevTd: {
    padding: "5px 10px",
    borderBottom: "1px solid #f0ece8",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "6px 16px",
    fontSize: 13,
    background: "#fff",
    border: "1px solid #e0d8d0",
    borderRadius: 6,
    padding: "12px 16px",
  },
  metaKey: {
    fontWeight: 600,
    color: "#5a3e2b",
    whiteSpace: "nowrap",
  },
};

function PatternUpload({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("Please select a PDF file.");
      return;
    }
    setUploading(true);
    setStatus("Processing pattern (OCR → metadata → charts)… this may take a minute.");
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/upload", { method: "POST", body: form });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const doc = await resp.json();
      setStatus("Done!");
      onUploaded(doc);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div style={styles.uploadZoneLeft}>
      <div
        style={{ ...styles.dropArea, ...(dragging ? styles.dropAreaActive : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div style={styles.dropIcon}>🧶</div>
        <div style={styles.dropText}>Drop a knitting pattern PDF here</div>
        <div style={styles.dropSubtext}>or click to choose a file</div>
        <button
          style={styles.chooseBtn}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Processing…" : "Choose PDF"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={styles.fileInput}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {status && <div style={styles.statusBox}>{status}</div>}
    </div>
  );
}

function GlossaryPanel({ abbreviations }) {
  if (!abbreviations || abbreviations.length === 0) return null;
  return (
    <>
      <div style={styles.sectionTitle}>Abbreviations &amp; Legend</div>
      <table style={styles.abbrevTable}>
        <thead>
          <tr>
            <th style={styles.abbrevTh}>Symbol</th>
            <th style={styles.abbrevTh}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {abbreviations.map((a, i) => (
            <tr key={i}>
              <td style={{ ...styles.abbrevTd, fontWeight: 600 }}>{a.symbol}</td>
              <td style={styles.abbrevTd}>{a.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MetaPanel({ metadata }) {
  if (!metadata) return null;
  const rows = [
    ["Sizes", Array.isArray(metadata.sizes) ? metadata.sizes.join(", ") : metadata.sizes],
    ["Gauge", metadata.gauge],
    ["Needles", Array.isArray(metadata.needles) ? metadata.needles.join(", ") : metadata.needles],
    ["Yarn", Array.isArray(metadata.yarn) ? metadata.yarn.join(", ") : metadata.yarn],
  ].filter(([, v]) => v);

  if (!rows.length) return null;
  return (
    <>
      <div style={styles.sectionTitle}>Pattern Info</div>
      <div style={styles.metaGrid}>
        {rows.map(([k, v]) => (
          <>
            <span style={styles.metaKey} key={`k-${k}`}>{k}</span>
            <span key={`v-${k}`}>{v}</span>
          </>
        ))}
      </div>
    </>
  );
}

function ChartsSection({ charts }) {
  if (!charts || charts.length === 0) return null;
  return (
    <>
      <div style={styles.sectionTitle}>Charts ({charts.length})</div>
      {charts.map((chart, i) => (
        <div key={chart.id || i} style={styles.chartCard}>
          {chart.base64 && (
            <img
              src={`data:image/jpeg;base64,${chart.base64}`}
              alt={`Chart ${i + 1}`}
              style={styles.chartImg}
            />
          )}
          <div style={styles.chartDesc}>
            <strong style={{ display: "block", marginBottom: 4 }}>Chart {i + 1}</strong>
            {chart.description}
          </div>
        </div>
      ))}
    </>
  );
}

function PatternMarkdown({ text, charts }) {
  const chartById = {};
  (charts || []).forEach((c) => {
    chartById[c.id] = c;
  });

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt }) => {
          const chart = chartById[src];
          if (!chart?.base64) return null;
          return (
            <img
              src={`data:image/jpeg;base64,${chart.base64}`}
              alt={alt || chart.description || src}
              title={chart.description}
              style={styles.chartImg}
            />
          );
        },
        table: ({ children }) => (
          <div style={styles.mdTableWrap}>
            <table style={styles.mdTable}>{children}</table>
          </div>
        ),
        th: ({ children }) => <th style={styles.mdTh}>{children}</th>,
        td: ({ children }) => <td style={styles.mdTd}>{children}</td>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

const VOICE_STATE_LABELS = {
  idle: "Idle",
  listening: "Listening…",
  transcribing: "Transcribing…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Error",
};

function useVoiceSession(patternId) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const patternIdRef = useRef(patternId);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const micRef = useRef(null); // { stream, audioContext, source, processor }
  const streamingRef = useRef(false);
  const voiceStateRef = useRef("idle"); // mirrors voiceState for use in stable callbacks

  const [voiceState, setVoiceState] = useState("idle");
  const [voiceError, setVoiceError] = useState(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [voiceMessage, setVoiceMessage] = useState(null);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const send = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  useEffect(() => {
    patternIdRef.current = patternId;
    if (patternId) send({ type: "set_pattern", pattern_id: patternId });
  }, [patternId]);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        clearTimeout(reconnectTimerRef.current);
        if (patternIdRef.current) {
          send({ type: "set_pattern", pattern_id: patternIdRef.current });
        }
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "state":
            setVoiceState(msg.state);
            if (msg.state === "listening") {
              setPartialTranscript("");
              setFinalTranscript("");
            }
            break;
          case "transcript_delta":
            setPartialTranscript((prev) => prev + msg.text);
            break;
          case "transcript":
            setFinalTranscript(msg.text);
            setPartialTranscript("");
            break;
          case "message":
            setVoiceMessage({ role: msg.role, content: msg.content });
            break;
          case "audio":
            playAudio(msg.data, msg.format);
            break;
          case "error":
            setVoiceError(msg.message);
            setTimeout(() => setVoiceError(null), 4000);
            break;
          default:
            break;
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        reconnectTimerRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // onclose follows and triggers reconnection
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      teardownMic();
      stopCurrentAudio(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function teardownMic() {
    const mic = micRef.current;
    if (!mic) return;
    mic.processor?.disconnect();
    mic.source?.disconnect();
    mic.audioContext?.close();
    mic.stream?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
  }

  const startListening = useCallback(async () => {
    if (voiceStateRef.current !== "idle" || wsRef.current?.readyState !== WebSocket.OPEN) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setVoiceError("Microphone access denied.");
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!streamingRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      wsRef.current.send(int16.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    micRef.current = { stream, audioContext, source, processor };
    streamingRef.current = true;

    send({ type: "start_listening" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopListening = useCallback(() => {
    if (!streamingRef.current) return;
    streamingRef.current = false;
    send({ type: "stop_listening" });
    teardownMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendText = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed || voiceStateRef.current !== "idle") return;
    setFinalTranscript("");
    send({ type: "send_message", text: trimmed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function playAudio(b64Data, format) {
    stopCurrentAudio(false);
    const binary = atob(b64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: `audio/${format}` });

    audioUrlRef.current = URL.createObjectURL(blob);
    const audio = new Audio(audioUrlRef.current);
    audioRef.current = audio;

    const cleanup = () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      audioRef.current = null;
    };
    audio.onended = () => {
      cleanup();
      send({ type: "playback_finished" });
    };
    audio.onerror = () => {
      cleanup();
      send({ type: "playback_finished" });
    };
    audio.play().catch(() => {
      cleanup();
      send({ type: "playback_finished" });
    });
  }

  function stopCurrentAudio(notifyServer = true) {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      audioRef.current = null;
    }
    if (notifyServer) send({ type: "stop_speaking" });
  }

  return {
    voiceState,
    voiceError,
    partialTranscript,
    finalTranscript,
    setFinalTranscript,
    voiceMessage,
    startListening,
    stopListening,
    sendText,
    stopSpeaking: () => stopCurrentAudio(true),
  };
}

function VoiceInputControl({ patternId, onMessage, disabled, onBusyChange }) {
  const voice = useVoiceSession(patternId);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (voice.voiceMessage && voice.voiceMessage !== lastMessageRef.current) {
      lastMessageRef.current = voice.voiceMessage;
      onMessage(voice.voiceMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.voiceMessage]);

  useEffect(() => {
    onBusyChange?.(voice.voiceState !== "idle" && voice.voiceState !== "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.voiceState]);

  useEffect(() => {
    const isEditable = (el) => el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT");
    const onKeyDown = (e) => {
      if (e.code !== "Space" || e.repeat || isEditable(document.activeElement) || disabled) return;
      e.preventDefault();
      voice.startListening();
    };
    const onKeyUp = (e) => {
      if (e.code !== "Space" || isEditable(document.activeElement)) return;
      e.preventDefault();
      voice.stopListening();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, voice.startListening, voice.stopListening]);

  const transcriptValue = voice.partialTranscript || voice.finalTranscript;
  const talkDisabled = disabled || (voice.voiceState !== "idle" && voice.voiceState !== "listening");
  const isListening = voice.voiceState === "listening";

  return (
    <div style={styles.voiceControl}>
      <div style={styles.voiceControlHeader}>
        <button
          style={{ ...styles.talkBtn, ...(isListening ? styles.talkBtnActive : {}) }}
          disabled={talkDisabled}
          onMouseDown={(e) => {
            e.preventDefault();
            voice.startListening();
            window.addEventListener("mouseup", () => voice.stopListening(), { once: true });
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            voice.startListening();
            window.addEventListener("touchend", () => voice.stopListening(), { once: true });
          }}
        >
          🎙️ {isListening ? "Listening…" : "Hold to talk"}
        </button>
        <span
          style={{
            ...styles.voiceStateBadge,
            ...(voice.voiceState === "error" ? styles.voiceStateBadgeError : {}),
          }}
        >
          {VOICE_STATE_LABELS[voice.voiceState] || voice.voiceState}
        </span>
        {voice.voiceState === "speaking" && (
          <button style={styles.stopSpeakingBtn} onClick={voice.stopSpeaking}>
            Stop speaking
          </button>
        )}
      </div>
      {voice.voiceError && <div style={styles.voiceErrorText}>{voice.voiceError}</div>}
      {transcriptValue && (
        <div style={styles.voiceTranscriptRow}>
          <textarea
            style={styles.transcriptBox}
            rows={2}
            value={transcriptValue}
            onChange={(e) => voice.setFinalTranscript(e.target.value)}
            placeholder="Transcript will appear here…"
          />
          <button
            style={styles.sendBtn}
            disabled={voice.voiceState !== "idle" || disabled}
            onClick={() => voice.sendText(transcriptValue)}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function ChatPanel({ patternId, initialHistory }) {
  const [messages, setMessages] = useState(initialHistory || []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking || voiceBusy) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setThinking(true);
    try {
      const resp = await fetch(`/api/patterns/${patternId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!resp.ok) throw new Error("Chat request failed");
      const { reply } = await resp.json();
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear chat history?")) return;
    await fetch(`/api/patterns/${patternId}/chat`, { method: "DELETE" });
    setMessages([]);
  };

  return (
    <div style={styles.chatPanel}>
      <div style={styles.chatHeader}>
        <span style={styles.chatHeaderTitle}>Ask about this pattern</span>
        {messages.length > 0 && (
          <button style={styles.clearBtn} onClick={handleClear}>Clear</button>
        )}
      </div>
      <div style={styles.chatMessages}>
        {messages.length === 0 && !thinking && (
          <div style={styles.chatEmpty}>
            <span style={{ fontSize: 28 }}>💬</span>
            <span>Ask anything about this pattern</span>
            <span style={{ fontSize: 11 }}>
              Symbol meanings, row instructions, stitch counts, sizing…
            </span>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant),
            }}
          >
            {m.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            ) : (
              m.content
            )}
          </div>
        ))}
        {thinking && <div style={styles.bubbleThinking}>Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <VoiceInputControl
        patternId={patternId}
        onMessage={(m) => setMessages((prev) => [...prev, { role: m.role, content: m.content }])}
        disabled={thinking}
        onBusyChange={setVoiceBusy}
      />
      <div style={styles.chatInputRow}>
        <textarea
          style={styles.chatInput}
          rows={2}
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={thinking || voiceBusy}
        />
        <button
          style={{ ...styles.sendBtn, opacity: thinking || voiceBusy ? 0.6 : 1 }}
          onClick={send}
          disabled={thinking || voiceBusy}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function LibraryChatPanel({ onSelectPattern, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    const nextHistory = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setThinking(true);
    try {
      const resp = await fetch("/api/library/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      if (!resp.ok) throw new Error("Chat request failed");
      const { reply, sources } = await resp.json();
      setMessages((prev) => [...prev, { role: "assistant", content: reply, sources }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={styles.chatPanel}>
      <div style={styles.chatHeader}>
        <span style={styles.chatHeaderTitle}>Ask my library</span>
        {messages.length > 0 && (
          <button style={styles.clearBtn} onClick={() => setMessages([])}>Clear</button>
        )}
      </div>
      <div style={styles.chatMessages}>
        {messages.length === 0 && !thinking && (
          <div style={styles.chatEmpty}>
            <span style={{ fontSize: 28 }}>📚</span>
            <span>Ask across all your saved patterns</span>
            <span style={{ fontSize: 11 }}>
              "Which patterns use a provisional cast-on?"
            </span>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant),
            }}
          >
            {m.role === "assistant" ? (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                {m.sources && m.sources.length > 0 && (
                  <div style={styles.librarySourceRow}>
                    {m.sources.map((s) => (
                      <span
                        key={s.pattern_id}
                        style={styles.librarySourcePill}
                        onClick={() => onSelectPattern(s.pattern_id)}
                      >
                        {s.pattern_title}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              m.content
            )}
          </div>
        ))}
        {thinking && <div style={styles.bubbleThinking}>Searching your library…</div>}
        <div ref={bottomRef} />
      </div>
      <div style={styles.chatInputRow}>
        <textarea
          style={styles.chatInput}
          rows={2}
          placeholder="Ask across your library… (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={thinking}
        />
        <button
          style={{ ...styles.sendBtn, opacity: thinking ? 0.6 : 1 }}
          onClick={send}
          disabled={thinking}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function PatternViewer({ pattern, onDelete }) {
  const meta = pattern.metadata || {};
  const title = meta.title || pattern.filename || "Pattern";

  return (
    <div style={styles.viewer}>
      <div style={styles.viewerHeader}>
        <h2 style={styles.viewerTitle}>{title}</h2>
        <button style={styles.deleteBtn} onClick={() => onDelete(pattern.pattern_id)}>
          Delete
        </button>
      </div>
      <div style={styles.viewerBody}>
        <div style={styles.leftPanel}>
          <MetaPanel metadata={meta} />
          <GlossaryPanel abbreviations={meta.abbreviations} />
          <ChartsSection charts={pattern.chart_images} />
          <div style={styles.sectionTitle}>Pattern Text</div>
          <div style={styles.preText}>
            <PatternMarkdown text={pattern.raw_text} charts={pattern.chart_images} />
          </div>
        </div>
        <div style={styles.rightPanel}>
          <ChatPanel
            patternId={pattern.pattern_id}
            initialHistory={pattern.chat_history || []}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePattern, setActivePattern] = useState(null);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryError, setLibraryError] = useState(null);
  const [libraryChatMessages, setLibraryChatMessages] = useState([]);

  const loadLibrary = () => {
    setLoading(true);
    setLibraryError(null);
    fetch("/api/patterns")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setLibrary(data);
        setLoading(false);
      })
      .catch(() => {
        setLibraryError("Can't reach the backend. Is the server running?");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleUploaded = (doc) => {
    setActivePattern(doc);
    setLibrary((prev) => [
      {
        pattern_id: doc.pattern_id,
        title: doc.metadata?.title || doc.filename || "Unknown",
        upload_date: doc.upload_date,
        has_charts: doc.chart_images?.length > 0,
      },
      ...prev.filter((p) => p.pattern_id !== doc.pattern_id),
    ]);
  };

  const handleSelectPattern = async (pattern_id) => {
    if (activePattern?.pattern_id === pattern_id) return;
    try {
      const resp = await fetch(`/api/patterns/${pattern_id}`);
      if (!resp.ok) throw new Error("Not found");
      const doc = await resp.json();
      setActivePattern(doc);
    } catch {
      alert("Could not load pattern.");
    }
  };

  const handleDelete = async (pattern_id) => {
    if (!window.confirm("Delete this pattern?")) return;
    await fetch(`/api/patterns/${pattern_id}`, { method: "DELETE" });
    setLibrary((prev) => prev.filter((p) => p.pattern_id !== pattern_id));
    if (activePattern?.pattern_id === pattern_id) setActivePattern(null);
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <p style={styles.sidebarTitle}>🧶 Knitting Assistant</p>
          <button style={styles.newBtn} onClick={() => setActivePattern(null)}>
            + Upload Pattern
          </button>
        </div>
        <div
          style={{
            ...styles.patternItem,
            ...(!activePattern ? styles.patternItemActive : {}),
            borderBottom: "1px solid #e0d8d0",
          }}
          onClick={() => setActivePattern(null)}
        >
          <div style={styles.patternItemTitle}>📚 Ask my library</div>
        </div>
        <div style={styles.patternList}>
          {loading && (
            <div style={{ padding: "16px", fontSize: 13, color: "#aaa" }}>Loading…</div>
          )}
          {!loading && libraryError && (
            <div style={styles.libraryErrorBox}>
              <div>{libraryError}</div>
              <button style={styles.retryBtn} onClick={loadLibrary}>Retry</button>
            </div>
          )}
          {!loading && !libraryError && library.length === 0 && (
            <div style={{ padding: "16px", fontSize: 13, color: "#aaa" }}>
              No patterns yet
            </div>
          )}
          {library.map((p) => (
            <div
              key={p.pattern_id}
              style={{
                ...styles.patternItem,
                ...(activePattern?.pattern_id === p.pattern_id
                  ? styles.patternItemActive
                  : {}),
              }}
              onClick={() => handleSelectPattern(p.pattern_id)}
            >
              <div style={styles.patternItemTitle}>{p.title}</div>
              <div style={styles.patternItemDate}>
                {p.has_charts ? "📊 " : ""}
                {formatDate(p.upload_date)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.main}>
        {activePattern ? (
          <PatternViewer key={activePattern.pattern_id} pattern={activePattern} onDelete={handleDelete} />
        ) : (
          <div style={styles.uploadZone}>
            <div style={styles.uploadZoneLeft}>
              <PatternUpload onUploaded={handleUploaded} />
            </div>
            <div style={styles.uploadZoneRight}>
              <LibraryChatPanel
                onSelectPattern={handleSelectPattern}
                messages={libraryChatMessages}
                setMessages={setLibraryChatMessages}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
