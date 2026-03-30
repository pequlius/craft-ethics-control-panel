import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:3333";
const MONO = "'Courier New', monospace";
const SANS = "'Helvetica Neue', Arial, sans-serif";

const GLOBAL_DIMS = [
  { id: "velocity",      label: "Hastighet",   color: "#f97316", low: "Minimalt", high: "Fullt"    },
  { id: "autonomy",      label: "Frihet",       color: "#8b5cf6", low: "Strikt",  high: "Fritt"    },
  { id: "clarification", label: "Klargöranden", color: "#0ea5e9", low: "Antar",   high: "Frågar"   },
  { id: "reporting",     label: "Redogörelse",  color: "#10b981", low: "Tyst",    high: "Utförlig" },
];

const PERSPECTIVE_AGENTS = [
  { id: "consequence",   label: "Konsekvens",  color: "#6366f1", bg: "#eef2ff", border: "#a5b4fc", desc: "Väger konsekvenser, bias och EDI-faktorer" },
  { id: "resources",     label: "Resurser",    color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7", desc: "Minimerar resursanvändning och tokens"      },
  { id: "craftsmanship", label: "Noggrannhet", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", desc: "Uppmuntrar precision och god praxis"         },
];

const STRENGTH_LABELS = ["Minimal", "Låg", "Medel", "Hög", "Maximal"];

// --- Sub-components ---

function GlobalSlider({ dim, value, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", fontFamily: MONO, color: "#374151", letterSpacing: "0.04em" }}>
          {dim.label}
        </span>
        <span style={{ fontSize: "11px", fontFamily: MONO, color: dim.color, fontWeight: "700" }}>
          {STRENGTH_LABELS[value - 1]}
        </span>
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

function AgentCard({ agent, on, strength, onToggle, onStrength }) {
  return (
    <div style={{
      background: agent.bg,
      border: `2px solid ${on ? agent.color : agent.border}`,
      borderRadius: "16px",
      padding: "18px 20px",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: on
        ? `0 4px 20px ${agent.color}28, 0 0 0 1px ${agent.color}22`
        : "0 1px 4px #0000000a",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700", fontFamily: MONO, color: agent.color, letterSpacing: "0.04em" }}>
            {agent.label}
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280", fontFamily: MONO, marginTop: "3px", lineHeight: "1.5" }}>
            {agent.desc}
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            width: "42px", height: "24px", borderRadius: "999px", border: "none",
            background: on ? agent.color : "#d1d5db",
            cursor: "pointer", position: "relative", flexShrink: 0, marginLeft: "12px",
            transition: "background 0.2s",
            boxShadow: on ? `0 2px 8px ${agent.color}55` : "none",
          }}
        >
          <div style={{
            width: "18px", height: "18px", borderRadius: "50%", background: "white",
            position: "absolute", top: "3px",
            left: on ? "21px" : "3px",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px #00000044",
          }} />
        </button>
      </div>

      <div style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "10px", fontFamily: MONO, color: "#9ca3af" }}>Styrka</span>
          <span style={{
            fontSize: "10px", fontFamily: MONO, fontWeight: "700",
            color: on ? agent.color : "#9ca3af",
            transition: "color 0.2s",
          }}>
            {STRENGTH_LABELS[strength - 1]}
          </span>
        </div>
        <input
          type="range" min={1} max={5} value={strength}
          onChange={e => onStrength(+e.target.value)}
          style={{
            width: "100%", cursor: "pointer",
            accentColor: on ? agent.color : "#9ca3af",
            opacity: on ? 1 : 0.45,
            transition: "opacity 0.2s",
          }}
        />
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

const DEFAULT_GLOBALS = { velocity: 3, autonomy: 2, clarification: 2, reporting: 2 };
const DEFAULT_AGENTS_ON = { consequence: true, resources: true, craftsmanship: true };
const DEFAULT_AGENTS_STR = { consequence: 3, resources: 2, craftsmanship: 3 };
const DEFAULT_PRIORITIES = { consequence: 1, resources: 2, craftsmanship: 3 };

export default function App() {
  const [globals, setGlobals] = useState(DEFAULT_GLOBALS);
  const [agentOn, setAgentOn] = useState(DEFAULT_AGENTS_ON);
  const [agentStrength, setAgentStrength] = useState(DEFAULT_AGENTS_STR);
  const [agentPriority] = useState(DEFAULT_PRIORITIES);

  const [syncStatus, setSyncStatus] = useState("loading"); // "loading" | "synced" | "saving" | "offline"
  const debounceRef = useRef(null);
  const initializedRef = useRef(false);

  // Build the config payload from current state
  const buildPayload = useCallback((g, on, str, pri) => ({
    global: g,
    perspective_agents: Object.fromEntries(
      PERSPECTIVE_AGENTS.map(({ id }) => [
        id,
        { active: on[id], strength: str[id], priority: pri[id] },
      ])
    ),
  }), []);

  // Fetch config on mount
  useEffect(() => {
    fetch(`${API}/config`)
      .then(r => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(data => {
        if (data.global) setGlobals(data.global);
        if (data.perspective_agents) {
          const on = {}, str = {};
          for (const id of ["consequence", "resources", "craftsmanship"]) {
            const a = data.perspective_agents[id];
            if (a) { on[id] = a.active; str[id] = a.strength; }
          }
          setAgentOn(prev => ({ ...prev, ...on }));
          setAgentStrength(prev => ({ ...prev, ...str }));
        }
        setSyncStatus("synced");
        initializedRef.current = true;
      })
      .catch(() => {
        setSyncStatus("offline");
        initializedRef.current = true;
      });
  }, []);

  // Debounced PUT whenever state changes (skip first render / load)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (syncStatus === "offline") return;

    setSyncStatus("saving");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const payload = buildPayload(globals, agentOn, agentStrength, agentPriority);
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
  }, [globals, agentOn, agentStrength]);

  const statusText = { synced: "Synkroniserad", saving: "Sparar...", loading: "Laddar...", offline: "Offline" }[syncStatus];
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
            Servern är inte igång — förändringar sparas inte.
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
            Konfigurerar beteende och perspektiv hos aktiva agenter
          </div>
        </div>

        {/* Global sliders */}
        <Section title="GLOBALA PARAMETRAR">
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

        {/* Perspective agents */}
        <Section title="PERSPEKTIVAGENTER">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {PERSPECTIVE_AGENTS.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                on={agentOn[agent.id]}
                strength={agentStrength[agent.id]}
                onToggle={() => setAgentOn(s => ({ ...s, [agent.id]: !s[agent.id] }))}
                onStrength={v => setAgentStrength(s => ({ ...s, [agent.id]: v }))}
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
