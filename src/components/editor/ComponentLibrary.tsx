import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Trash2, Upload, Shield, LogIn, LogOut, PanelLeftClose, PanelLeftOpen, Package, Cable, Type, Shapes, LayoutTemplate, Library, MoveRight, Route, Workflow, PenLine, Sparkles, Star, Loader2, ChevronDown, ChevronRight, Tag, Ruler, MoveHorizontal, MoveVertical, Move, Eye, EyeOff } from "lucide-react";
import { PLATE_TEMPLATES, PLATE_CATEGORIES } from "@/lib/plate-templates";
import { PlateGlyph } from "./PlateGlyph";

import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CATEGORIES, BRANDS, type CatalogCategory, type CatalogItem } from "@/lib/catalog";
import { useEditor } from "@/lib/editor-store";
import { useCatalog } from "@/lib/use-catalog";
import { useAuth, signOut } from "@/hooks/useAuth";
import {
  useUserComponents,
  useSaveUserComponent,
  useDeleteUserComponent,
  useToggleFavorite,
  uploadComponentImage,
} from "@/lib/user-components";
import { assertCanCreateUserComponent } from "@/lib/limits";

import { DeviceGlyph } from "./DeviceGlyph";
import { ShapeGlyph } from "./ShapeGlyph";

export function ComponentLibrary() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("Todas");
  const [showNew, setShowNew] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [tab, setTab] = useState<"components" | "wiring" | "texts" | "shapes" | "plates" | "measures" | "templates" | "user">("components");

  const { customCatalog, addCustomCatalog, removeCustomCatalog, leftCollapsed, toggleLeftPanel, setLeftCollapsed, leftWidth, setLeftWidth } = useEditor();
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const toggleCat = (c: string) =>
    setCollapsedCats((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c); else n.add(c);
      return n;
    });

  // Drag-to-resize the left sidebar
  const resizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      setLeftWidth(e.clientX);
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setLeftWidth]);
  const { data: officialCatalog = [], isLoading } = useCatalog();
  const { user, isAdmin } = useAuth();

  const { data: userComponents = [] } = useUserComponents(user?.id);
  const saveUserComp = useSaveUserComponent();
  const deleteUserComp = useDeleteUserComponent();
  const toggleFav = useToggleFavorite();

  const userItems = useMemo(
    () => (favOnly ? userComponents.filter((i) => i.isFavorite) : userComponents),
    [userComponents, favOnly],
  );

  const all = useMemo(
    () =>
      tab === "user"
        ? userItems
        : [...officialCatalog, ...userComponents, ...customCatalog],
    [tab, officialCatalog, userComponents, customCatalog, userItems],
  );

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<CatalogCategory, CatalogItem[]>();
    for (const item of all) {
      if (brand !== "Todas" && item.brand !== brand) continue;
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.brand.toLowerCase().includes(q) &&
        !item.subtitle.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q) &&
        !(item.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
        continue;
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return CATEGORIES.map((c) => ({ category: c, items: map.get(c) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [query, brand, all]);


  if (leftCollapsed) {
    const categories = [
      { id: "components", icon: Package, label: "Componentes" },
      { id: "wiring", icon: Cable, label: "Cabeamento" },
      { id: "texts", icon: Type, label: "Textos" },
      { id: "shapes", icon: Shapes, label: "Formas" },
      { id: "plates", icon: Tag, label: "Plaquetas" },
      { id: "measures", icon: Ruler, label: "Medidas" },
      { id: "user", icon: Library, label: "Biblioteca" },
    ] as const;

    return (
      <aside className="w-12 border-r border-border bg-card flex flex-col items-center py-4 shrink-0 gap-4">
        <button
          onClick={toggleLeftPanel}
          title="Expandir biblioteca ( [ )"
          className="size-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelLeftOpen className="size-5" />
        </button>
        
        <div className="w-8 h-px bg-border my-2" />

        <div className="flex flex-col gap-2 w-full px-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = tab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setTab(cat.id as any);
                  setLeftCollapsed(false);
                }}
                title={cat.label}
                className={`relative group size-9 grid place-items-center rounded-lg transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="size-5" />
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-foreground rounded-r-full" />
                )}
                {/* Desktop Tooltip Fallback if title is not enough */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border border-border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl hidden md:block">
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`border-r border-border bg-card flex flex-col shrink-0 relative transition-all duration-300 z-30 ${
        window.innerWidth < 1024 ? "absolute inset-y-0 left-0 shadow-2xl" : ""
      }`}
      style={{ width: window.innerWidth < 1024 ? Math.min(leftWidth, window.innerWidth - 40) : leftWidth }}
    >
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <div className="size-4 bg-primary-foreground rounded-sm rotate-45" />
        </div>
        <div className="flex flex-col leading-tight flex-1 min-w-0">
          <span className="font-bold tracking-tight">VoltFlow</span>
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Painéis 2D</span>
        </div>
        {isAdmin && (
          <Link to="/admin" title="Painel admin" className="size-7 grid place-items-center rounded hover:bg-secondary text-primary">
            <Shield className="size-4" />
          </Link>
        )}
        {user ? (
          <button onClick={signOut} title="Sair" className="size-7 grid place-items-center rounded hover:bg-secondary text-muted-foreground">
            <LogOut className="size-4" />
          </button>
        ) : (
          <Link to="/auth" title="Entrar" className="size-7 grid place-items-center rounded hover:bg-secondary text-muted-foreground">
            <LogIn className="size-4" />
          </Link>
        )}
        <button onClick={toggleLeftPanel} title="Recolher ( [ )" className="size-7 grid place-items-center rounded hover:bg-secondary text-muted-foreground">
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className="p-3 border-b border-border flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1">
          <NavTab active={tab === "components"} label="Componentes" onClick={() => setTab("components")}><Package className="size-3.5" /></NavTab>
          <NavTab active={tab === "wiring"} label="Cabeamento" onClick={() => setTab("wiring")}><Cable className="size-3.5" /></NavTab>
          <NavTab active={tab === "texts"} label="Textos" onClick={() => setTab("texts")}><Type className="size-3.5" /></NavTab>
          <NavTab active={tab === "shapes"} label="Formas" onClick={() => setTab("shapes")}><Shapes className="size-3.5" /></NavTab>
          <NavTab active={tab === "plates"} label="Plaquetas" onClick={() => setTab("plates")}><Tag className="size-3.5" /></NavTab>
          <NavTab active={tab === "measures"} label="Medidas" onClick={() => setTab("measures")}><Ruler className="size-3.5" /></NavTab>
          <NavTab active={tab === "user"} label="Biblioteca" onClick={() => setTab("user")}><Library className="size-3.5" /></NavTab>

        </div>
      </div>


      {(tab === "components" || tab === "user") && <div className="p-3 border-b border-border flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar componentes..."
            className="w-full pl-8 pr-3 py-2 bg-secondary border-0 rounded-md text-sm focus:ring-2 focus:ring-ring/30 outline-hidden" />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1">
          {(["Todas", ...BRANDS] as const).map((b) => (
            <button key={b} onClick={() => setBrand(b)}
              className={`whitespace-nowrap px-2 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
                brand === b ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              }`}>{b}</button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)}
          className="mt-1 w-full py-1.5 border border-dashed border-border rounded-md text-xs font-medium hover:bg-secondary flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground">
          <Plus className="size-3.5" /> Novo componente
        </button>
        {tab === "user" && user && (
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={`-mt-1 self-start text-[10px] font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
              favOnly ? "bg-amber-100 text-amber-700 border-amber-300" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className={`size-3 ${favOnly ? "fill-amber-500 text-amber-500" : ""}`} /> Favoritos
          </button>
        )}
      </div>}


      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {tab === "wiring" && <WiringSection />}
        {tab === "texts" && <TextSection />}
        {tab === "shapes" && <ShapesSection />}
        {tab === "plates" && <PlatesSection />}
        {tab === "measures" && <MeasuresSection />}
        {tab === "templates" && <PlaceholderSection icon={<LayoutTemplate className="size-4" />} title="Templates" text="Modelos prontos de quadros e diagramas aparecerão aqui." />}

        {(tab === "components" || tab === "user") && grouped.map(({ category, items }) => {
          const isCollapsed = collapsedCats.has(category);
          return (
          <div key={category}>
            <button
              type="button"
              onClick={() => toggleCat(category)}
              className="w-full px-2 py-1.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
            >
              {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
              <span>{category}</span>
              <span className="ml-auto font-mono text-[9px] opacity-60">{items.length}</span>
            </button>
            {!isCollapsed && <div className="space-y-1">
              {items.map((item) => {
                const isUser = (item as { isUserComponent?: boolean }).isUserComponent === true;
                const isFav = (item as { isFavorite?: boolean }).isFavorite === true;
                return (
                <div key={item.id} draggable
                  onDragStart={(e) => {
                    // Embed the full item so user-library components (not in the static
                    // catalog) also drop correctly. Keep the id channel for fallback.
                    e.dataTransfer.setData("application/x-catalog-item", JSON.stringify(item));
                    e.dataTransfer.setData("application/x-catalog-id", item.id);
                    e.dataTransfer.effectAllowed = "copy";
                    // Custom drag ghost: a soft, scaled card following the cursor.
                    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
                    ghost.style.position = "fixed";
                    ghost.style.top = "-1000px";
                    ghost.style.left = "-1000px";
                    ghost.style.width = `${e.currentTarget.clientWidth}px`;
                    ghost.style.pointerEvents = "none";
                    ghost.style.opacity = "0.92";
                    ghost.style.transform = "scale(1.05)";
                    ghost.style.boxShadow = "0 12px 32px -8px rgba(15,23,42,.35)";
                    ghost.style.borderRadius = "8px";
                    ghost.style.background = "var(--card, #fff)";
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 20, 20);
                    setTimeout(() => ghost.remove(), 0);
                  }}
                  className="group flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary cursor-grab active:cursor-grabbing border border-transparent hover:border-border transition-colors">
                  <div
                    className="w-10 h-12 shrink-0 grid place-items-center rounded-sm border border-border overflow-hidden p-1"
                    style={{
                      background: item.imageUrl
                        ? "repeating-conic-gradient(oklch(0.95 0 0) 0% 25%, oklch(1 0 0) 0% 50%) 50% / 6px 6px"
                        : undefined,
                    }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-contain" />
                    ) : (
                      <DeviceGlyph item={item} width={Math.min(34, item.width)} height={Math.min(40, item.height)} compact />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.brand} · {item.subtitle}</div>
                  </div>
                  {isUser && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFav.mutate({ id: item.id, value: !isFav }); }}
                      title="Favoritar"
                      className={`p-1 ${isFav ? "text-amber-500" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-500"}`}
                    >
                      <Star className={`size-3 ${isFav ? "fill-amber-500" : ""}`} />
                    </button>
                  )}
                  {(item.custom || isUser) && (
                    <button onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm(`Excluir "${item.name}"?`)) return;
                      if (isUser) {
                        deleteUserComp.mutate(item.id, {
                          onSuccess: () => toast.success("Componente removido"),
                          onError: (err) => toast.error("Erro: " + (err as Error).message),
                        });
                      } else {
                        removeCustomCatalog(item.id);
                      }
                    }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              );})}
            </div>}
          </div>
          );
        })}
        {(tab === "components" || tab === "user") && grouped.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            Nenhum componente encontrado.
          </div>
        )}
      </nav>

      {showNew && (
        <NewComponentDialog
          onClose={() => setShowNew(false)}
          userId={user?.id ?? null}
          onCreate={async (item, rawFile) => {
            if (user?.id) {
              try {
                await assertCanCreateUserComponent(user.id, isAdmin);
                let imageUrl = item.imageUrl;
                let thumbnailUrl: string | undefined;
                if (rawFile) {
                  const uploaded = await uploadComponentImage(user.id, rawFile);
                  imageUrl = uploaded.imageUrl;
                  thumbnailUrl = uploaded.thumbnailUrl;
                }

                await saveUserComp.mutateAsync({
                  userId: user.id,
                  name: item.name,
                  brand: item.brand,
                  category: item.category,
                  subtitle: item.subtitle,
                  width: item.width,
                  height: item.height,
                  imageUrl,
                  thumbnailUrl,
                  tags: item.tags,
                  properties: {
                    accent: item.accent,
                    poles: item.poles,
                    current: item.current,
                    voltage: item.voltage,
                    power: item.power,
                    capacity: item.capacity,
                    description: item.description,
                  },
                });
                toast.success("Componente salvo na sua biblioteca");
                setTab("user");
              } catch (e) {
                const msg = (e as Error).message ?? "Falha ao salvar";
                toast.error(msg.startsWith("Você atingiu") ? msg : "Erro ao salvar: " + msg);

              }
            } else {
              addCustomCatalog(item);
            }
          }}
        />
      )}
      {/* Resize handle (drag right edge) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          resizingRef.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        onDoubleClick={() => setLeftWidth(288)}
        title="Arrastar para redimensionar · dois cliques para resetar"
        className="absolute top-0 right-0 h-full w-1.5 -mr-0.5 cursor-col-resize z-20 hover:bg-primary/40 active:bg-primary/60 transition-colors"
      />
    </aside>
  );
}

function NavTab({ children, label, active, onClick }: { children: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`h-9 grid place-items-center rounded-md border transition-colors ${
        active ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function TextSection() {
  const addText = useEditor((s) => s.addText);
  const panel = useEditor((s) => s.panel);
  return (
    <div className="p-3 space-y-2">
      <button
        onClick={() => addText(panel.width / 2 - 70, panel.height / 2 - 16)}
        className="w-full py-2 border border-border rounded-md text-xs font-medium hover:bg-secondary flex items-center justify-center gap-2"
      >
        <Type className="size-3.5" /> Adicionar texto
      </button>
    </div>
  );
}

function ShapesSection() {
  const addShape = useEditor((s) => s.addShape);
  const panel = useEditor((s) => s.panel);
  const shapes: { v: import("@/lib/editor-store").ShapeVariant; label: string }[] = [
    { v: "rectangle", label: "Retângulo" },
    { v: "square", label: "Quadrado" },
    { v: "circle", label: "Círculo" },
    { v: "ellipse", label: "Elipse" },
    { v: "triangle", label: "Triângulo" },
    { v: "diamond", label: "Losango" },
    { v: "pentagon", label: "Pentágono" },
    { v: "hexagon", label: "Hexágono" },
    { v: "octagon", label: "Octógono" },
    { v: "star", label: "Estrela" },
    { v: "cross", label: "Cruz" },
    { v: "arrow", label: "Seta" },
    { v: "double-arrow", label: "Seta dupla" },
    { v: "line", label: "Linha" },
    { v: "dashed-line", label: "Tracejada" },
    { v: "callout", label: "Balão" },
    { v: "cloud", label: "Nuvem" },
  ];
  const add = (v: import("@/lib/editor-store").ShapeVariant) =>
    addShape(v, panel.width / 2 - 70, panel.height / 2 - 50);
  const arrows: { v: "simple" | "double" | "curved" | "ortho" | "dashed" | "tech"; label: string }[] = [
    { v: "simple", label: "Seta" },
    { v: "double", label: "Dupla" },
    { v: "curved", label: "Curva" },
    { v: "ortho", label: "Ortogonal" },
    { v: "dashed", label: "Tracejada" },
    { v: "tech", label: "Técnica" },
  ];
  const addArrow = useEditor((s) => s.addArrow);
  return (
    <div className="p-3 space-y-4">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Formas vetoriais
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {shapes.map((s) => (
            <button
              key={s.v}
              onClick={() => add(s.v)}
              title={s.label}
              className="aspect-square rounded-md border border-border hover:bg-secondary hover:border-primary/40 flex flex-col items-center justify-center gap-1 p-1 transition-colors"
            >
              <ShapeThumb variant={s.v} />
              <span className="text-[9px] leading-none text-muted-foreground text-center">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Setas editáveis
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {arrows.map((a) => (
            <button
              key={a.v}
              onClick={() => addArrow(a.v, panel.width / 2 - 80, panel.height / 2)}
              title={a.label}
              className="aspect-square rounded-md border border-border hover:bg-secondary hover:border-primary/40 flex flex-col items-center justify-center gap-1 p-1 transition-colors text-foreground"
            >
              <MoveRight className="size-5" />
              <span className="text-[9px] leading-none text-muted-foreground text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Selecione para editar nós (arraste · Alt+clique remove · duplo-clique no traço insere ponto).
      </p>
    </div>
  );
}

function ShapeThumb({ variant }: { variant: import("@/lib/editor-store").ShapeVariant }) {
  const fake = {
    id: "preview",
    kind: "shape" as const,
    variant,
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    rotation: 0,
    z: 0,
    fill: "#dbeafe",
    stroke: "#1d4ed8",
    strokeWidth: 2,
    opacity: 1,
    dashed: variant === "dashed-line",
  };
  return (
    <div className="w-7 h-7">
      <ShapeGlyph shape={fake} />
    </div>
  );
}

function PlatesSection() {
  const addPlate = useEditor((s) => s.addPlate);
  const panel = useEditor((s) => s.panel);
  const groups = PLATE_CATEGORIES.map((cat) => ({
    cat,
    items: PLATE_TEMPLATES.filter((t) => t.category === cat),
  })).filter((g) => g.items.length > 0);
  return (
    <div className="p-3 space-y-4">
      {groups.map(({ cat, items }) => (
        <div key={cat}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {cat}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((t) => (
              <button
                key={t.id}
                onClick={() => addPlate(t, panel.width / 2 - t.width / 2, panel.height / 2 - t.height / 2)}
                title={t.name}
                className="h-20 rounded-md border border-border hover:border-primary/40 hover:bg-secondary p-1 overflow-hidden transition-colors"
              >
                <div className="w-full h-full pointer-events-none" style={{ transform: `scale(${Math.min(1, 100 / t.width, 56 / t.height)})`, transformOrigin: "top left" }}>
                  <div style={{ width: t.width, height: t.height }}>
                    <PlateGlyph plate={{ ...t, id: "preview", kind: "plate", x: 0, y: 0, rotation: 0, z: 0, icon: t.icon ?? "none" }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[10px] leading-relaxed text-muted-foreground border-t border-border pt-3">
        Clique para inserir. Edite texto, cores, borda e ícone no painel à direita.
      </p>
    </div>
  );
}

function PlaceholderSection({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="m-2 p-4 rounded-md border border-border bg-secondary/30 text-center">
      <div className="mx-auto size-8 rounded-md bg-card border border-border grid place-items-center text-primary">{icon}</div>
      <div className="mt-2 text-xs font-bold">{title}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

/** Independent "Cabeamento" tab: picks cable type before drawing on canvas. */
function WiringSection() {
  const { wireMode, setWireTool, setWireMode, wireTool } = useEditor();
  const tools = [
    { v: "straight", label: "Linha reta", icon: MoveRight },
    { v: "curved", label: "Linha curva", icon: Route },
    { v: "orthogonal", label: "Ortogonal", icon: Workflow },
    { v: "multi", label: "Múltiplas curvas", icon: Route },
    { v: "free", label: "Linha livre", icon: PenLine },
    { v: "smart", label: "Inteligente", icon: Sparkles },
  ] as const;
  return (
    <div className="p-3 space-y-3">
      <button
        onClick={() => setWireMode(!wireMode)}
        className={`w-full py-2 text-xs rounded-md border transition-colors ${wireMode ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}
      >
        {wireMode ? "Modo cabeamento ativo" : "Ativar cabeamento"}
      </button>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Tipo de cabo / linha</div>
        <div className="grid grid-cols-2 gap-1.5">
          {tools.map(({ v, label, icon: Icon }) => (
          <button
              key={v}
              onClick={() => setWireTool(v)}
              className={`min-h-14 px-2 py-2 text-[11px] rounded-md border transition-colors flex flex-col items-center justify-center gap-1 ${
                wireTool === v && wireMode ? "bg-primary/10 text-primary border-primary/40" : "border-border hover:bg-secondary"
              }`}
          >
              <Icon className="size-4" />
              <span>{label}</span>
          </button>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-3">
        Clique e arraste no canvas para criar cabos soltos. Solte perto dos pontos azuis para grudar em componentes.
      </div>
    </div>
  );
}


function NewComponentDialog({
  onClose, onCreate, userId,
}: {
  onClose: () => void;
  userId: string | null;
  onCreate: (item: CatalogItem, rawFile: File | null) => void | Promise<void>;
}) {
  const [form, setForm] = useState<Partial<CatalogItem>>({
    name: "", brand: "", category: "Personalizado", subtitle: "",
    width: 40, height: 80, current: "", voltage: "", power: "", capacity: "", poles: 1,
    description: "", tags: [], accent: "#2563eb",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (p: Partial<CatalogItem>) => setForm((f) => ({ ...f, ...p }));

  const onImage = (file: File) => {
    setRawFile(file);
    const r = new FileReader();
    r.onload = () => set({ imageUrl: String(r.result) });
    r.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.name || !form.brand || busy) return;
    setBusy(true);
    try {
      await onCreate({
        id: `custom-${crypto.randomUUID()}`,
        name: form.name!,
        brand: form.brand!,
        category: (form.category as CatalogCategory) || "Personalizado",
        subtitle: form.subtitle || "",
        width: Number(form.width) || 40,
        height: Number(form.height) || 80,
        accent: form.accent,
        poles: form.poles,
        current: form.current,
        voltage: form.voltage,
        power: form.power,
        capacity: form.capacity,
        description: form.description,
        tags: form.tags,
        imageUrl: form.imageUrl,
        custom: true,
      }, rawFile);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border">
          <h3 className="font-bold">Novo componente personalizado</h3>
          <p className="text-xs text-muted-foreground mt-1">Cadastre um equipamento próprio com imagem e dados técnicos.</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Modelo *" value={form.name ?? ""} onChange={(v) => set({ name: v })} />
            <Field label="Marca *" value={form.brand ?? ""} onChange={(v) => set({ brand: v })} />
          </div>
          <Field label="Descrição curta" value={form.subtitle ?? ""} onChange={(v) => set({ subtitle: v })} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Categoria" value={form.category ?? ""} onChange={(v) => set({ category: v as CatalogCategory })} />
            <NumF label="Largura (mm)" value={form.width ?? 40} onChange={(v) => set({ width: v })} />
            <NumF label="Altura (mm)" value={form.height ?? 80} onChange={(v) => set({ height: v })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Corrente" value={form.current ?? ""} onChange={(v) => set({ current: v })} />
            <Field label="Tensão" value={form.voltage ?? ""} onChange={(v) => set({ voltage: v })} />
            <Field label="Potência" value={form.power ?? ""} onChange={(v) => set({ power: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Capacidade" value={form.capacity ?? ""} onChange={(v) => set({ capacity: v })} />
            <NumF label="Polos" value={form.poles ?? 1} onChange={(v) => set({ poles: v })} />
          </div>
          <Field label="Tags (separadas por vírgula)" value={(form.tags ?? []).join(", ")}
            onChange={(v) => set({ tags: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">Descrição técnica</label>
            <textarea value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })}
              rows={2} className="px-2 py-1.5 bg-card border border-border rounded text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground">Imagem do equipamento</label>
            <div className="mt-1 flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-1.5 border border-border rounded text-xs hover:bg-secondary flex items-center justify-center gap-1.5">
                <Upload className="size-3" /> {form.imageUrl ? "Trocar" : "Enviar"} imagem
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 max-h-28 object-contain border border-border rounded" />}
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-secondary">Cancelar</button>
          <button onClick={submit} disabled={busy} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50">
            {busy && <Loader2 className="size-3.5 animate-spin" />} {userId ? "Salvar na biblioteca" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm" />
    </div>
  );
}
function NumF({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm font-mono" />
    </div>
  );
}

function MeasuresSection() {
  const { measurements, removeMeasurement, selectMeasurement, selectedMeasurementId, updateMeasurement, setMeasureTool, measureTool, showMeasures, toggleMeasures } = useEditor();
  const [filter, setFilter] = useState<"all" | "fixed" | "hidden">("all");

  const filtered = measurements.filter(m => {
    if (filter === "fixed") return m.fixed;
    if (filter === "hidden") return !m.fixed;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setMeasureTool(measureTool === "free" ? null : "free")}
          className={`w-full py-2 px-3 rounded-md border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
            measureTool 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "bg-secondary text-foreground border-border hover:border-primary/50"
          }`}
        >
          <Ruler className="size-4" />
          {measureTool ? "Modo Medição Ativo" : "📏 Adicionar Medida"}
        </button>
        
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Eye className="size-3" /> Exibição
          </label>
          <button 
            onClick={() => toggleMeasures()}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
              showMeasures 
                ? "bg-primary/10 text-primary border-primary/30" 
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {showMeasures ? "Ligado" : "Desligado"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip active={filter === "all"} label="Todas" onClick={() => setFilter("all")} />
          <FilterChip active={filter === "fixed"} label="Fixadas" onClick={() => setFilter("fixed")} />
          <FilterChip active={filter === "hidden"} label="Ocultas" onClick={() => setFilter("hidden")} />
        </div>

        {filtered.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-lg bg-secondary/30">
            <Ruler className="size-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-[11px] text-muted-foreground px-4">
              Nenhuma medida encontrada neste filtro.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((m) => {
              const selected = m.id === selectedMeasurementId;
              return (
                <div
                  key={m.id}
                  onClick={() => selectMeasurement(m.id)}
                  className={`group flex items-center gap-3 px-2 py-2 rounded-md border transition-all cursor-pointer ${
                    selected
                      ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                      : "bg-card border-border hover:border-primary/30 hover:bg-secondary/50"
                  }`}
                >
                  <div className={`size-8 rounded flex items-center justify-center shrink-0 ${
                    m.variant === "area" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {m.variant === "horizontal" && <MoveHorizontal className="size-4" />}
                    {m.variant === "vertical" && <MoveVertical className="size-4" />}
                    {m.variant === "free" && <Ruler className="size-4" />}
                    {m.variant === "area" && <Shapes className="size-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate text-foreground leading-tight">
                      {m.label || (m.variant === "area" ? "Área de Medição" : "Distância")}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <span className="opacity-70">Valor:</span>
                      <span className="font-bold text-foreground/80">
                        {m.manualValue || "Auto"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateMeasurement(m.id, { fixed: !m.fixed });
                      }}
                      title={m.fixed ? "Desafixar" : "Fixar medida"}
                      className={`p-1.5 rounded-md hover:bg-primary/10 transition-colors ${
                        m.fixed ? "text-primary" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Move className={`size-3.5 ${m.fixed ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMeasurement(m.id);
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
        active 
          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
          : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function MeasureToolBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border transition-all ${
        active ? "bg-primary/10 border-primary/50 text-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}


