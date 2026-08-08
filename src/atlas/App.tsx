import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import type { Layer, LayerGroup, Map as LeafletMap } from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import shp from "shpjs";

type LayerKey =
  | "boundary"
  | "biodiversity"
  | "patrol"
  | "assets"
  | "fire"
  | "environment"
  | "wildlife";

type Dashboard = {
  name: string;
  eyebrow: string;
  description: string;
  featured?: boolean;
};

type NavKey = "data" | "topics" | "learn" | "centers" | "engage" | "about" | "news";

type MegaMenuItem = {
  label: string;
  description: string;
  href: string;
};

type MegaMenuColumn = {
  title: string;
  intro?: string;
  accent?: boolean;
  latestNews?: boolean;
  items: MegaMenuItem[];
};

type NavMenu = {
  key: NavKey;
  label: string;
  columns: MegaMenuColumn[];
};

type NewsArticle = {
  title: string;
  summary: string;
  category: string;
  image: string;
  imageAlt: string;
  placeholder: string;
  className: string;
};

type AssetImageProps = {
  src: string;
  alt: string;
  placeholder: string;
  className?: string;
};

type ShpFeatureCollection = FeatureCollection & {
  fileName?: string;
};

const publicPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const assetPaths = {
  logo: publicPath("assets/images/atlas-logo.png"),
  searchIcon: publicPath("assets/icons/search-icon.png"),
  arrowIcon: publicPath("assets/icons/arrow-icon.png"),
  hotspotIcon: publicPath("assets/map/hotspot-icon.png"),
  forest: publicPath("assets/images/news-forest-protection.png"),
  fire: publicPath("assets/images/news-fire-monitoring.png"),
  drone: publicPath("assets/images/news-drone-optimization.png"),
  research: publicPath("assets/images/news-research-development.png"),
  patrol02: publicPath("assets/images/unit-patroli-02.png"),
  patrol03: publicPath("assets/images/unit-patroli-03.png"),
  wildlifeObservation: publicPath("assets/images/wildlife-observation-01.png"),
};

const layerMeta: Array<{
  key: LayerKey;
  label: string;
  description: string;
  color: string;
}> = [
  { key: "boundary", label: "Sepaku Admin", description: "Batas administratif dari SHP", color: "#2b2b2b" },
  { key: "biodiversity", label: "HTI Compartments", description: "9 polygon kompartemen/wilayah dari SHP", color: "#3f8e55" },
  { key: "patrol", label: "Jalan Sepaku", description: "8.227 segmen jalan dari SHP", color: "#d79a24" },
  { key: "assets", label: "Asset Locations", description: "Aset dan titik fasilitas", color: "#d66b2b" },
  { key: "fire", label: "Fire Hotspots", description: "Titik kejadian kebakaran", color: "#dd3b35" },
  { key: "environment", label: "Environment Points", description: "Kualitas air dan udara", color: "#2d79a7" },
  { key: "wildlife", label: "Wildlife Observation", description: "Observasi satwa liar", color: "#7654a9" },
];

const dashboards: Dashboard[] = [
  {
    name: "SIGMA",
    eyebrow: "Operational Monitoring",
    description: "Sebaran aset, alat berat, pupuk, dan plantation village.",
  },
  {
    name: "E-Biodash",
    eyebrow: "Biodiversity & Environment",
    description: "Biodiversity, wildlife, dan pemantauan lingkungan.",
  },
  {
    name: "[DAS]Board",
    eyebrow: "Watershed Monitoring",
    description: "Watershed, river flow, waterpool, dan catchment area.",
  },
  {
    name: "Firehawk",
    eyebrow: "Fire Hotspot Monitoring System",
    description: "Hotspot, forest fire, dan data cuaca lapangan.",
  },
  {
    name: "E-NVRO",
    eyebrow: "Environment Monitoring System",
    description: "Plot vegetasi dan area yang tidak boleh ditebang.",
  },
  {
    name: "LRM",
    eyebrow: "Land Recovery Monitoring",
    description: "Tata batas areal HTI dan monitoring pemulihan lahan.",
  },
  {
    name: "INSIGHT K3",
    eyebrow: "Health, Safety & Environment",
    description: "Monitoring keselamatan kerja, incident, near miss, dan tindak lanjut K3.",
    featured: true,
  },
];

const news: NewsArticle[] = [
  {
    title: "Forest Protection",
    summary: "Perlindungan areal hutan dan ekosistemnya",
    category: "Conservation",
    image: assetPaths.forest,
    imageAlt: "Foto kegiatan perlindungan hutan",
    placeholder: "Foto Forest Protection",
    className: "news-feature",
  },
  {
    title: "Fire Monitoring",
    summary: "Pemantauan risiko kebakaran berbasis data",
    category: "Firehawk",
    image: assetPaths.fire,
    imageAlt: "Foto monitoring kebakaran",
    placeholder: "Foto Fire Monitoring",
    className: "news-tall",
  },
  {
    title: "Drone Optimization",
    summary: "Akuisisi data udara untuk operasi yang lebih cepat",
    category: "Technology",
    image: assetPaths.drone,
    imageAlt: "Foto kegiatan drone",
    placeholder: "Foto Drone Optimization",
    className: "news-small",
  },
  {
    title: "Research and Development",
    summary: "Riset dan inovasi untuk pengelolaan lanskap",
    category: "Innovation",
    image: assetPaths.research,
    imageAlt: "Foto kegiatan riset dan pengembangan",
    placeholder: "Foto Research & Development",
    className: "news-small",
  },
];

