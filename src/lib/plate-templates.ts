/**
 * Biblioteca de modelos de plaquetas/etiquetas industriais.
 * Cada template gera uma `Plate` editável no canvas.
 */
export type PlateIcon =
  | "none"
  | "bolt"           // alta tensão
  | "ground"         // aterramento
  | "warning"        // triângulo de atenção
  | "danger"         // perigo
  | "lock"           // cadeado / não operar
  | "energized"      // equipamento energizado
  | "ppe";           // uso de EPI

export type PlateTemplate = {
  id: string;
  name: string;
  category:
    | "Identificação"
    | "Empresa"
    | "Tensão"
    | "Corrente"
    | "Advertência"
    | "Especificação"
    | "Patrimônio"
    | "Fabricante"
    | "Símbolos";
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700 | 800;
  italic?: boolean;
  align: "left" | "center" | "right";
  color: string;
  background: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  padding: number;
  icon?: PlateIcon;
};

export const PLATE_TEMPLATES: PlateTemplate[] = [
  // Identificação
  {
    id: "id-quadro", name: "Identificação do quadro", category: "Identificação",
    width: 220, height: 80, text: "QGBT-01\nPainel Principal",
    fontSize: 18, fontWeight: 800, align: "center",
    color: "#0f172a", background: "#e2e8f0",
    borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 10,
  },
  {
    id: "id-ccm", name: "CCM", category: "Identificação",
    width: 220, height: 70, text: "CCM-02\nMotor 7,5CV",
    fontSize: 16, fontWeight: 700, align: "center",
    color: "#ffffff", background: "#1e293b",
    borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 10,
  },

  // Empresa
  {
    id: "empresa", name: "Plaqueta da empresa", category: "Empresa",
    width: 260, height: 100,
    text: "EMPRESA XYZ\nAutomação Industrial\nwww.empresa.com.br",
    fontSize: 14, fontWeight: 700, align: "center",
    color: "#0f172a", background: "#f8fafc",
    borderColor: "#94a3b8", borderWidth: 2, cornerRadius: 6, padding: 10,
  },

  // Tensão
  { id: "v-220", name: "220V", category: "Tensão", width: 90, height: 56, text: "220V", fontSize: 26, fontWeight: 800, align: "center", color: "#0f172a", background: "#facc15", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "v-380", name: "380V", category: "Tensão", width: 90, height: 56, text: "380V", fontSize: 26, fontWeight: 800, align: "center", color: "#0f172a", background: "#facc15", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "v-440", name: "440V", category: "Tensão", width: 90, height: 56, text: "440V", fontSize: 26, fontWeight: 800, align: "center", color: "#0f172a", background: "#facc15", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "v-24",  name: "24VDC", category: "Tensão", width: 100, height: 56, text: "24VDC", fontSize: 22, fontWeight: 800, align: "center", color: "#ffffff", background: "#2563eb", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "v-110", name: "110VAC", category: "Tensão", width: 100, height: 56, text: "110VAC", fontSize: 22, fontWeight: 800, align: "center", color: "#0f172a", background: "#facc15", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4 },

  // Corrente
  { id: "a-10",  name: "10A",  category: "Corrente", width: 80, height: 50, text: "10A",  fontSize: 22, fontWeight: 800, align: "center", color: "#ffffff", background: "#16a34a", borderColor: "#052e16", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "a-20",  name: "20A",  category: "Corrente", width: 80, height: 50, text: "20A",  fontSize: 22, fontWeight: 800, align: "center", color: "#ffffff", background: "#16a34a", borderColor: "#052e16", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "a-40",  name: "40A",  category: "Corrente", width: 80, height: 50, text: "40A",  fontSize: 22, fontWeight: 800, align: "center", color: "#ffffff", background: "#16a34a", borderColor: "#052e16", borderWidth: 2, cornerRadius: 4, padding: 4 },
  { id: "a-100", name: "100A", category: "Corrente", width: 90, height: 50, text: "100A", fontSize: 22, fontWeight: 800, align: "center", color: "#ffffff", background: "#16a34a", borderColor: "#052e16", borderWidth: 2, cornerRadius: 4, padding: 4 },

  // Advertência
  {
    id: "w-alta-tensao", name: "Alta Tensão", category: "Advertência",
    width: 200, height: 110, text: "ALTA\nTENSÃO",
    fontSize: 22, fontWeight: 800, align: "center",
    color: "#0f172a", background: "#fde047",
    borderColor: "#0f172a", borderWidth: 4, cornerRadius: 2, padding: 6,
    icon: "bolt",
  },
  {
    id: "w-choque", name: "Risco de choque", category: "Advertência",
    width: 220, height: 120, text: "RISCO DE\nCHOQUE ELÉTRICO",
    fontSize: 16, fontWeight: 800, align: "center",
    color: "#0f172a", background: "#fde047",
    borderColor: "#0f172a", borderWidth: 4, cornerRadius: 2, padding: 6,
    icon: "bolt",
  },
  {
    id: "w-energizado", name: "Equip. Energizado", category: "Advertência",
    width: 220, height: 90, text: "EQUIPAMENTO\nENERGIZADO",
    fontSize: 15, fontWeight: 800, align: "center",
    color: "#ffffff", background: "#dc2626",
    borderColor: "#0f172a", borderWidth: 3, cornerRadius: 2, padding: 6,
    icon: "energized",
  },
  {
    id: "w-perigo", name: "Perigo", category: "Advertência",
    width: 180, height: 80, text: "PERIGO",
    fontSize: 28, fontWeight: 800, align: "center",
    color: "#ffffff", background: "#dc2626",
    borderColor: "#0f172a", borderWidth: 3, cornerRadius: 2, padding: 6,
    icon: "danger",
  },
  {
    id: "w-nao-operar", name: "Não operar", category: "Advertência",
    width: 200, height: 80, text: "NÃO OPERAR",
    fontSize: 22, fontWeight: 800, align: "center",
    color: "#ffffff", background: "#0f172a",
    borderColor: "#dc2626", borderWidth: 3, cornerRadius: 2, padding: 6,
    icon: "lock",
  },

  // Especificação
  {
    id: "spec", name: "Especificação técnica", category: "Especificação",
    width: 240, height: 120,
    text: "Tensão: 380V\nCorrente: 32A\nPotência: 15CV\nFrequência: 60Hz",
    fontSize: 13, fontWeight: 600, align: "left",
    color: "#0f172a", background: "#f1f5f9",
    borderColor: "#475569", borderWidth: 1, cornerRadius: 4, padding: 10,
  },

  // Patrimônio
  {
    id: "patrimonio", name: "Patrimônio", category: "Patrimônio",
    width: 200, height: 70,
    text: "Patrimônio: 001245\nData: 2025",
    fontSize: 13, fontWeight: 700, align: "left",
    color: "#0f172a", background: "#fef3c7",
    borderColor: "#a16207", borderWidth: 1, cornerRadius: 4, padding: 8,
  },

  // Fabricante
  {
    id: "fabricante", name: "Fabricante", category: "Fabricante",
    width: 240, height: 110,
    text: "Fabricado por:\nNome da Empresa\n(11) 0000-0000\nwww.fabricante.com",
    fontSize: 12, fontWeight: 600, align: "left",
    color: "#0f172a", background: "#ffffff",
    borderColor: "#0f172a", borderWidth: 1, cornerRadius: 4, padding: 10,
  },

  // Símbolos puros
  { id: "sym-bolt",      name: "Alta Tensão",     category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#0f172a", background: "#fde047", borderColor: "#0f172a", borderWidth: 3, cornerRadius: 4, padding: 4, icon: "bolt" },
  { id: "sym-ground",    name: "Aterramento",     category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#0f172a", background: "#f1f5f9", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4, icon: "ground" },
  { id: "sym-warning",   name: "Atenção",         category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#0f172a", background: "#fde047", borderColor: "#0f172a", borderWidth: 3, cornerRadius: 4, padding: 4, icon: "warning" },
  { id: "sym-danger",    name: "Perigo",          category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#ffffff", background: "#dc2626", borderColor: "#0f172a", borderWidth: 3, cornerRadius: 4, padding: 4, icon: "danger" },
  { id: "sym-lock",      name: "Cadeado",         category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#0f172a", background: "#f1f5f9", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4, icon: "lock" },
  { id: "sym-energized", name: "Energizado",      category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#ffffff", background: "#dc2626", borderColor: "#0f172a", borderWidth: 3, cornerRadius: 4, padding: 4, icon: "energized" },
  { id: "sym-ppe",       name: "Uso de EPI",      category: "Símbolos", width: 80,  height: 80, text: "", fontSize: 10, fontWeight: 700, align: "center", color: "#ffffff", background: "#2563eb", borderColor: "#0f172a", borderWidth: 2, cornerRadius: 4, padding: 4, icon: "ppe" },
];

export const PLATE_CATEGORIES = [
  "Identificação",
  "Empresa",
  "Tensão",
  "Corrente",
  "Advertência",
  "Especificação",
  "Patrimônio",
  "Fabricante",
  "Símbolos",
] as const;
