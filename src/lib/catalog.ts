export type CatalogCategory =
  | "Proteção"
  | "Automação"
  | "Comando"
  | "Energia"
  | "Infraestrutura"
  | "Sinalização"
  | "Personalizado";

export type ComponentConnectionPointKind =
  | "input"
  | "output"
  | "power"
  | "ground"
  | "comm"
  | "analog-in"
  | "analog-out"
  | "generic";

/**
 * Borne (ponto de conexão) definido pelo admin sobre a imagem do componente.
 * Coordenadas NORMALIZADAS (0..1) para acompanhar redimensionamentos.
 */
export type ComponentConnectionPoint = {
  id: string;
  name: string;
  nx: number; // 0..1 relativo à largura
  ny: number; // 0..1 relativo à altura
  kind: ComponentConnectionPointKind;
  side?: "top" | "right" | "bottom" | "left";
  label?: string;
  signal?: string;
};

export type CatalogItem = {
  id: string;
  name: string;          // modelo
  brand: string;
  category: CatalogCategory;
  subtitle: string;
  // default footprint in mm (1mm -> 1px)
  width: number;
  height: number;
  accent?: string;
  // technical specs (all optional / editable)
  poles?: number;
  capacity?: string;     // ex: "10kA"
  current?: string;      // ex: "16A"
  voltage?: string;      // ex: "220V"
  power?: string;        // ex: "1CV"
  description?: string;
  tags?: string[];
  imageUrl?: string;     // optional photo (data URL or remote)
  connectionPoints?: ComponentConnectionPoint[];
  custom?: boolean;
};

export const CONNECTION_POINT_COLORS: Record<ComponentConnectionPointKind, string> = {
  input: "#2563eb",
  output: "#16a34a",
  power: "#dc2626",
  ground: "#78350f",
  comm: "#eab308",
  "analog-in": "#0ea5e9",
  "analog-out": "#a855f7",
  generic: "#64748b",
};

export const BRANDS = [
  "Siemens",
  "Schneider",
  "WEG",
  "ABB",
  "Eaton",
  "Phoenix Contact",
  "Finder",
  "Clamper",
  "Omron",
  "Steck",
] as const;

