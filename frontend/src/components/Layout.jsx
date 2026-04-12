import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background:"var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
