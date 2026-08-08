import { useState } from "react";
import { cases, sectors } from "./data";
import { Moon, Sun, Map, LayoutDashboard, FileText, Settings, Search, Download, ShieldCheck } from "lucide-react";

type Role = "User" | "Admin — SSL" | "Admin — Planning";
type LrmPage = "Dashboard" | "Map Intelligence" | "Cases" | "Sector Performance" | "Admin Center";

interface StatProps {
  label: string;
  value: string;
  suffix?: string;
}

function Stat({ label, value, suffix = "Ha" }: StatProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-suffix">{suffix}</div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [role, setRole] = useState<Role>("User");
  const [page, setPage] = useState<LrmPage>("Dashboard");

  return (
    <div className={dark ? "app dark" : "app light"}>
      <header className="topbar">
        <div>
          <div className="brand">LAND RECOVERY MONITORING</div>
          <div className="subtitle">Productive land recovery, occupation detection & claim progress</div>
        </div>
        <div className="top-actions">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option>User</option>
            <option>Admin — SSL</option>
            <option>Admin — Planning</option>
          </select>
          <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
        </div>
      </header>

      <aside className="sidebar">
        <button className={page === "Dashboard" ? "nav active" : "nav"} onClick={() => setPage("Dashboard")}><LayoutDashboard size={18}/> Dashboard</button>
        <button className={page === "Map Intelligence" ? "nav active" : "nav"} onClick={() => setPage("Map Intelligence")}><Map size={18}/> Map Intelligence</button>
        <button className={page === "Cases" ? "nav active" : "nav"} onClick={() => setPage("Cases")}><FileText size={18}/> Case Monitoring</button>
        <button className={page === "Sector Performance" ? "nav active" : "nav"} onClick={() => setPage("Sector Performance")}><ShieldCheck size={18}/> Sector Performance</button>
        {role !== "User" && (
          <button className={page === "Admin Center" ? "nav active" : "nav"} onClick={() => setPage("Admin Center")}><Settings size={18}/> Admin Center</button>
        )}
      </aside>

      <main className="content">
        {page === "Dashboard" && <>
          <div className="page-title">
            <div><h1>Executive Summary</h1><p>Monitoring status of productive land recovery and external occupation.</p></div>
            <button className="export"><Download size={16}/> Export Report</button>
          </div>
          <div className="stats-grid">
            <Stat label="Total Area" value="125,430.56"/>
            <Stat label="Plantable Area" value="78,642.35"/>
            <Stat label="Area Occupation" value="18,234.78"/>
            <Stat label="Area Recovered" value="12,840.42"/>
            <Stat label="In Progress" value="5,394.36"/>
            <Stat label="Ownership Rate" value="82.4" suffix="%"/>
          </div>
          <section className="panel">
            <div className="panel-head"><h2>Detection & Recovery Trend</h2><span>New digitization: PMS 3 · PMS 6 · HOA · PHI</span></div>
            <div className="chart">
              {[38,55,42,72,61,83,68,91,76,88,79,96].map((h,i)=><div key={i} className="bar-wrap"><div className="bar" style={{height:`${h}%`}}></div><small>{i+1}</small></div>)}
            </div>
          </section>
          <div className="two-col">
            <section className="panel">
              <div className="panel-head"><h2>Ownership Rate by Sector</h2></div>
              {sectors.map(s=><div className="sector-row" key={s.name}><span>{s.name}</span><span>{s.area} Ha</span><b className={s.ownership.toLowerCase()}>{s.ownership}</b></div>)}
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Latest Cases</h2><Search size={17}/></div>
              {cases.slice(0,3).map(c=><div className="case-row" key={c.id}><div><b>{c.id}</b><span>{c.sector} · {c.compartment} · {c.source}</span></div><b className={c.status.toLowerCase().replaceAll(" ","-")}>{c.status}</b></div>)}
            </section>
          </div>
        </>}

        {page === "Map Intelligence" && <MapPage />}
        {page === "Cases" && <CasesPage />}
        {page === "Sector Performance" && <SectorPage />}
        {page === "Admin Center" && <AdminPage role={role} />}
      </main>
    </div>
  );
}

function MapPage() {
  return <><div className="page-title"><div><h1>Map Intelligence</h1><p>Spatial view from satellite, drone and historical land-use detection.</p></div></div>
    <div className="map-layout">
      <div className="map-box">
        <div className="map-grid"></div>
        <div className="sector-label s1">SEKTOR 1</div><div className="sector-label s2">SEKTOR 2</div><div className="sector-label s3">SEKTOR 3</div>
        <div className="case-point p1"></div><div className="case-point p2"></div><div className="case-point p3"></div>
        <div className="map-legend"><b>Map Layers</b><label><input type="checkbox" defaultChecked/> Plantable Area</label><label><input type="checkbox" defaultChecked/> Lahan Okupasi</label><label><input type="checkbox" defaultChecked/> Compartment Boundary</label><label><input type="checkbox" defaultChecked/> Sector Boundary</label><label><input type="checkbox"/> Historical Landuse</label></div>
      </div>
      <div className="panel layer-panel"><h2>Basemap</h2><button className="layer-btn active">Satellite</button><button className="layer-btn">Drone</button><h2>Detection Source</h2><div className="source">PMS 3</div><div className="source">PMS 6</div><div className="source">HOA</div><div className="source">PHI</div><div className="source">Patrol Report</div></div>
    </div>
  </>;
}

function CasesPage() {
  return <><div className="page-title"><div><h1>Case Monitoring</h1><p>One case represents one occupation point with report date and coordinates.</p></div><button className="export"><Download size={16}/> Export Excel</button></div>
    <section className="panel table-panel"><table><thead><tr><th>Case ID</th><th>Report Date</th><th>Source</th><th>Sector</th><th>Compartment</th><th>Area (Ha)</th><th>Status</th></tr></thead><tbody>{cases.map(c=><tr key={c.id}><td><b>{c.id}</b></td><td>{c.date}</td><td>{c.source}</td><td>{c.sector}</td><td>{c.compartment}</td><td>{c.area}</td><td><span className={"pill "+c.status.toLowerCase().replaceAll(" ","-")}>{c.status}</span></td></tr>)}</tbody></table></section>
  </>;
}

function SectorPage() {
  return <><div className="page-title"><div><h1>Sector Performance</h1><p>Executive summary by sector with compartment-level analytical unit.</p></div></div>
    <div className="sector-cards">{sectors.map(s=><div className="panel sector-card" key={s.name}><h2>{s.name}</h2><div className="big-number">{s.area}</div><small>Ha total area</small><div className={"ownership "+s.ownership.toLowerCase()}>{s.ownership} Ownership</div><p>Claim & recovery monitoring can be drilled down to compartment.</p></div>)}</div>
  </>;
}

function AdminPage({ role }: { role: Role }) {
  return <><div className="page-title"><div><h1>Admin Center</h1><p>Data input and validation workflow for {role}.</p></div></div>
    <div className="admin-grid">
      <div className="panel"><h2>Planning Input</h2><p>Upload HOA / PMS 3 / PMS 6 / PHI aerial imagery and occupation digitization.</p><button className="primary">Add Digitization</button></div>
      <div className="panel"><h2>SSL Field Input</h2><p>Record patrol tracking, coordinates, evidence and validation results.</p><button className="primary">Add Field Report</button></div>
      <div className="panel"><h2>Claim Progress</h2><p>Update validation, claim resolution and land recovery progress.</p><button className="primary">Update Case</button></div>
    </div>
  </>;
}
