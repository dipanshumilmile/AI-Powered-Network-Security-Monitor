import { useState, useEffect, useRef } from "react"
import { useIDS } from "../context/IDSContext"
import { SEVERITY_MAP } from "../utils"
import { ShieldAlert, ShieldX, ShieldCheck, AlertOctagon, Search } from "lucide-react"
import { Chart, DoughnutController, ArcElement, Tooltip } from "chart.js"

Chart.register(DoughnutController, ArcElement, Tooltip)

const ORDER = ["DoS","Probe","R2L","U2R"]
const DONUT_COLORS = { DoS:"#ef4444", Probe:"#3b82f6", R2L:"#f59e0b", U2R:"#ec4899" }

function SeverityBadge({ type }) {
  const s = SEVERITY_MAP[type]
  if (!s) return null
  const map = { CRITICAL:"badge-dark-red", HIGH:"badge-red", MEDIUM:"badge-amber", LOW:"badge-yellow" }
  return <span className={`badge ${map[s.level]}`}>{s.level}</span>
}

function ThreatIcon({ type }) {
  const level = SEVERITY_MAP[type]?.level
  if (level === "CRITICAL") return <AlertOctagon size={14} className="text-red-400" />
  if (level === "HIGH")     return <ShieldX size={14} className="text-red-400" />
  if (level === "MEDIUM")   return <ShieldAlert size={14} className="text-amber-400" />
  return <ShieldCheck size={14} className="text-yellow-400" />
}

