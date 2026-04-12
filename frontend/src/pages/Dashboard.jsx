import { useEffect, useRef } from "react"
import { useIDS } from "../context/IDSContext"
import {
  Shield, AlertTriangle, TrendingUp, Cpu,
  Activity, Zap, Eye, Globe
} from "lucide-react"
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Tooltip,
  DoughnutController, ArcElement
} from "chart.js"

Chart.register(
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Tooltip,
  DoughnutController, ArcElement
)

const SERIES = [
  { key:"Normal", color:"#22c55e" },
  { key:"DoS",    color:"#ef4444" },
  { key:"Probe",  color:"#3b82f6" },
  { key:"R2L",    color:"#f59e0b" },
  { key:"U2R",    color:"#ec4899" },
]
const DONUT_COLORS = { Normal:"#22c55e", DoS:"#ef4444", Probe:"#3b82f6", R2L:"#f59e0b", U2R:"#ec4899" }
const ORDER = ["Normal","DoS","Probe","R2L","U2R"]

function MetricCard({ icon: Icon, label, value, sub, accent, iconBg }) {
  return (
    <div className="card p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={accent} />
        </div>
        <TrendingUp size={13} className="text-slate-700" />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{label}</div>
        <div className={`metric-num ${accent}`}>{typeof value === "number" ? value.toLocaleString() : value}</div>
        {sub && <div className="text-[11px] text-slate-600 mt-1">{sub}</div>}
      </div>
      {/* subtle bg gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background:`radial-gradient(ellipse at top right, ${iconBg.includes("red") ? "rgba(239,68,68,0.04)" : iconBg.includes("green") ? "rgba(34,197,94,0.04)" : iconBg.includes("blue") ? "rgba(59,130,246,0.04)" : "rgba(245,158,11,0.04)"}, transparent)` }} />
    </div>
  )
}

export default function Dashboard() {
  const { stats, classCounts, timeline, alerts, criticalCount, attackCount } = useIDS()
  const lineRef   = useRef(null)
  const lineChart = useRef(null)
  const donutRef  = useRef(null)
  const donutChart= useRef(null)

  const total = Object.values(classCounts).reduce((a,b)=>a+b,0)

  /* Line chart */
  useEffect(() => {
    const ctx = lineRef.current.getContext("2d")
    lineChart.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: SERIES.map(s => ({
          label: s.key,
          data: [],
          borderColor: s.color,
          backgroundColor: s.color + "18",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        }))
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        animation:{ duration:0 },
        interaction:{ intersect:false, mode:"index" },
        plugins:{
          legend:{ display:false },
          tooltip:{
            backgroundColor:"rgba(8,13,25,0.95)", borderColor:"rgba(255,255,255,0.08)", borderWidth:1,
            titleColor:"#64748b", bodyColor:"#e2e8f0", padding:12,
            titleFont:{ family:"'JetBrains Mono',monospace", size:11 },
            bodyFont: { family:"'JetBrains Mono',monospace", size:11 },
            callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}` }
          }
        },
        scales:{
          x:{ ticks:{ color:"#2d3748", font:{family:"'JetBrains Mono',monospace",size:9}, maxTicksLimit:10, maxRotation:0 },
              grid:{ color:"rgba(255,255,255,0.025)" }, border:{ color:"rgba(255,255,255,0.04)" } },
          y:{ beginAtZero:true,
              ticks:{ color:"#2d3748", font:{family:"'JetBrains Mono',monospace",size:9}, maxTicksLimit:6 },
              grid:{ color:"rgba(255,255,255,0.025)" }, border:{ color:"rgba(255,255,255,0.04)" } }
        }
      }
    })
    return () => lineChart.current?.destroy()
  }, [])

  useEffect(() => {
    const c = lineChart.current
    if (!c || !timeline.length) return
    c.data.labels = timeline.map(t => t.time)
    SERIES.forEach((s,i) => { c.data.datasets[i].data = timeline.map(t => t[s.key] ?? 0) })
    c.update("none")
  }, [timeline])

  /* Donut chart */
  useEffect(() => {
    const ctx = donutRef.current.getContext("2d")
    donutChart.current = new Chart(ctx, {
      type:"doughnut",
      data:{
        labels: ORDER,
        datasets:[{ data: ORDER.map(()=>1), backgroundColor: ORDER.map(k=>DONUT_COLORS[k]),
          borderColor:"#070b14", borderWidth:3, hoverOffset:8 }]
      },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:"72%", animation:{duration:600},
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"rgba(8,13,25,0.95)", borderColor:"rgba(255,255,255,0.08)", borderWidth:1,
            titleColor:"#64748b", bodyColor:"#e2e8f0",
            titleFont:{family:"'JetBrains Mono',monospace",size:11},
            bodyFont:{family:"'JetBrains Mono',monospace",size:11},
            callbacks:{ label: ctx => {
              const t = ctx.dataset.data.reduce((a,b)=>a+b,0)||1
              return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed/t)*100).toFixed(1)}%)`
            }}
          }
        }
      }
    })
    return () => donutChart.current?.destroy()
  }, [])

  useEffect(() => {
    const c = donutChart.current
    if (!c) return
    const vals = ORDER.map(k => classCounts[k] ?? 0)
    c.data.datasets[0].data = vals.every(v=>v===0) ? ORDER.map(()=>1) : vals
    c.update()
  }, [classCounts])

  const recentAlerts = alerts.slice(0,8)

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>Security Dashboard</h1>
          <p className="text-sm text-slate-600 mt-0.5">Real-time network intrusion monitoring — NSL-KDD ML Model</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blink inline-block" />
          Live · Updating every 1s
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={Globe}         label="Total Packets"   value={stats.total_packets} sub={`${stats.packets_per_sec} pkt/sec`} accent="text-blue-400"   iconBg="bg-blue-500/10" />
        <MetricCard icon={Shield}        label="Normal Traffic"  value={classCounts.Normal || 0}  sub="Benign connections"              accent="text-emerald-400" iconBg="bg-emerald-500/10" />
        <MetricCard icon={AlertTriangle} label="Attack Traffic"  value={attackCount}           sub={`${stats.total_alerts} alerts fired`}  accent="text-red-400"    iconBg="bg-red-500/10" />
        <MetricCard icon={Zap}           label="Critical Threats" value={criticalCount}          sub="U2R + R2L combined"               accent="text-amber-400"   iconBg="bg-amber-500/10" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Traffic timeline */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
            <div>
              <span className="section-title">Traffic Timeline</span>
              <span className="section-sub ml-3">live · last 60s</span>
            </div>
            <div className="flex items-center gap-4">
              {SERIES.map(s => (
                <div key={s.key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background:s.color }} />
                  {s.key}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 chart-wrap" style={{ height:"220px" }}>
            <canvas ref={lineRef} />
          </div>
        </div>

        {/* Donut */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
            <span className="section-title">Attack Distribution</span>
            <span className="section-sub">all-time</span>
          </div>
          <div className="p-5 flex flex-col items-center gap-4">
            <div className="relative w-36 h-36 flex-shrink-0">
              <canvas ref={donutRef} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-xl font-black text-white tabular-nums" style={{ fontFamily:"'Syne',sans-serif" }}>
                  {total.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider">classified</div>
              </div>
            </div>
            <div className="w-full flex flex-col gap-2.5">
              {ORDER.map(k => {
                const v = classCounts[k] ?? 0
                const pct = total > 0 ? (v / total) * 100 : 0
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background:DONUT_COLORS[k] }} />
                    <span className="text-[11px] text-slate-400 w-12 flex-shrink-0">{k}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:DONUT_COLORS[k] }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-slate-500 w-9 text-right">{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: recent alerts + stat grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        {/* Recent alerts */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
            <span className="section-title">Recent Alerts</span>
            {alerts.length > 0 && <span className="text-[9px] text-red-400 blink uppercase tracking-wider">● live</span>}
          </div>
          <div className="overflow-x-auto">
            {recentAlerts.length === 0
              ? <div className="flex items-center justify-center h-24 text-slate-700 text-sm">Monitoring traffic…</div>
              : <table className="ids-table">
                  <thead>
                    <tr>
                      <th>Time</th><th>Src IP</th><th>Dst IP</th>
                      <th>Type</th><th>Service</th><th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAlerts.map(a => (
                      <tr key={a.id} className="row-attack alert-enter">
                        <td className="text-slate-500">{a.time}</td>
                        <td className="text-red-400">{a.src_ip}</td>
                        <td className="text-slate-400">{a.dst_ip}</td>
                        <td>
                          <span className={`badge ${{DoS:"badge-red",Probe:"badge-blue",R2L:"badge-amber",U2R:"badge-pink"}[a.type]||"badge-slate"}`}>
                            {a.type}
                          </span>
                        </td>
                        <td className="text-slate-500">{a.service || "—"}</td>
                        <td className={`font-semibold ${a.confidence>=0.9?"text-red-400":a.confidence>=0.8?"text-amber-400":"text-slate-500"}`}>
                          {((a.confidence||0)*100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>

        {/* Quick stats */}
        <div className="card p-5">
          <div className="section-title mb-4">System Status</div>
          <div className="flex flex-col gap-3">
            {[
              { label:"Active Flows",      value:stats.active_flows,     color:"text-blue-400" },
              { label:"Packets/sec",       value:stats.packets_per_sec,  color:"text-emerald-400" },
              { label:"Total Alerts",      value:stats.total_alerts,     color:"text-red-400" },
              { label:"DoS Detected",      value:classCounts.DoS||0,     color:"text-red-400" },
              { label:"Probe Detected",    value:classCounts.Probe||0,   color:"text-blue-400" },
              { label:"R2L Detected",      value:classCounts.R2L||0,     color:"text-amber-400" },
              { label:"U2R Detected",      value:classCounts.U2R||0,     color:"text-pink-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor:"rgba(255,255,255,0.04)" }}>
                <span className="text-[12px] text-slate-500">{label}</span>
                <span className={`text-[13px] font-bold font-mono tabular-nums ${color}`}>
                  {value?.toLocaleString?.() ?? value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
