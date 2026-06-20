import { useState, useEffect, useRef } from "react";
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
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  uploadZone: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
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
    <div style={styles.uploadZone}>
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
          <div style={styles.chatPlaceholder}>
            <span style={{ fontSize: 36 }}>💬</span>
            <span>Chat coming soon</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>
              Ask questions about this pattern
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePattern, setActivePattern] = useState(null);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patterns")
      .then((r) => r.json())
      .then((data) => {
        setLibrary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
        <div style={styles.patternList}>
          {loading && (
            <div style={{ padding: "16px", fontSize: 13, color: "#aaa" }}>Loading…</div>
          )}
          {!loading && library.length === 0 && (
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
          <PatternViewer pattern={activePattern} onDelete={handleDelete} />
        ) : (
          <PatternUpload onUploaded={handleUploaded} />
        )}
      </div>
    </div>
  );
}
