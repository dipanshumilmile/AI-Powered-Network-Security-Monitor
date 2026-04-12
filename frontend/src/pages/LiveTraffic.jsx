import { useState, useEffect, useRef } from "react"
import { useIDS } from "../context/IDSContext"
import { Search, Pause, Play, Filter, ArrowDownUp } from "lucide-react"
import { fmtBytes } from "../utils"

const PROTOCOLS = ["ALL","TCP","UDP","ICMP"]
const CATEGORIES = ["ALL","NORMAL","ATTACK"]

function CategoryBadge({ cat }) {
  return cat === "NORMAL"
    ? <span className="badge badge-green">● Normal</span>
    : <span className="badge badge-red">⚠ Attack</span>
}

function TypeBadge({ type }) {
  const map = { DoS:"badge-red", Probe:"badge-blue", R2L:"badge-amber", U2R:"badge-pink", Normal:"badge-green" }
  if (!type || type === "Normal") return <span className="text-slate-700">—</span>
  return <span className={`badge ${map[type]||"badge-slate"}`}>{type}</span>
}

export default function LiveTraffic() {
  const { packets } = useIDS()
  const [paused,    setPaused]    = useState(false)
  const [frozen,    setFrozen]    = useState([])
  const [search,    setSearch]    = useState("")
  const [protocol,  setProtocol]  = useState("ALL")
  const [category,  setCategory]  = useState("ALL")
  const [sortDir,   setSortDir]   = useState("desc") // newest first
  const tableRef = useRef(null)

  /* Freeze snapshot when paused */
  useEffect(() => {
    if (!paused) setFrozen([])
    else setFrozen(packets)
  }, [paused]) // eslint-disable-line

  const source = paused ? frozen : packets

  const filtered = source.filter(p => {
    if (protocol !== "ALL" && p.protocol !== protocol) return false
    if (category !== "ALL" && p.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.src_ip?.includes(q) ||
        p.dst_ip?.includes(q) ||
        p.service?.includes(q) ||
        p.protocol?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const sorted = sortDir === "desc" ? filtered : [...filtered].reverse()
  const shown  = sorted.slice(0, 200)

  const normalCount = source.filter(p => p.category === "NORMAL").length
  const attackCount = source.filter(p => p.category === "ATTACK").length

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>
            Live Packet Monitor
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">All incoming network flows — real-time classification</p>
        </div>
        <button
          id="pause-resume-btn"
          onClick={() => setPaused(p => !p)}
          className={`btn ${paused ? "btn-success" : "btn-ghost"}`}
        >
          {paused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause Feed</>}
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Captured", value:source.length,  color:"text-slate-300" },
          { label:"Normal",         value:normalCount,    color:"text-emerald-400" },
          { label:"Attack",         value:attackCount,    color:"text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-600">{label}</span>
            <span className={`text-base font-bold font-mono ${color}`}>{value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            id="packet-search"
            className="ids-input pl-8"
            placeholder="Search IP, service, protocol…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-600" />
          <select id="protocol-filter" className="ids-select text-[12px]" value={protocol} onChange={e => setProtocol(e.target.value)}>
            {PROTOCOLS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <select id="category-filter" className="ids-select text-[12px]" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-ghost text-[11px] flex items-center gap-1" onClick={() => setSortDir(d => d==="desc"?"asc":"desc")}>
          <ArrowDownUp size={12} /> {sortDir === "desc" ? "Newest First" : "Oldest First"}
        </button>
        {paused && (
          <span className="badge badge-amber">⏸ Paused — {frozen.length} captured</span>
        )}
        <span className="text-[10px] text-slate-700 ml-auto">
          Showing {shown.length} of {filtered.length} packets
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div ref={tableRef} className="overflow-x-auto" style={{ maxHeight:"calc(100vh - 340px)", overflowY:"auto" }}>
          <table className="ids-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Service</th>
                <th>Bytes Sent</th>
                <th>Bytes Recv</th>
                <th>Category</th>
                <th>Attack Type</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-700 py-10">
                    {source.length === 0 ? "Waiting for packets…" : "No packets match your filter."}
                  </td>
                </tr>
              ) : shown.map(p => (
                <tr
                  key={p.id}
                  className={`${p.category === "NORMAL" ? "row-normal" : "row-attack"} alert-enter`}
                >
                  <td className="text-slate-600">{p.time}</td>
                  <td className={p.category === "ATTACK" ? "text-red-400 font-semibold" : "text-slate-300"}>{p.src_ip}</td>
                  <td className="text-slate-400">{p.dst_ip}</td>
                  <td>
                    <span className={`badge ${{TCP:"badge-blue",UDP:"badge-amber",ICMP:"badge-slate"}[p.protocol]||"badge-slate"}`}>
                      {p.protocol}
                    </span>
                  </td>
                  <td className="text-slate-500">{p.service || "—"}</td>
                  <td className="text-slate-500">{fmtBytes(p.src_bytes||0)}</td>
                  <td className="text-slate-500">{fmtBytes(p.dst_bytes||0)}</td>
                  <td><CategoryBadge cat={p.category} /></td>
                  <td><TypeBadge type={p.type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
