import { useState } from "react"
import { Cpu, ChevronRight, CheckCircle, XCircle, Loader } from "lucide-react"

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"

const PROTOCOLS = ["tcp","udp","icmp"]
const SERVICES  = ["http","ftp","smtp","ssh","dns","https","pop_3","imap4","telnet","rdp","private","other"]
const FLAGS     = ["SF","S0","RSTO","OTH","S1","REJ","RSTOS0"]

const DEFAULTS = {
  duration:0, protocol_type:"tcp", service:"http", flag:"SF",
  src_bytes:1000, dst_bytes:500, wrong_fragment:0, urgent:0,
  logged_in:1, num_failed_logins:0, num_compromised:0,
  count:10, srv_count:10, serror_rate:0.0, rerror_rate:0.0,
  same_srv_rate:1.0, diff_srv_rate:0.0,
}

function FieldGroup({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="text-[11px] font-bold tracking-widest uppercase text-blue-400 mb-4 flex items-center gap-2">
        <ChevronRight size={13} />
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  )
}

function Field({ label, name, type="number", options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      {options ? (
        <select className="ids-select" name={name} value={value} onChange={onChange}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className="ids-input" type={type} name={name} value={value} onChange={onChange} />
      )}
    </div>
  )
}

export default function Predict() {
  const [form,   setForm]   = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const [loading,setLoading]= useState(false)
  const [error,  setError]  = useState(null)

  const handleChange = e => {
    const { name, value, type } = e.target
    setForm(f => ({ ...f, [name]: type==="number" ? parseFloat(value)||0 : value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setResult(null); setError(null)
    try {
      const res  = await fetch(`${API}/api/predict`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      /* Demo fallback if backend /api/predict not available */
      const isAttack = Math.random() < 0.35
      const types    = ["DoS","Probe","R2L","U2R"]
      setResult({
        prediction: isAttack ? types[Math.floor(Math.random()*types.length)] : "Normal",
        confidence: +(Math.random()*0.25+0.75).toFixed(4),
        demo: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const isNormal   = result?.prediction === "Normal"
  const attackType = result?.prediction

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>
          Packet Analyzer
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">Submit network connection features for ML-based intrusion classification</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group 1 */}
        <FieldGroup title="Connection Info">
          <Field label="Duration (s)"  name="duration"       value={form.duration}       onChange={handleChange} />
          <Field label="Protocol"      name="protocol_type"  value={form.protocol_type}  onChange={handleChange} options={PROTOCOLS} />
          <Field label="Service"       name="service"        value={form.service}         onChange={handleChange} options={SERVICES} />
          <Field label="Flag"          name="flag"           value={form.flag}            onChange={handleChange} options={FLAGS} />
        </FieldGroup>

        {/* Group 2 */}
        <FieldGroup title="Traffic Volume">
          <Field label="Src Bytes"      name="src_bytes"       value={form.src_bytes}       onChange={handleChange} />
          <Field label="Dst Bytes"      name="dst_bytes"       value={form.dst_bytes}       onChange={handleChange} />
          <Field label="Wrong Fragment" name="wrong_fragment"  value={form.wrong_fragment}  onChange={handleChange} />
          <Field label="Urgent"         name="urgent"          value={form.urgent}           onChange={handleChange} />
        </FieldGroup>

        {/* Group 3 */}
        <FieldGroup title="Login Activity">
          <Field label="Logged In"        name="logged_in"          value={form.logged_in}          onChange={handleChange} />
          <Field label="Failed Logins"    name="num_failed_logins"  value={form.num_failed_logins}  onChange={handleChange} />
          <Field label="Num Compromised"  name="num_compromised"    value={form.num_compromised}    onChange={handleChange} />
        </FieldGroup>

        {/* Group 4 */}
        <FieldGroup title="Connection Stats">
          <Field label="Count"          name="count"           value={form.count}           onChange={handleChange} />
          <Field label="Srv Count"      name="srv_count"       value={form.srv_count}       onChange={handleChange} />
          <Field label="Serror Rate"    name="serror_rate"     value={form.serror_rate}     onChange={handleChange} />
          <Field label="Rerror Rate"    name="rerror_rate"     value={form.rerror_rate}     onChange={handleChange} />
          <Field label="Same Srv Rate"  name="same_srv_rate"   value={form.same_srv_rate}   onChange={handleChange} />
          <Field label="Diff Srv Rate"  name="diff_srv_rate"   value={form.diff_srv_rate}   onChange={handleChange} />
        </FieldGroup>

        <button id="analyze-btn" type="submit" disabled={loading}
          className="btn btn-primary text-sm w-full justify-center py-3"
          style={{ borderRadius:"10px" }}
        >
          {loading
            ? <><Loader size={15} className="animate-spin" /> Analyzing…</>
            : <><Cpu size={15} /> Analyze Packet</>
          }
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`card p-5 border slide-up ${isNormal ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isNormal ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {isNormal
                ? <CheckCircle size={24} className="text-emerald-400" />
                : <XCircle    size={24} className="text-red-400" />
              }
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">
                ML Prediction Result{result.demo ? " (Demo)" : ""}
              </div>
              <div className={`text-2xl font-black ${isNormal?"text-emerald-400":"text-red-400"}`}
                style={{ fontFamily:"'Syne',sans-serif" }}>
                {isNormal ? "Normal Traffic" : `Attack Detected — ${attackType}`}
              </div>
              <div className="text-sm mt-1.5 text-slate-500">
                Confidence: <span className={`font-bold ${(result.confidence||0)>=0.9?"text-red-400":"text-amber-400"}`}>
                  {((result.confidence||0)*100).toFixed(1)}%
                </span>
              </div>
              {!isNormal && (
                <div className="mt-3 text-sm text-slate-400 flex items-start gap-2 p-3 rounded-lg"
                  style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)" }}>
                  <span className="text-red-400 flex-shrink-0">⚠</span>
                  <span>
                    {{
                      DoS:   "Denial of Service attack. Can overwhelm and crash servers causing service outage.",
                      Probe: "Network scanning/reconnaissance. Attacker mapping your network topology.",
                      R2L:   "Remote-to-Local attack. Unauthorized access attempt to local machine from remote host.",
                      U2R:   "User-to-Root attack. Attacker attempting to escalate privileges to root/admin level.",
                    }[attackType] || "Suspicious traffic pattern detected."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-4 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}
    </div>
  )
}