export const CATALOG: CatalogItem[] = [
  // Proteção
  { id: "mcb-sie-5sy41", name: "5SY4116-7", brand: "Siemens", category: "Proteção", subtitle: "Disjuntor 1P · 16A · Curva C", width: 18, height: 90, accent: "#1d4ed8", poles: 1, current: "16A", voltage: "230V", capacity: "6kA", tags: ["disjuntor","mcb","curva c"] },
  { id: "mcb-sch-ic60n", name: "iC60N C16", brand: "Schneider", category: "Proteção", subtitle: "Disjuntor 1P · 16A · Curva C", width: 18, height: 90, accent: "#10b981", poles: 1, current: "16A", voltage: "230V", capacity: "10kA", tags: ["disjuntor","mcb"] },
  { id: "mcb-abb-s201", name: "S201 C20", brand: "ABB", category: "Proteção", subtitle: "Disjuntor 1P · 20A", width: 18, height: 90, accent: "#dc2626", poles: 1, current: "20A", voltage: "230V", capacity: "6kA", tags: ["disjuntor"] },
  { id: "mcb-sie-5sy43p", name: "5SY4 3P", brand: "Siemens", category: "Proteção", subtitle: "Disjuntor 3P · 32A", width: 54, height: 90, accent: "#1d4ed8", poles: 3, current: "32A", voltage: "400V", capacity: "6kA" },
  { id: "rcd-sch-id", name: "iID 2P 25A", brand: "Schneider", category: "Proteção", subtitle: "DR 30mA · Bipolar", width: 36, height: 90, accent: "#0ea5e9", poles: 2, current: "25A", voltage: "230V", tags: ["dr","idr","diferencial"] },
  { id: "dps-cla-vcl", name: "VCL Slim 275", brand: "Clamper", category: "Proteção", subtitle: "DPS Classe II · 20kA", width: 18, height: 90, accent: "#f59e0b", poles: 1, capacity: "20kA", voltage: "275V", tags: ["dps","surto"] },
  { id: "fus-phx-ut", name: "UT 6 + Fusível", brand: "Phoenix Contact", category: "Proteção", subtitle: "Borne fusível 6mm²", width: 8, height: 80, accent: "#475569", poles: 1 },

  // Automação
  { id: "plc-sie-1214", name: "SIMATIC S7-1214C", brand: "Siemens", category: "Automação", subtitle: "CLP DC/DC/Rly", width: 110, height: 100, accent: "#0f766e", voltage: "24V", tags: ["clp","plc"] },
  { id: "plc-weg-clic", name: "CLIC 02", brand: "WEG", category: "Automação", subtitle: "CLP compacto 12 I/O", width: 95, height: 90, accent: "#2563eb", voltage: "24V", tags: ["clp"] },
  { id: "rly-fin-40", name: "40.52", brand: "Finder", category: "Automação", subtitle: "Relé 2 contatos · 8A", width: 27, height: 80, accent: "#9333ea", current: "8A", tags: ["relé","rele"] },
  { id: "tmr-omr-h3y", name: "H3Y-2", brand: "Omron", category: "Automação", subtitle: "Temporizador 0–60s", width: 36, height: 80, accent: "#0891b2", tags: ["timer","temporizador"] },
  { id: "vfd-weg-cfw", name: "CFW300 1CV", brand: "WEG", category: "Automação", subtitle: "Inversor de frequência", width: 70, height: 142, accent: "#1e40af", power: "1CV", voltage: "220V", tags: ["inversor","vfd"] },
  { id: "ss-eat-ds7", name: "DS7 11A", brand: "Eaton", category: "Automação", subtitle: "Soft-starter 3kW", width: 45, height: 130, accent: "#b91c1c", power: "3kW", current: "11A", tags: ["soft-starter"] },

  // Comando
  { id: "ctt-weg-cwm", name: "CWM12-10", brand: "WEG", category: "Comando", subtitle: "Contator 12A · 220V", width: 45, height: 78, accent: "#1d4ed8", current: "12A", voltage: "220V", tags: ["contator"] },
  { id: "ctt-sie-3rt", name: "3RT2026", brand: "Siemens", category: "Comando", subtitle: "Contator 25A · AC3", width: 45, height: 88, accent: "#0f172a", current: "25A", tags: ["contator"] },
  { id: "btn-ste-22mm", name: "Botão Verde 22mm", brand: "Steck", category: "Comando", subtitle: "Pulsador NA", width: 22, height: 22, accent: "#16a34a", tags: ["botão","botao"] },
  { id: "btn-ste-emerg", name: "Cogumelo Emerg.", brand: "Steck", category: "Comando", subtitle: "Trava por giro", width: 30, height: 30, accent: "#dc2626", tags: ["emergência","emergencia"] },
  { id: "sig-ste-led", name: "Sinaleiro LED", brand: "Steck", category: "Comando", subtitle: "22mm · 24V", width: 22, height: 22, accent: "#f59e0b", voltage: "24V", tags: ["sinaleiro","led"] },

  // Energia
  { id: "psu-phx-quint", name: "QUINT 24V/10A", brand: "Phoenix Contact", category: "Energia", subtitle: "Fonte chaveada", width: 60, height: 130, accent: "#0f172a", voltage: "24V", current: "10A", tags: ["fonte"] },
  { id: "tr-weg-iso", name: "Trafo Iso 500VA", brand: "WEG", category: "Energia", subtitle: "220/127V", width: 110, height: 100, accent: "#78350f", power: "500VA", tags: ["transformador"] },
  { id: "med-sch-iem", name: "iEM3155", brand: "Schneider", category: "Energia", subtitle: "Multimedidor", width: 90, height: 90, accent: "#10b981", tags: ["medidor"] },
  { id: "ssec-abb-ot", name: "OT63 Seccionadora", brand: "ABB", category: "Energia", subtitle: "Chave 63A 3P", width: 80, height: 90, accent: "#dc2626", current: "63A", poles: 3 },

  // Infraestrutura
  { id: "rail-din-tx", name: "Trilho DIN TS35", brand: "Generic", category: "Infraestrutura", subtitle: "Comprimento ajustável", width: 400, height: 14, accent: "#94a3b8", tags: ["trilho","din"] },
  { id: "duct-ste-canal", name: "Canaleta 40x40", brand: "Steck", category: "Infraestrutura", subtitle: "Perfurada cinza", width: 240, height: 40, accent: "#cbd5e1", tags: ["canaleta"] },
  { id: "term-phx-ut4", name: "Borne UT 4", brand: "Phoenix Contact", category: "Infraestrutura", subtitle: "4mm² parafuso", width: 6, height: 70, accent: "#475569", tags: ["borne"] },
  { id: "fan-ste-cooler", name: "Cooler 120mm", brand: "Steck", category: "Infraestrutura", subtitle: "Ventilação 24V", width: 120, height: 120, accent: "#0ea5e9", voltage: "24V" },

  // Sinalização
  { id: "ihm-weg-op320", name: "IHM OP320", brand: "WEG", category: "Sinalização", subtitle: "Tela 3.7\" mono", width: 110, height: 80, accent: "#1e293b", tags: ["ihm"] },
  { id: "ihm-sie-ktp", name: "KTP400 Basic", brand: "Siemens", category: "Sinalização", subtitle: "Touch 4\" colorido", width: 130, height: 90, accent: "#0f172a", tags: ["ihm","hmi"] },
];

export const CATEGORIES: CatalogCategory[] = [
  "Proteção",
  "Automação",
  "Comando",
  "Energia",
  "Infraestrutura",
  "Sinalização",
  "Personalizado",
];

// ---- Custom components (localStorage) ----
const STORAGE_KEY = "voltflow:custom-catalog";

export function loadCustomCatalog(): CatalogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCatalog(items: CatalogItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
