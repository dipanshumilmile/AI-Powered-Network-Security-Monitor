import { BrowserRouter, Routes, Route } from "react-router-dom"
import { IDSProvider } from "./context/IDSContext"
import Layout    from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import LiveTraffic from "./pages/LiveTraffic"
import Anomalies from "./pages/Anomalies"
import Predict   from "./pages/Predict"
import Reports   from "./pages/Reports"

export default function App() {
  return (
    <IDSProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index        element={<Dashboard />} />
            <Route path="traffic"   element={<LiveTraffic />} />
            <Route path="anomalies" element={<Anomalies />} />
            <Route path="predict"   element={<Predict />} />
            <Route path="reports"   element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </IDSProvider>
  )
}