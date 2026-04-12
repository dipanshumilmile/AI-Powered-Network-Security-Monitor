import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { io } from "socket.io-client"
import { generatePacket } from "../utils"

const IDSContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const INIT_STATS = { total_packets:0, total_alerts:0, packets_per_sec:0, active_flows:0, uptime_seconds:0 }
const INIT_COUNTS = { Normal:0, DoS:0, Probe:0, R2L:0, U2R:0 }

export function IDSProvider({ children }) {
  const [connected,   setConnected]   = useState(false)
  const [stats,       setStats]       = useState(INIT_STATS)
  const [classCounts, setClassCounts] = useState(INIT_COUNTS)
  const [timeline,    setTimeline]    = useState([])
  const [alerts,      setAlerts]      = useState([])
  const [packets,     setPackets]     = useState([])
  const packetIdRef = useRef(1000)

  const addAlert  = useCallback(a => setAlerts(p => [a, ...p].slice(0, 300)), [])
  const addPacket = useCallback(p => setPackets(prev => [p, ...prev].slice(0, 500)), [])

  /* -- Socket connection -- */
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket","polling"],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
    socket.on("connect",    () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    socket.on("stats_update", data => {
      setStats(data.stats)
      setClassCounts(data.class_counts)
      setTimeline(data.timeline || [])
    })
    socket.on("new_alert", alert => {
      addAlert(alert)
      addPacket({ ...alert, category: "ATTACK", type: alert.type })
    })
    return () => socket.disconnect()
  }, [addAlert, addPacket])

  /* -- Simulate packets if backend doesn't emit flows -- */
  useEffect(() => {
    const id = setInterval(() => {
      const pkt = generatePacket(packetIdRef.current++)
      addPacket(pkt)
      if (pkt.category === "ATTACK") {
        addAlert({
          id: pkt.id,
          time: pkt.time,
          timestamp: new Date().toISOString(),
          type: pkt.type,
          src_ip: pkt.src_ip,
          dst_ip: pkt.dst_ip,
          service: pkt.service,
          protocol: pkt.protocol.toLowerCase(),
          src_bytes: pkt.src_bytes,
          dst_bytes: pkt.dst_bytes,
          confidence: pkt.confidence,
          color: { DoS:"#ef4444", Probe:"#3b82f6", R2L:"#f59e0b", U2R:"#ec4899" }[pkt.type] || "#888",
        })
      }
    }, 1800)
    return () => clearInterval(id)
  }, [addPacket, addAlert])

  /* Compute critical count (U2R + R2L) */
  const criticalCount = (classCounts.U2R || 0) + (classCounts.R2L || 0)
  const attackCount   = (classCounts.DoS || 0) + (classCounts.Probe || 0) + (classCounts.R2L || 0) + (classCounts.U2R || 0)

  return (
    <IDSContext.Provider value={{
      connected, stats, classCounts, timeline, alerts, packets,
      criticalCount, attackCount,
    }}>
      {children}
    </IDSContext.Provider>
  )
}

export const useIDS = () => useContext(IDSContext)
