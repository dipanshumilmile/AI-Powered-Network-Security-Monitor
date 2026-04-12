// Shared mock data generators & helpers used across pages

export const ATTACK_TYPES = ["DoS", "Probe", "R2L", "U2R"]
export const PROTOCOLS = ["tcp", "udp", "icmp"]
export const SERVICES = ["http","ftp","smtp","ssh","dns","https","pop_3","imap4","telnet","rdp","private"]

export const SEVERITY_MAP = {
  DoS:   { level: "HIGH",   badge: "badge-red",   color: "#ef4444", damage: "Can crash servers & cause complete service outage" },
  U2R:   { level: "CRITICAL", badge: "badge-dark-red", color: "#dc2626", damage: "Attacker gains root access — full system compromise" },
  R2L:   { level: "MEDIUM", badge: "badge-amber",  color: "#f59e0b", damage: "Unauthorized remote access to local machine" },
  Probe: { level: "LOW",    badge: "badge-yellow", color: "#eab308", damage: "Network reconnaissance — no direct damage" },
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randIP() {
  return `${randInt(1,254)}.${randInt(0,254)}.${randInt(0,254)}.${randInt(1,254)}`
}

export function randLocalIP() {
  return `192.168.${randInt(0,5)}.${randInt(1,254)}`
}

export function randEl(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function fmtBytes(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " MB"
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + " KB"
  return n + " B"
}

export function fmtTime(d = new Date()) {
  return d.toLocaleTimeString("en-GB", { hour12: false })
}

export function generatePacket(id) {
  const isAttack = Math.random() < 0.28
  const type     = isAttack ? randEl(ATTACK_TYPES) : "Normal"
  return {
    id,
    time:     fmtTime(),
    src_ip:   isAttack ? randIP() : randLocalIP(),
    dst_ip:   randLocalIP(),
    protocol: randEl(PROTOCOLS).toUpperCase(),
    service:  randEl(SERVICES),
    src_bytes: randInt(40, 150000),
    dst_bytes: randInt(20, 80000),
    category:  isAttack ? "ATTACK" : "NORMAL",
    type,
    confidence: +(Math.random() * 0.3 + 0.7).toFixed(4),
    port: randInt(1, 65535),
    flag: randEl(["SF","S0","RSTO","OTH","S1"]),
  }
}
