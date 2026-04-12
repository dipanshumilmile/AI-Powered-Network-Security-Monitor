import { useEffect, useRef } from "react"
import { useIDS } from "../context/IDSContext"
import { Download, TrendingUp } from "lucide-react"
import {
  Chart, BarController, BarElement,
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler
} from "chart.js"

Chart.register(
  BarController, BarElement,
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler
)

/* Simulate 7-day trend data */
function gen7Day() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      label: d.toLocaleDateString("en-GB", { month:"short", day:"numeric" }),
      normal: Math.floor(Math.random()*5000+3000),
      attack: Math.floor(Math.random()*800+100),
    })
  }
  return days
}
const DAYS = gen7Day()

/* Generate top IPs */
function genTopIPs(alerts) {
  const map = {}
  alerts.forEach(a => {
    if (a.src_ip) map[a.src_ip] = (map[a.src_ip]||0) + 1
  })
  return Object.entries(map)
    .sort(([,a],[,b])=>b-a)
    .slice(0,5)
    .map(([ip,count],i)=>({ rank:i+1, ip, count,
      type: ["DoS","U2R","Probe","R2L","DoS"][i] || "DoS",
      country: ["CN","RU","US","KR","DE"][i],
      lastSeen: new Date(Date.now() - Math.random()*300000).toLocaleTimeString("en-GB",{hour12:false})
    }))
}

