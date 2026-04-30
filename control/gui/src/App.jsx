import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:3333";
const MONO = "'Courier New', monospace";
const SANS = "'Helvetica Neue', Arial, sans-serif";

const GLOBAL_DIMS = [
  {
    id: "fidelity", label: "Fidelity", color: "#f97316", low: "Sketch", high: "Complete",
    desc: "Controls how finished the output is per prompt. Low produces structural outlines and stubs only — each prompt adds one layer. High produces fully implemented, production-ready code in one pass.",
  },
  {
    id: "autonomy", label: "Autonomy", color: "#8b5cf6", low: "Strict", high: "Free",
    desc: "Controls how much the agent infers versus asks. Low means nothing is assumed — every unspecified detail triggers a question. High means the agent acts independently, expands scope, and reports afterward.",
  },
  {
    id: "clarification", label: "Clarification", color: "#0ea5e9", low: "Assumes", high: "Asks",
    desc: "Controls whether the agent clarifies before starting. Low means it picks an interpretation and proceeds without comment. High requires the agent to restate the task, list all assumptions, and wait for explicit approval before writing anything.",
  },
  {
    id: "explanations", label: "Explanations", color: "#10b981", low: "Silent", high: "Detailed",
    desc: "Controls how much the agent explains its work. Low means output only — no commentary at all. High means a thorough written account of every step, decision, and alternative considered.",
  },
  {
    id: "ethics", label: "Ethical Awareness", color: "#ec4899", low: "Provocative", high: "Aware",
    desc: "Controls how much ethical and social considerations shape the output. Low is a design provocation mode — the agent actively challenges norms and ignores harm and DEI concerns. High applies full ethical scrutiny and blocks suggestions with significant risk.",
  },
];

const STRENGTH_LABELS = ["Minimal", "Low", "Medium", "High", "Maximum"];

// --- Sub-components ---

function GlobalSlider({ dim, value, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", fontFamily: MONO, color: "#374151", letterSpacing: "0.04em" }}>
          {dim.label}
        </span>
        <span style={{ fontSize: "11px", fontFamily: MONO, color: dim.color, fontWeight: "700" }}>
          {STRENGTH_LABELS[value - 1]}
        </span>
      </div>
      <div style={{ fontSize: "10px", color: "#9ca3af", fontFamily: SANS, lineHeight: "1.5", marginBottom: "8px" }}>
        {dim.desc}
      </div>
      <input
        type="range" min={1} max={5} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: "100%", cursor: "pointer", accentColor: dim.color }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
        <span style={{ fontSize: "9px", fontFamily: MONO, color: "#9ca3af" }}>{dim.low}</span>
        <span style={{ fontSize: "9px", fontFamily: MONO, color: "#9ca3af" }}>{dim.high}</span>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "20px",
      padding: "22px",
      boxShadow: "0 1px 16px #0000000c, 0 0 0 1px #e5e7eb",
      marginBottom: "14px",
    }}>
      <div style={{ fontSize: "9px", fontFamily: MONO, letterSpacing: "0.22em", color: "#9ca3af", marginBottom: "20px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// --- Main app ---

const DEFAULT_GLOBALS = { fidelity: 3, autonomy: 2, clarification: 2, explanations: 2, ethics: 3 };

export default function App() {
  const [globals, setGlobals]       = useState(DEFAULT_GLOBALS);
  const [syncStatus, setSyncStatus] = useState("loading");

  const debounceRef    = useRef(null);
  const initializedRef = useRef(false);
  // Preserve fields we don't expose in the UI (e.g. perspective_agents)
  const fullConfigRef  = useRef({});

  // Fetch config on mount
  useEffect(() => {
    fetch(`${API}/config`)
      .then(r => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(data => {
        fullConfigRef.current = data;
        if (data.global) setGlobals(data.global);
        setSyncStatus("synced");
        initializedRef.current = true;
      })
      .catch(() => {
        setSyncStatus("offline");
        initializedRef.current = true;
      });
  }, []);

  // Debounced PUT whenever globals change (skip first render / load)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (syncStatus === "offline") return;

    setSyncStatus("saving");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const payload = { ...fullConfigRef.current, global: globals };
      fetch(`${API}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(r => {
          if (!r.ok) throw new Error("bad response");
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("offline"));
    }, 500);
  }, [globals]);

  const statusText  = { synced: "Synced", saving: "Saving...", loading: "Loading...", offline: "Offline" }[syncStatus];
  const statusColor = { synced: "#10b981", saving: "#f59e0b", loading: "#9ca3af", offline: "#ef4444" }[syncStatus];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", padding: "28px 20px 60px", fontFamily: SANS }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>

        {/* Offline warning */}
        {syncStatus === "offline" && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px",
            padding: "10px 16px", marginBottom: "16px",
            fontSize: "11px", fontFamily: MONO, color: "#b91c1c",
          }}>
            Server is not running — changes will not be saved.
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ margin: 0, fontSize: "20px", color: "#111", fontWeight: "700", letterSpacing: "-0.02em" }}>
              Agent Control
            </h1>
            <span style={{
              fontSize: "8px", fontFamily: MONO, letterSpacing: "0.2em",
              color: "white", background: "#111", padding: "3px 8px", borderRadius: "4px",
            }}>
              PROTOTYPE
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: MONO }}>
            Configures the behaviour of the active agent
          </div>
        </div>

        {/* Global sliders */}
        <Section title="PARAMETERS">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {GLOBAL_DIMS.map(dim => (
              <GlobalSlider
                key={dim.id}
                dim={dim}
                value={globals[dim.id]}
                onChange={v => setGlobals(g => ({ ...g, [dim.id]: v }))}
              />
            ))}
          </div>
        </Section>

        <div style={{ textAlign: "center", fontSize: "9px", color: "#c4c4bc", fontFamily: MONO, letterSpacing: "0.12em" }}>
          HCI RESEARCH — PROGRAMMING WITH AI
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: "1px solid #e5e7eb",
        padding: "8px 20px",
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "10px", fontFamily: MONO, color: "#6b7280",
      }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: statusColor, flexShrink: 0,
          transition: "background 0.3s",
        }} />
        {statusText}
      </div>
    </div>
  );
}
