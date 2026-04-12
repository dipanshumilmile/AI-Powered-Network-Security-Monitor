import { NavLink, useLocation } from "react-router-dom"
import { useIDS } from "../context/IDSContext"
import {
  LayoutDashboard, Activity, AlertTriangle, BarChart2,
  Shield, Cpu, ChevronRight, Wifi, WifiOff
} from "lucide-react"

const NAV = [
  { to:"/",          icon: LayoutDashboard, label:"Dashboard" },
  { to:"/traffic",   icon: Activity,        label:"Live Traffic" },
  { to:"/anomalies", icon: AlertTriangle,   label:"Anomalies" },
  { to:"/predict",   icon: Cpu,             label:"Analyze Packet" },
  { to:"/reports",   icon: BarChart2,       label:"Reports" },
]

function Uptime({ sec }) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

export default function Sidebar() {
  const { connected, stats, alerts } = useIDS()
  const location = useLocation()

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col"
      style={{ background:"var(--bg-sidebar)", borderRight:"1px solid var(--border-color)", minHeight:"100vh" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor:"var(--border-color)" }}>
        <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
          <span className="pulse-ring absolute inset-0 rounded-full border border-red-500/50" style={{ animationDelay:"0s" }} />
          <span className="pulse-ring absolute inset-0 rounded-full border border-red-500/30" style={{ animationDelay:"0.6s" }} />
          <div className="relative w-5 h-5 rounded-full bg-red-500/20 border border-red-500/70 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-400 blink" />
          </div>
        </div>
        <div>
          <div className="text-[16px] leading-none text-white" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800 }}>
            IDS<span className="text-red-400">Monitor</span>
          </div>
          <div className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">
            Enterprise Security
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <div className="text-[9px] font-semibold tracking-widest uppercase text-slate-700 px-2 mb-2">
          Navigation
        </div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={15} strokeWidth={2} />
            <span className="flex-1">{label}</span>
            {label === "Anomalies" && alerts.length > 0 && (
              <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                {alerts.length > 99 ? "99+" : alerts.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status panel */}
      <div className="m-3 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full blink ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
          {connected
            ? <><Wifi size={11} className="text-emerald-500" /><span className="text-[10px] text-emerald-400 font-semibold">Live Capture</span></>
            : <><WifiOff size={11} className="text-red-500" /><span className="text-[10px] text-red-400 font-semibold">Disconnected</span></>
          }
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            { label:"Uptime",   value: <Uptime sec={stats.uptime_seconds} /> },
            { label:"Pkt/sec",  value: stats.packets_per_sec },
            { label:"Flows",    value: stats.active_flows },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-[10px]">
              <span className="text-slate-600">{label}</span>
              <span className="text-slate-400 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-[9px] text-slate-700 tracking-wider" style={{ borderColor:"var(--border-color)" }}>
        IDS MONITOR v2.0 · NSL-KDD
      </div>
    </aside>
  )
}