const navMenus: NavMenu[] = [
  {
    key: "data",
    label: "Data",
    columns: [
      {
        title: "Data",
        accent: true,
        items: [
          { label: "Data Catalog", description: "Browse the monitoring datasets available in ATLAS.", href: "#global-search" },
          { label: "Data Alerts and Outages", description: "Check data availability and service status.", href: "#global-search" },
          { label: "Projects", description: "Explore OneMap Phase 1 monitoring functions.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Observation Methods",
        items: [
          { label: "Platforms", description: "ATLAS Webmap and connected domain dashboards.", href: "#dashboard-catalog" },
          { label: "Field Operations", description: "Operational observations collected across the landscape.", href: "#top" },
          { label: "Remote Sensing & UAV", description: "Aerial data acquisition for mapping and verification.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Data Tools",
        accent: true,
        items: [
          { label: "Search ATLAS", description: "Find datasets, dashboards, topics, and more.", href: "#global-search" },
          { label: "Map Layers", description: "Turn Phase 1 monitoring layers on or off.", href: "#top" },
          { label: "Dashboard Directory", description: "Move from discovery to focused analysis.", href: "#dashboard-catalog" },
        ],
      },
    ],
  },
  {
    key: "topics",
    label: "Topics",
    columns: [
      {
        title: "Topics",
        accent: true,
        items: [
          { label: "Forest", description: "Vegetation, boundaries, biodiversity, and protection.", href: "#dashboard-catalog" },
          { label: "Water", description: "Catchment, river flow, waterpool, and wetness areas.", href: "#dashboard-catalog" },
          { label: "Environment", description: "Air quality, water quality, wildlife, and field observations.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Risk & Response",
        items: [
          { label: "Fire Monitoring", description: "Hotspot and forest fire monitoring through Firehawk.", href: "#dashboard-catalog" },
          { label: "Incident & Near Miss", description: "Capture operational events and follow-up actions.", href: "#dashboard-catalog" },
          { label: "Weather", description: "Use current weather context for field decisions.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Landscape Operations",
        items: [
          { label: "Assets", description: "Locate equipment, materials, facilities, and patrol units.", href: "#dashboard-catalog" },
          { label: "Plantation Village", description: "Monitor camps and workforce support locations.", href: "#dashboard-catalog" },
          { label: "Land Recovery", description: "Track HTI boundaries and recovery monitoring.", href: "#dashboard-catalog" },
        ],
      },
    ],
  },
  {
    key: "learn",
    label: "Learn",
    columns: [
      {
        title: "Learn ATLAS",
        accent: true,
        items: [
          { label: "Guides", description: "Start with the core workflows and map controls.", href: "#top" },
          { label: "Data in Action", description: "See how monitoring data supports daily decisions.", href: "#atlas-news" },
          { label: "ATLAS Basics", description: "Understand the OneMap Phase 1 structure.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Ways to Use ATLAS",
        items: [
          { label: "Management Review", description: "Use one current view for landscape oversight.", href: "#top" },
          { label: "Field Verification", description: "Move from a map signal to a field response.", href: "#top" },
          { label: "Incident Response", description: "Connect events, locations, and follow-up actions.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Resources",
        items: [
          { label: "Glossary", description: "Common ATLAS and monitoring terms.", href: "#dashboard-catalog" },
          { label: "FAQs", description: "Answers for users working with the local portal.", href: "#dashboard-catalog" },
          { label: "Training Notes", description: "Practical notes for onboarding and refreshers.", href: "#atlas-news" },
        ],
      },
    ],
  },
  {
    key: "centers",
    label: "Centers",
    columns: [
      {
        title: "Centers",
        accent: true,
        items: [
          { label: "Main Office", description: "Central coordination point for ATLAS operations.", href: "#top" },
          { label: "Field Operations", description: "Operational locations and patrol support.", href: "#top" },
          { label: "Environment", description: "Stations and observations for environmental monitoring.", href: "#top" },
        ],
      },
      {
        title: "Operational Coordination",
        items: [
          { label: "Planning", description: "Connect monitoring outputs to planning activity.", href: "#dashboard-catalog" },
          { label: "UAV", description: "Coordinate aerial survey and asset information.", href: "#dashboard-catalog" },
          { label: "Fire Response", description: "Keep hotspot signals close to field action.", href: "#dashboard-catalog" },
        ],
      },
      {
        title: "Access",
        items: [
          { label: "Contact", description: "Send a question or request to the ATLAS owner.", href: "#top" },
          { label: "Local Server", description: "Run the portal inside the local network.", href: "#top" },
          { label: "Asset Guide", description: "Add owner-provided logos, icons, and photos.", href: "#top" },
        ],
      },
    ],
  },
  {
    key: "engage",
    label: "Engage",
    columns: [
      {
        title: "Engage",
        accent: true,
        items: [
          { label: "Open Data", description: "Understand how ATLAS data can be shared and used.", href: "#global-search" },
          { label: "Contact", description: "Connect with the team responsible for the portal.", href: "#top" },
          { label: "Feedback", description: "Suggest a useful improvement for the next phase.", href: "#top" },
        ],
      },
      {
        title: "Work with the Data",
        items: [
          { label: "Data Request", description: "Describe the information needed for a decision.", href: "#global-search" },
          { label: "Share Field Data", description: "Bring verified observations back into the system.", href: "#dashboard-catalog" },
          { label: "Report an Issue", description: "Flag an outage, mismatch, or data quality concern.", href: "#global-search" },
        ],
      },
      {
        title: "Community",
        items: [
          { label: "Training", description: "Build shared confidence in the ATLAS workflow.", href: "#atlas-news" },
          { label: "News & Updates", description: "Follow current notes from the monitoring landscape.", href: "#atlas-news" },
          { label: "Partnerships", description: "Coordinate across functions and operating areas.", href: "#top" },
        ],
      },
    ],
  },
  {
    key: "about",
    label: "About",
    columns: [
      {
        title: "About ATLAS",
        accent: true,
        items: [
          { label: "About ATLAS", description: "A map-first portal for one current view of the landscape.", href: "#top" },
          { label: "Phase 1", description: "The first set of monitoring functions in OneMap.", href: "#dashboard-catalog" },
          { label: "Data Governance", description: "Keep ownership, source, and update context visible.", href: "#top" },
        ],
      },
      {
        title: "Why It Matters",
        items: [
          { label: "One Source of Truth", description: "Bring operational and environmental context together.", href: "#top" },
          { label: "Data-Driven Decisions", description: "Make current evidence easier to review and act on.", href: "#dashboard-catalog" },
          { label: "Landscape Intelligence", description: "Connect field signals to management perspective.", href: "#top" },
        ],
      },
      {
        title: "Project Context",
        items: [
          { label: "OneMap", description: "The wider initiative behind the ATLAS monitoring portal.", href: "#top" },
          { label: "Local Deployment", description: "Designed to run on the organization’s own server.", href: "#top" },
          { label: "Roadmap", description: "A foundation for future monitoring phases.", href: "#top" },
        ],
      },
    ],
  },
  {
    key: "news",
    label: "News & Events",
    columns: [
      {
        title: "News",
        items: [
          { label: "News", description: "View the latest updates from ATLAS.", href: "#atlas-news" },
          { label: "Events", description: "Follow training, reviews, and field sessions.", href: "#atlas-news" },
          { label: "Field Notes", description: "Read practical notes from the monitoring landscape.", href: "#atlas-news" },
        ],
      },
      {
        title: "Feature Articles",
        items: [
          { label: "Forest Protection", description: "Protection of forest areas and their ecosystems.", href: "#atlas-news" },
          { label: "Fire Monitoring", description: "Data-driven monitoring of fire risk and hotspots.", href: "#atlas-news" },
          { label: "Drone Optimization", description: "Faster aerial data acquisition for operations.", href: "#atlas-news" },
        ],
      },
      {
        title: "Latest News",
        latestNews: true,
        items: [],
      },
    ],
  },
];

const defaultLayerVisibility: Record<LayerKey, boolean> = {
  boundary: true,
  biodiversity: true,
  patrol: true,
  assets: true,
  fire: true,
  environment: true,
  wildlife: true,
};

function AssetImage({ src, alt, placeholder, className = "" }: AssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`asset-placeholder ${className}`} role="img" aria-label={`${alt} — asset belum diisi`}>
        <span>{placeholder}</span>
      </span>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function ChevronIcon() {
  return <span className="chevron-glyph" aria-hidden="true" />;
}

function MegaMenuLink({ item, onClose }: { item: MegaMenuItem; onClose: () => void }) {
  return (
    <a className="mega-menu-link" href={item.href} onClick={onClose}>
      <span>
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </span>
    </a>
  );
}

function MegaMenu({ menu, onClose }: { menu: NavMenu; onClose: () => void }) {
  return (
    <div id={`mega-menu-${menu.key}`} className={`mega-menu mega-menu-${menu.key}`} role="region" aria-label={`${menu.label} menu`}>
      <div className="mega-menu-inner">
        {menu.columns.map((column) => (
          <section className={`mega-column${column.latestNews ? " mega-column-latest" : ""}`} key={column.title}>
            <div className="mega-column-heading">
              <h2>{column.title}</h2>
            </div>
            {column.intro && <p className="mega-column-intro">{column.intro}</p>}
            {column.latestNews ? (
              <div className="mega-latest-news">
                {news.slice(0, 2).map((article) => (
                  <a className="mega-news-card" href="#atlas-news" onClick={onClose} key={article.title}>
                    <AssetImage src={article.image} alt={article.imageAlt} placeholder={article.placeholder} className="mega-news-image" />
                    <span className="mega-news-copy">
                      <small>ATLAS NEWS</small>
                      <strong>{article.title}</strong>
                      <span>{article.category} · Latest update</span>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="mega-menu-items">
                {column.items.map((item) => <MegaMenuLink item={item} onClose={onClose} key={item.label} />)}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <span className="brand">
      <span className="brand-logo-frame">
        <AssetImage
          src={assetPaths.logo}
          alt="Logo ATLAS"
          placeholder="LOGO"
          className="brand-logo"
        />
      </span>
      <span className="brand-copy">
        <strong>ATLAS</strong>
        <small>Webmap</small>
      </span>
    </span>
  );
}

function popupMarkup(
  title: string,
  body: string,
  meta?: string,
  photo?: { src: string; label: string },
) {
  const photoMarkup = photo
    ? `<div class="popup-photo-frame"><img src="${photo.src}" alt="" onerror="this.style.display='none'"><span>${photo.label}</span></div>`
    : "";

  return `<div class="atlas-popup-content">${photoMarkup}<span class="popup-kicker">ATLAS MONITORING</span><strong>${title}</strong><p>${body}</p>${meta ? `<small>${meta}</small>` : ""}</div>`;
}

function hotspotPopupMarkup() {
  return `<div class="hotspot-popup-content">
    <div class="hotspot-popup-header">HOTSPOT INFORMATION</div>
    <div class="hotspot-popup-section">
      <div class="hotspot-row"><span>Estate:</span><strong>Terunen</strong></div>
      <div class="hotspot-row"><span>Compartment:</span><strong>A001</strong></div>
      <div class="hotspot-row"><span>Latitude:</span><strong>-0.845621</strong></div>
      <div class="hotspot-row"><span>Longitude:</span><strong>116.982475</strong></div>
      <div class="hotspot-row"><span>Detected Temperature:</span><strong class="hotspot-value-warning">48.7°C</strong></div>
      <div class="hotspot-row"><span>Detection Time:</span><strong>28 June 2026, 10:42 WITA</strong></div>
      <div class="hotspot-row"><span>Hotspot Confidence:</span><strong class="hotspot-value-success">92%</strong></div>
    </div>
    <div class="hotspot-popup-section">
      <div class="hotspot-row"><span>Nearest Estate Post:</span><strong>Terunen Estate Office</strong></div>
      <div class="hotspot-row"><span>Distance to Estate Post:</span><strong>8.4 km</strong></div>
      <div class="hotspot-row"><span>Estimated Travel Time:</span><strong>18 minutes</strong></div>
    </div>
    <div class="hotspot-popup-section">
      <div class="hotspot-row"><span>Nearest Water Source:</span><strong>—</strong></div>
      <div class="hotspot-row"><span>Distance to Water Source:</span><strong>—</strong></div>
    </div>
    <div class="hotspot-popup-section">
      <div class="hotspot-row"><span>Wind Direction:</span><strong>Southeast to Northwest</strong></div>
      <div class="hotspot-row"><span>Wind Speed:</span><strong>14 km/h</strong></div>
    </div>
    <div class="hotspot-popup-section hotspot-popup-section-last">
      <div class="hotspot-row"><span>Response Status:</span><strong class="hotspot-value-status">Verification Required</strong></div>
    </div>
  </div>`;
}

function wildlifePopupMarkup() {
  const photoMarkup = `<div class="popup-photo-frame wildlife-photo-frame"><img src="${assetPaths.wildlifeObservation}" alt="Foto observasi wildlife" onerror="this.style.display='none'"><span>Foto Wildlife Observation</span></div>`;

  return `<div class="wildlife-popup-content">
    ${photoMarkup}
    <span class="popup-kicker">WILDLIFE OBSERVATION</span>
    <strong>Orangutan Kalimantan</strong>
    <p>Observasi satwa liar di sekitar koridor habitat dan zona biodiversitas prioritas.</p>
    <div class="popup-detail-grid">
      <div class="popup-detail-row"><span>Nama ilmiah</span><strong>Pongo pygmaeus</strong></div>
      <div class="popup-detail-row"><span>Metode deteksi</span><strong>Trap Camera</strong></div>
      <div class="popup-detail-row"><span>Camera ID</span><strong>TC-WL-003</strong></div>
      <div class="popup-detail-row"><span>Waktu temuan</span><strong>05 Aug 2026, 06:18 WITA</strong></div>
      <div class="popup-detail-row"><span>Confidence</span><strong class="wildlife-confidence">94%</strong></div>
    </div>
    <small>Foto tangkapan: Trap Camera · E-Biodash</small>
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function featureProperty(feature: Feature, ...keys: string[]) {
  const properties = feature.properties as Record<string, unknown> | null;
  for (const key of keys) {
    const value = properties?.[key];
    if (value === undefined || value === null || (typeof value === "number" && Number.isNaN(value))) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function shpPopup(
  dataset: string,
  feature: Feature,
  fallbackTitle: string,
  description: string,
) {
  const title = featureProperty(feature, "NAMOBJ", "WADMKD", "REMARK") || fallbackTitle;
  const objectId = featureProperty(feature, "OBJECTID");
  const admin = featureProperty(feature, "WADMKC", "WADMKK");
  const area = featureProperty(feature, "luas", "SHAPE_Area");
  const metaParts = [`SHP · ${dataset}`];
  if (objectId) metaParts.push(`OBJECTID ${objectId}`);
  if (admin) metaParts.push(admin);
  if (area) metaParts.push(`Area ${area}`);

  return popupMarkup(
    escapeHtml(title),
    escapeHtml(description),
    escapeHtml(metaParts.join(" · ")),
  );
}

async function loadShpData() {
  const response = await fetch(publicPath("assets/data/DataSHP.zip"));
  if (!response.ok) throw new Error(`DataSHP.zip request failed: ${response.status}`);

  const parsed = await shp(await response.arrayBuffer());
  const collections = (Array.isArray(parsed) ? parsed : [parsed]) as ShpFeatureCollection[];
  return new Map(collections.map((collection) => [collection.fileName ?? "", collection]));
}

function App() {
  const navigate = useNavigate();
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const topSearchInputRef = useRef<HTMLInputElement | null>(null);
  const layerGroupsRef = useRef<Partial<Record<LayerKey, LayerGroup>>>({});
  const alertPointsRef = useRef<Array<{ layerKey: LayerKey; latLng: [number, number]; layer: Layer }>>([]);
  const refreshAlertClustersRef = useRef<(() => void) | null>(null);
  const [activeNav, setActiveNav] = useState<NavKey | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState(defaultLayerVisibility);
  const [query, setQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [toast, setToast] = useState("");
  const layerVisibilityRef = useRef(layerVisibility);

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;

    const initializeMap = async () => {
      try {
        const L = await import("leaflet");
        if (disposed || !mapNode.current) return;

        const mapMaxZoom = 17;

        map = L.map(mapNode.current, {
          zoomControl: false,
          zoomAnimation: true,
          fadeAnimation: true,
          minZoom: 9,
          maxZoom: mapMaxZoom,
        }).setView([-0.790036, 116.727178], 11);

        L.control.zoom({ position: "topright" }).addTo(map);
        L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

        const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        const attribution = import.meta.env.VITE_MAP_ATTRIBUTION ||
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

        L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution,
        }).addTo(map);

        const shpData = await loadShpData();
        if (disposed) return;

        const marker = (label: string, markerClass: string, imageSrc?: string) => {
          const imageMarkup = imageSrc
            ? `<img class="marker-image" src="${imageSrc}" alt="" onerror="this.remove();this.nextElementSibling.hidden=false">`
            : "";
          const fallbackMarkup = `<span class="marker-fallback"${imageSrc ? " hidden" : ""}>${label}</span>`;

          return L.divIcon({
            className: "atlas-marker-shell",
            html: `<span class="atlas-marker ${markerClass}">${imageMarkup}${fallbackMarkup}</span>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -17],
          });
        };

        const popupOptions = {
          className: "atlas-popup",
          maxWidth: 320,
          minWidth: 320,
        };

        const hotspotPopupOptions = {
          className: "hotspot-popup",
          maxWidth: 292,
          minWidth: 292,
        };

        const alertPoints: Array<{ layerKey: LayerKey; latLng: [number, number]; layer: Layer }> = [];
        const addAlertPoint = (layerKey: LayerKey, latLng: [number, number], layer: Layer) => {
          alertPoints.push({ layerKey, latLng, layer });
          return layer;
        };

        const boundary = L.layerGroup();
        const adminData = shpData.get("Sepaku Admin");
        if (adminData) {
          const adminLayer = L.geoJSON(adminData, {
            style: {
              color: "#242424",
              weight: 2,
              dashArray: "8 7",
              fill: false,
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(
                shpPopup("Sepaku Admin", feature, "Sepaku Administrative Boundary", "Batas administratif Kecamatan Sepaku dari data SHP yang dikirimkan."),
                popupOptions,
              );
            },
          });
          boundary.addLayer(adminLayer);
        }

        const biodiversity = L.layerGroup();
        const compartmentData = shpData.get("IHM Sepaku HTI-per kompartemen");
        if (compartmentData) {
          const compartmentLayer = L.geoJSON(compartmentData, {
            style: {
              color: "#3f8e55",
              weight: 1.5,
              fillColor: "#72b979",
              fillOpacity: 0.2,
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(
                shpPopup("IHM Sepaku HTI-per kompartemen", feature, "HTI Compartment", "Polygon wilayah/kompartemen dari data SHP IHM Sepaku."),
                popupOptions,
              );
            },
          });
          biodiversity.addLayer(compartmentLayer);
        }

        const patrol = L.layerGroup();
        const roadData = shpData.get("Jalan_Sepaku");
        if (roadData) {
          const roadLayer = L.geoJSON(roadData, {
            style: {
              color: "#d79a24",
              weight: 1.3,
              opacity: 0.72,
              lineCap: "round",
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(
                shpPopup("Jalan_Sepaku", feature, "Sepaku Road Segment", "Segmen jaringan jalan dari data SHP Jalan_Sepaku."),
                popupOptions,
              );
            },
          });
          patrol.addLayer(roadLayer);
        }

        const alertMarker = (layerKey: LayerKey, latLng: [number, number], icon: ReturnType<typeof marker>, content: string) =>
          addAlertPoint(layerKey, latLng, L.marker(latLng, { icon }).bindPopup(content, popupOptions));

        const assets = L.layerGroup([
          alertMarker("assets", [-0.938011, 116.690316], marker("MO", "marker-office"), popupMarkup("Main Office", "Pusat koordinasi operasional ATLAS.", "Asset Location · -0.938011, 116.690316")),
          alertMarker("assets", [-0.943483, 116.713414], marker("W", "marker-water"), popupMarkup("Water Point 1", "Titik fasilitas air untuk dukungan operasi lapangan.", "SIGMA · Facility point")),
          alertMarker("assets", [-0.938202, 116.688833], marker("01", "marker-asset"), popupMarkup("Unit Patroli 01", "Unit patroli aktif di sekitar Main Office.", "SIGMA · Patrol asset")),
          alertMarker("assets", [-0.936106, 116.689226], marker("02", "marker-asset"), popupMarkup("Unit Patroli 02", "Unit patroli lapangan. Masukkan foto aset pada folder assets/images.", "SIGMA · Patrol asset", { src: assetPaths.patrol02, label: "Foto Unit Patroli 02" })),
          alertMarker("assets", [-0.93619, 116.689163], marker("03", "marker-asset"), popupMarkup("Unit Patroli 03", "Unit patroli lapangan. Masukkan foto aset pada folder assets/images.", "SIGMA · Patrol asset", { src: assetPaths.patrol03, label: "Foto Unit Patroli 03" })),
        ]);

        const fire = L.layerGroup([
          addAlertPoint("fire", [-0.754, 116.738], L.marker([-0.754, 116.738], { icon: marker("!", "marker-fire marker-pulse", assetPaths.hotspotIcon) }).bindPopup(hotspotPopupMarkup(), hotspotPopupOptions)),
          addAlertPoint("fire", [-0.806, 116.802], L.marker([-0.806, 116.802], { icon: marker("!", "marker-fire marker-pulse", assetPaths.hotspotIcon) }).bindPopup(hotspotPopupMarkup(), hotspotPopupOptions)),
        ]);

        const environment = L.layerGroup([
          alertMarker("environment", [-0.866893, 116.743193], marker("AQ", "marker-environment"), popupMarkup("Stasiun Kualitas Udara", "Titik pengukuran kualitas udara lingkungan.", "E-NVRO · -0.866893, 116.743193")),
          alertMarker("environment", [-0.961186, 116.718129], marker("WQ", "marker-environment"), popupMarkup("Stasiun Kualitas Air", "Titik pengukuran kualitas air lingkungan.", "E-NVRO · -0.961186, 116.718129")),
        ]);

        const wildlifePoint = L.circleMarker([-0.735, 116.69], {
            radius: 8,
            color: "#7654a9",
            weight: 3,
            fillColor: "#a88cdb",
            fillOpacity: 0.9,
          }).bindPopup(
            wildlifePopupMarkup(),
            popupOptions,
          );
        addAlertPoint("wildlife", [-0.735, 116.69], wildlifePoint);
        const wildlife = L.layerGroup([wildlifePoint]);

        const clusterIcon = (count: number) => L.divIcon({
          className: "atlas-cluster-shell",
          html: `<span class="atlas-alert-cluster"><span>(+${count})</span></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const alertClusterLayer = L.layerGroup().addTo(map as LeafletMap);
        const refreshAlertClusters = () => {
          alertClusterLayer.clearLayers();
          const visiblePoints = alertPoints.filter(({ layerKey }) => layerVisibilityRef.current[layerKey]);
          const zoom = map?.getZoom() ?? 11;

          // At the highest map zoom every alert must be rendered individually.
          // Otherwise nearby points such as Patrol Unit 02/03 remain trapped in
          // a (+2) cluster with no individual popup available.
          if (zoom >= mapMaxZoom) {
            visiblePoints.forEach(({ layer }) => alertClusterLayer.addLayer(layer));
            return;
          }

          // Keep the last pre-max zoom readable while allowing the next zoom
          // step to reveal the individual points.
          const clusterRadius = zoom >= mapMaxZoom - 1 ? 6 : zoom >= 14 ? 36 : zoom >= 13 ? 50 : zoom >= 12 ? 64 : 78;
          const clusters: Array<Array<{ layerKey: LayerKey; latLng: [number, number]; layer: Layer }>> = [];

          visiblePoints.forEach((point) => {
            const pointPx = map?.project(point.latLng, zoom);
            if (!pointPx) return;
            const matchingCluster = clusters.find((cluster) => {
              const centerPx = cluster.reduce(
                (center, item) => {
                  const projected = map?.project(item.latLng, zoom);
                  return projected ? { x: center.x + projected.x, y: center.y + projected.y } : center;
                },
                { x: 0, y: 0 },
              );
              const centerX = centerPx.x / cluster.length;
              const centerY = centerPx.y / cluster.length;
              return Math.hypot(pointPx.x - centerX, pointPx.y - centerY) <= clusterRadius;
            });
            if (matchingCluster) matchingCluster.push(point);
            else clusters.push([point]);
          });

          clusters.forEach((cluster) => {
            if (cluster.length === 1) {
              alertClusterLayer.addLayer(cluster[0].layer);
              return;
            }

            const bounds = L.latLngBounds(cluster.map(({ latLng }) => latLng));
            const clusterMarker = L.marker(bounds.getCenter(), {
              icon: clusterIcon(cluster.length),
              title: `${cluster.length} alerts`,
            });
            clusterMarker.on("click", () => {
              map?.fitBounds(bounds.pad(0.35), { maxZoom: mapMaxZoom, animate: true });
            });
            clusterMarker.bindTooltip(`${cluster.length} alerts`, { direction: "top", offset: [0, -19] });
            alertClusterLayer.addLayer(clusterMarker);
          });
        };

        alertPointsRef.current = alertPoints;
        refreshAlertClustersRef.current = refreshAlertClusters;
        map.on("zoomend", refreshAlertClusters);
        refreshAlertClusters();

        layerGroupsRef.current = { boundary, biodiversity, patrol, assets, fire, environment, wildlife };
        const clusteredLayerKeys = new Set<LayerKey>(["assets", "fire", "environment", "wildlife"]);
        (Object.entries(layerGroupsRef.current) as Array<[LayerKey, LayerGroup | undefined]>).forEach(([key, layer]) => {
          if (clusteredLayerKeys.has(key)) return;
          if (layer && defaultLayerVisibility[key]) layer.addTo(map as LeafletMap);
        });

        mapRef.current = map;
        setMapReady(true);
        window.setTimeout(() => map?.invalidateSize(), 250);
      } catch {
        if (!disposed) setMapError(true);
      }
    };

    void initializeMap();

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
      layerGroupsRef.current = {};
      alertPointsRef.current = [];
      refreshAlertClustersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (activeNav === null && !isSearchOpen) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveNav(null);
        setIsSearchOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveNav(null);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeNav, isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) topSearchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
    const map = mapRef.current;
    if (!map) return;

    const clusteredLayerKeys = new Set<LayerKey>(["assets", "fire", "environment", "wildlife"]);
    (Object.entries(layerVisibility) as Array<[LayerKey, boolean]>).forEach(([key, isVisible]) => {
      if (clusteredLayerKeys.has(key)) return;
      const layer = layerGroupsRef.current[key];
      if (!layer) return;
      if (isVisible && !map.hasLayer(layer)) layer.addTo(map);
      if (!isVisible && map.hasLayer(layer)) map.removeLayer(layer);
    });
    refreshAlertClustersRef.current?.();
  }, [layerVisibility]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredDashboards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return dashboards;
    return dashboards.filter((dashboard) =>
      [dashboard.name, dashboard.eyebrow, dashboard.description].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);

  const filteredNews = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return news;
    return news.filter((article) =>
      [article.title, article.summary, article.category].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);

  const showToast = (message: string) => setToast(message);

  const handleSearch = () => {
    const target = document.getElementById("dashboard-catalog");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!query.trim()) showToast("Masukkan kata kunci atau pilih domain monitoring.");
  };

  const handleDashboardClick = (dashboard: Dashboard) => {
    if (dashboard.name === "SIGMA") {
      navigate("/sigma");
      return;
    }
    showToast(`${dashboard.name} siap dihubungkan ke dashboard detail.`);
  };

  const toggleNav = (key: NavKey) => {
    setIsSearchOpen(false);
    setActiveNav((current) => current === key ? null : key);
  };

  const toggleSearch = () => {
    setActiveNav(null);
    setIsSearchOpen((current) => !current);
  };

  return (
    <main className="atlas-site">
      <header ref={headerRef} className="topbar">
        <a className="brand-link" href="#top" aria-label="ATLAS Webmap home">
          <Brand />
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navMenus.map((menu) => (
            <div className={`nav-item${activeNav === menu.key ? " is-open" : ""}`} key={menu.key}>
              <button
                className="nav-trigger"
                type="button"
                aria-expanded={activeNav === menu.key}
                aria-controls={`mega-menu-${menu.key}`}
                onClick={() => toggleNav(menu.key)}
              >
                {menu.label}
                <ChevronIcon />
              </button>
              {activeNav === menu.key && <MegaMenu menu={menu} onClose={() => setActiveNav(null)} />}
            </div>
          ))}
        </nav>

        <div className="topbar-actions">
          <button className="search-trigger" type="button" aria-label="Open search" aria-expanded={isSearchOpen} aria-controls="top-search-panel" onClick={toggleSearch}>
            <span className="search-trigger-content">
              <img className="search-icon" src={assetPaths.searchIcon} alt="" aria-hidden="true" />
              <span>Search</span>
            </span>
          </button>
          <button className="login-link" type="button" onClick={() => showToast("Login dashboard lokal akan dihubungkan pada tahap autentikasi.")}>
            Login
          </button>
        </div>

        {isSearchOpen && (
          <div id="top-search-panel" className="top-search-panel" role="search">
            <form className="top-search-form" onSubmit={(event) => { event.preventDefault(); handleSearch(); setIsSearchOpen(false); }}>
              <label className="sr-only" htmlFor="top-search">Search ATLAS</label>
              <input
                ref={topSearchInputRef}
                id="top-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ATLAS"
              />
              <button type="submit">Search</button>
            </form>
            <small>Search dashboards, topics, news, and monitoring data.</small>
          </div>
        )}
      </header>

      <section id="top" className="map-hero" aria-label="ATLAS live webmap">
        <div ref={mapNode} className="atlas-map" />
        {!mapReady && !mapError && <div className="map-status">Loading live map…</div>}
        {mapError && <div className="map-status map-error">Map data could not be loaded. Check the local server and `public/assets/data/DataSHP.zip`.</div>}

        <div className="map-overlay map-control-panel">
          <details>
            <summary>
              <span>Map Layers</span>
              <ChevronIcon />
            </summary>
            <div className="layer-menu">
              {layerMeta.map((layer) => (
                <label className="layer-row" key={layer.key}>
                  <input
                    type="checkbox"
                    checked={layerVisibility[layer.key]}
                    onChange={() => setLayerVisibility((current) => ({ ...current, [layer.key]: !current[layer.key] }))}
                  />
                  <span className="layer-swatch" style={{ backgroundColor: layer.color }} />
                  <span><strong>{layer.label}</strong><small>{layer.description}</small></span>
                </label>
              ))}
            </div>
          </details>
        </div>

        <div className="map-overlay map-meta">
          <span className="map-meta-pulse" />
          <span><small>Current view</small><strong>Sepaku landscape</strong></span>
        </div>
      </section>

      <section className="search-band" aria-labelledby="search-heading">
        <h2 id="search-heading">What are you looking for?</h2>
        <div className="search-module">
          <form className="search-form" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
            <label className="sr-only" htmlFor="global-search">Search ATLAS</label>
            <input
              id="global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for datasets, dashboards, topics, and more…"
            />
            <button type="submit">Search</button>
          </form>
          <div className="search-links">
            <button type="button" onClick={() => showToast("Data Catalog akan berisi daftar dataset ATLAS.")}>
              <span><strong>Data Catalog</strong><small>Explore datasets from the ATLAS monitoring landscape.</small></span>
            </button>
            <button type="button" onClick={() => document.getElementById("dashboard-catalog")?.scrollIntoView({ behavior: "smooth" })}>
              <span><strong>Data Tools</strong><small>Move from discovery to visualization and analysis.</small></span>
            </button>
            <button type="button" onClick={() => showToast("Alert center akan menampilkan status data dan layanan.")}>
              <span><strong>Data Alerts and Outages</strong><small>Track interruptions in data availability and services.</small></span>
            </button>
          </div>
        </div>
      </section>

      <section id="dashboard-catalog" className="dashboard-section content-wrap" aria-labelledby="dashboard-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ATLAS platform</span>
            <h2 id="dashboard-heading">Browse Data by Dashboard</h2>
            <p>Choose a domain to move from the live map into a focused operational view.</p>
          </div>
          <a href="#dashboard-catalog" className="text-link">View all functions</a>
        </div>

        <div className="dashboard-grid">
          {filteredDashboards.length ? filteredDashboards.map((dashboard) => (
            <button className={`dashboard-card${dashboard.featured ? " dashboard-card-featured" : ""}`} type="button" key={dashboard.name} onClick={() => handleDashboardClick(dashboard)}>
              <span className="dashboard-name">{dashboard.name}</span>
              <span className="dashboard-eyebrow">{dashboard.eyebrow}</span>
              <span className="dashboard-description">{dashboard.description}</span>
            </button>
          )) : <p className="empty-state">No dashboard matches “{query}”. Try a different keyword.</p>}
        </div>
      </section>

      <section id="atlas-news" className="news-section" aria-labelledby="news-heading">
        <div className="content-wrap">
          <div className="section-heading news-heading">
            <div><span className="section-kicker">Field notes &amp; updates</span><h2 id="news-heading">ATLAS News</h2></div>
            <a href="#atlas-news" className="text-link">Read more in the news</a>
          </div>
          <div className="news-grid">
            {filteredNews.length ? filteredNews.map((article) => (
              <button className={`news-card ${article.className}`} type="button" key={article.title} onClick={() => showToast(`${article.title} dipilih dari ATLAS News.`)}>
                <AssetImage src={article.image} alt={article.imageAlt} placeholder={article.placeholder} className="news-image" />
                <span className="news-card-copy">
                  <small>{article.category}</small>
                  <strong>{article.title}</strong>
                  <span>{article.summary}</span>
                </span>
              </button>
            )) : <p className="empty-state">No news matches “{query}”.</p>}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main content-wrap">
          <div className="footer-brand"><a className="brand-link" href="#top"><Brand /></a><p>Integrated monitoring portal for the managed landscape.</p></div>
          <FooterColumn title="Find Data" links={["Data Catalog", "Data Tools", "Platforms", "Instruments", "Projects", "Data Alerts"]} />
          <FooterColumn title="Data Pathfinder" links={["Forest", "Biodiversity", "Climate", "Water", "Fire", "Land Surface"]} />
          <FooterColumn title="Learn" links={["ATLAS Basics", "Webinars", "Tutorials", "Data in Action", "Data Recipes"]} />
          <FooterColumn title="Centers" links={["Main Office", "Field Operations", "Environment", "Planning", "Contact"]} />
          <FooterColumn title="Engage" links={["Open Data", "Data Guidance", "Partnerships", "Membership", "Feedback"]} />
          <FooterColumn title="News" links={["Events", "Newsletter", "ATLAS News", "Contact"]} />
        </div>
        <div className="footer-bottom content-wrap"><span>ATLAS Webmap · OneMap Phase 1</span><span>Privacy · Accessibility · Sitemap</span><span>Local build · Source controlled by owner</span></div>
      </footer>

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return <div className="footer-column"><h3>{title}</h3>{links.map((link) => <a href="#top" key={link}>{link}</a>)}</div>;
}

export default App;