export default function Reports() {
  const { classCounts, alerts } = useIDS()
  const barRef  = useRef(null); const barChart  = useRef(null)
  const lineRef = useRef(null); const lineChart = useRef(null)

  /* Bar chart — attacks per category */
  useEffect(() => {
    const ctx = barRef.current.getContext("2d")
    barChart.current = new Chart(ctx, {
      type:"bar",
      data:{
        labels: ["Normal","DoS","Probe","R2L","U2R"],
        datasets:[{
          label:"Packets",
          data: [0,0,0,0,0],
          backgroundColor: ["rgba(34,197,94,.3)","rgba(239,68,68,.3)","rgba(59,130,246,.3)","rgba(245,158,11,.3)","rgba(236,72,153,.3)"],
          borderColor:     ["#22c55e","#ef4444","#3b82f6","#f59e0b","#ec4899"],
          borderWidth: 2, borderRadius: 6, borderSkipped:false,
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        animation:{ duration:600 },
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"rgba(8,13,25,0.95)", borderColor:"rgba(255,255,255,0.08)", borderWidth:1,
            titleColor:"#64748b", bodyColor:"#e2e8f0",
            titleFont:{family:"'JetBrains Mono',monospace",size:11},
            bodyFont:{family:"'JetBrains Mono',monospace",size:11},
          }
        },
        scales:{
          x:{ grid:{color:"rgba(255,255,255,0.025)"}, ticks:{color:"#3a4455",font:{family:"'Inter',sans-serif",size:11}}, border:{color:"transparent"} },
          y:{ beginAtZero:true, grid:{color:"rgba(255,255,255,0.025)"}, ticks:{color:"#3a4455",font:{family:"'JetBrains Mono',monospace",size:10}}, border:{color:"transparent"} }
        }
      }
    })
    return () => barChart.current?.destroy()
  },[])

  useEffect(()=>{
    const c = barChart.current
    if(!c) return
    c.data.datasets[0].data=["Normal","DoS","Probe","R2L","U2R"].map(k=>classCounts[k]??0)
    c.update()
  },[classCounts])

  /* Line chart — 7-day trend */
  useEffect(()=>{
    const ctx = lineRef.current.getContext("2d")
    lineChart.current = new Chart(ctx, {
      type:"line",
      data:{
        labels: DAYS.map(d=>d.label),
        datasets:[
          { label:"Normal", data:DAYS.map(d=>d.normal), borderColor:"#22c55e", backgroundColor:"rgba(34,197,94,0.08)", fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:"#22c55e", borderWidth:2 },
          { label:"Attack", data:DAYS.map(d=>d.attack), borderColor:"#ef4444", backgroundColor:"rgba(239,68,68,0.08)", fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:"#ef4444", borderWidth:2 },
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false, animation:{duration:600},
        interaction:{intersect:false, mode:"index"},
        plugins:{
          legend:{ display:true, labels:{ color:"#64748b", font:{family:"'Inter',sans-serif",size:11}, boxWidth:12, boxHeight:12 }},
          tooltip:{
            backgroundColor:"rgba(8,13,25,0.95)", borderColor:"rgba(255,255,255,0.08)", borderWidth:1,
            titleColor:"#64748b", bodyColor:"#e2e8f0",
            titleFont:{family:"'JetBrains Mono',monospace",size:11},
            bodyFont:{family:"'JetBrains Mono',monospace",size:11},
          }
        },
        scales:{
          x:{ grid:{color:"rgba(255,255,255,0.025)"}, ticks:{color:"#3a4455"}, border:{color:"transparent"} },
          y:{ beginAtZero:true, grid:{color:"rgba(255,255,255,0.025)"}, ticks:{color:"#3a4455",font:{family:"'JetBrains Mono',monospace"}}, border:{color:"transparent"} }
        }
      }
    })
    return (()=>lineChart.current?.destroy())
  },[])

  const topIPs = genTopIPs(alerts)
  const ORDER  = ["Normal","DoS","Probe","R2L","U2R"]
  const total  = ORDER.reduce((a,k)=>a+(classCounts[k]??0),0)||1
  const COLORS = { Normal:"#22c55e", DoS:"#ef4444", Probe:"#3b82f6", R2L:"#f59e0b", U2R:"#ec4899" }

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>Reports & Analytics</h1>
          <p className="text-sm text-slate-600 mt-0.5">Cumulative threat intelligence and traffic analysis</p>
        </div>
        <button className="btn btn-ghost" onClick={()=>alert("Export feature — connect to backend to generate PDF/CSV reports")}>
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Bar */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
            <span className="section-title">Attacks by Category</span>
            <span className="section-sub">all-time totals</span>
          </div>
          <div className="p-4 chart-wrap" style={{ height:"220px" }}>
            <canvas ref={barRef} />
          </div>
        </div>

        {/* Line */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-400" />
              <span className="section-title">7-Day Traffic Trend</span>
            </div>
            <span className="section-sub">simulated history</span>
          </div>
          <div className="p-4 chart-wrap" style={{ height:"220px" }}>
            <canvas ref={lineRef} />
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {ORDER.map(k => {
          const v = classCounts[k] ?? 0
          const pct = (v/total*100).toFixed(1)
          return (
            <div key={k} className="card p-4">
              <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-2">{k}</div>
              <div className="text-2xl font-black tabular-nums" style={{ fontFamily:"'Syne',sans-serif", color:COLORS[k] }}>
                {v.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-600 mt-1">{pct}% of total</div>
              <div className="mt-2 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:COLORS[k] }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Top IPs */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border-color)" }}>
          <span className="section-title">Top Threat Source IPs</span>
          <span className="section-sub">{topIPs.length === 0 ? "Accumulating data…" : `${topIPs.length} sources`}</span>
        </div>
        <div className="overflow-x-auto">
          {topIPs.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-slate-700 text-sm">Accumulating alert data…</div>
          ) : (
            <table className="ids-table">
              <thead>
                <tr>
                  <th>#</th><th>Source IP</th><th>Country</th>
                  <th>Attack Type</th><th>Hit Count</th><th>Last Seen</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topIPs.map(r => (
                  <tr key={r.ip} className="row-attack">
                    <td className="text-slate-600">#{r.rank}</td>
                    <td className="text-red-400 font-semibold">{r.ip}</td>
                    <td className="text-slate-500">{r.country}</td>
                    <td>
                      <span className={`badge ${{DoS:"badge-red",Probe:"badge-blue",R2L:"badge-amber",U2R:"badge-pink"}[r.type]}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="text-white font-bold">{r.count}</td>
                    <td className="text-slate-600">{r.lastSeen}</td>
                    <td>
                      <button className="btn btn-danger text-[10px] py-1 px-2"
                        onClick={()=>alert(`IP ${r.ip} flagged for blocking (UI only)`)}>
                        Block
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