export default function Anomalies() {
  const { alerts, classCounts } = useIDS()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL") // ALL | CRITICAL | HIGH | MEDIUM | LOW
  const donutRef  = useRef(null)
  const donutChart= useRef(null)

  /* Donut chart */
  useEffect(() => {
    const ctx = donutRef.current.getContext("2d")
    donutChart.current = new Chart(ctx, {
      type:"doughnut",
      data:{
        labels: ORDER,
        datasets:[{ data:ORDER.map(()=>1), backgroundColor:ORDER.map(k=>DONUT_COLORS[k]),
          borderColor:"#070b14", borderWidth:3, hoverOffset:6 }]
      },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:"68%", animation:{duration:500},
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"rgba(8,13,25,0.95)", borderColor:"rgba(255,255,255,0.08)", borderWidth:1,
            titleColor:"#64748b", bodyColor:"#e2e8f0",
            titleFont:{family:"'JetBrains Mono',monospace",size:11},
            bodyFont:{family:"'JetBrains Mono',monospace",size:11},
          }
        }
      }
    })
    return () => donutChart.current?.destroy()
  },[])

  useEffect(() => {
    const c = donutChart.current
    if (!c) return
    const vals = ORDER.map(k => classCounts[k] ?? 0)
    c.data.datasets[0].data = vals.every(v=>v===0) ? ORDER.map(()=>1) : vals
    c.update()
  },[classCounts])

  const onlyAttacks = alerts.filter(a => a.type && a.type !== "Normal")

  const filtered = onlyAttacks.filter(a => {
    const s = SEVERITY_MAP[a.type]?.level || ""
    if (filter !== "ALL" && s !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.src_ip?.includes(q) || a.dst_ip?.includes(q) || a.type?.toLowerCase().includes(q) || a.service?.includes(q)
    }
    return true
  })

  const counts = {
    CRITICAL: onlyAttacks.filter(a => SEVERITY_MAP[a.type]?.level === "CRITICAL").length,
    HIGH:     onlyAttacks.filter(a => SEVERITY_MAP[a.type]?.level === "HIGH").length,
    MEDIUM:   onlyAttacks.filter(a => SEVERITY_MAP[a.type]?.level === "MEDIUM").length,
    LOW:      onlyAttacks.filter(a => SEVERITY_MAP[a.type]?.level === "LOW").length,
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>
          Anomaly Analysis
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">All detected attack traffic — severity classification & damage assessment</p>
      </div>

      {/* Top row: chart + severity breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        {/* Donut */}
        <div className="card">
          <div className="px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
            <span className="section-title">Attack Breakdown</span>
          </div>
          <div className="p-4 flex flex-col items-center gap-4">
            <div className="relative w-40 h-40">
              <canvas ref={donutRef} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-xl font-black text-white" style={{ fontFamily:"'Syne',sans-serif" }}>
                  {onlyAttacks.length}
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider">threats</div>
              </div>
            </div>
            <div className="w-full flex flex-col gap-2">
              {ORDER.map(k => {
                const v = classCounts[k] ?? 0
                const t = ORDER.reduce((a,key)=>a+(classCounts[key]??0),0)||1
                return (
                  <div key={k} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-sm" style={{ background:DONUT_COLORS[k] }} />
                    <span className="text-slate-400 w-10">{k}</span>
                    <div className="flex-1 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width:`${(v/t*100).toFixed(1)}%`, background:DONUT_COLORS[k] }} />
                    </div>
                    <span className="text-slate-500 w-8 text-right font-mono">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Severity cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { level:"CRITICAL", icon:AlertOctagon, color:"text-red-400",    bg:"bg-red-500/10",    border:"border-red-500/20",    desc:"System-compromising", count: counts.CRITICAL },
            { level:"HIGH",     icon:ShieldX,      color:"text-orange-400", bg:"bg-orange-500/10", border:"border-orange-500/20", desc:"Service disruption",   count: counts.HIGH },
            { level:"MEDIUM",   icon:ShieldAlert,  color:"text-amber-400",  bg:"bg-amber-500/10",  border:"border-amber-500/20",  desc:"Unauthorized access",  count: counts.MEDIUM },
            { level:"LOW",      icon:ShieldCheck,  color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/20", desc:"Reconnaissance only",  count: counts.LOW },
          ].map(({ level, icon:Icon, color, bg, border, desc, count }) => (
            <button
              key={level}
              onClick={() => setFilter(f => f === level ? "ALL" : level)}
              className={`card p-4 flex flex-col gap-2 border cursor-pointer transition-all duration-200 hover:border-white/10 text-left
                ${filter === level ? "ring-1 ring-blue-500/40" : ""} ${border}`}
              style={{ background: filter===level ? "rgba(59,130,246,0.06)" : undefined }}
            >
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
              <div className={`metric-num text-2xl ${color}`}>{count}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{level}</div>
              <div className="text-[10px] text-slate-700">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter + Search */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            className="ids-input pl-8"
            placeholder="Search IP, type, service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(l => (
            <button key={l} onClick={() => setFilter(l)}
              className={`btn text-[11px] py-1.5 px-3 ${filter===l?"btn-primary":"btn-ghost"}`}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-slate-700 ml-auto">{filtered.length} threats</span>
      </div>

      {/* Threats table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight:"calc(100vh - 380px)", overflowY:"auto" }}>
          <table className="ids-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Attack Type</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Service</th>
                <th>Protocol</th>
                <th>Confidence</th>
                <th>Potential Damage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-slate-700 py-10">
                  {onlyAttacks.length === 0 ? "No attacks detected — monitoring…" : "No results match your filter."}
                </td></tr>
              ) : filtered.map(a => {
                const sev = SEVERITY_MAP[a.type]
                const isCrit = sev?.level === "CRITICAL" || sev?.level === "HIGH"
                return (
                  <tr key={a.id}
                    className={`alert-enter ${isCrit ? "row-critical critical-pulse" : "row-attack"}`}
                    style={{ position:"relative" }}
                  >
                    <td className="text-slate-500">{a.time}</td>
                    <td><SeverityBadge type={a.type} /></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <ThreatIcon type={a.type} />
                        <span className={`font-semibold text-[12px] ${{DoS:"text-red-400",Probe:"text-blue-400",R2L:"text-amber-400",U2R:"text-pink-400"}[a.type]}`}>
                          {a.type}
                        </span>
                      </div>
                    </td>
                    <td className="text-red-400 font-semibold">{a.src_ip}</td>
                    <td className="text-slate-400">{a.dst_ip}</td>
                    <td className="text-slate-500">{a.service || "—"}</td>
                    <td>
                      <span className={`badge ${a.protocol==="tcp"?"badge-blue":a.protocol==="udp"?"badge-amber":"badge-slate"}`}>
                        {(a.protocol||"?").toUpperCase()}
                      </span>
                    </td>
                    <td className={`font-semibold ${(a.confidence||0)>=0.9?"text-red-400":(a.confidence||0)>=0.8?"text-amber-400":"text-slate-500"}`}>
                      {((a.confidence||0)*100).toFixed(1)}%
                    </td>
                    <td className="text-slate-500 max-w-[200px]" style={{ fontSize:"11px", whiteSpace:"normal", lineHeight:"1.4" }}>
                      {sev?.damage || "—"}
                    </td>
                    <td>
                      {isCrit && (
                        <button className="btn btn-danger text-[10px] py-1 px-2"
                          onClick={() => alert(`IP ${a.src_ip} flagged for blocking (UI only)`)}>
                          Block IP
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
