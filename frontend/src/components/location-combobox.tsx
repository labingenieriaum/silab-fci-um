import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { formatEnum } from "@/lib/format";
import { formatLocationPath } from "@/lib/location-path";
import { cn } from "@/lib/utils";
import type { Location } from "@/types/inventory";

interface LocationComboboxProps {
  locations: Location[];
  laboratories?: Array<{ id: number; codigo: string; nombre: string }>;
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  allowLaboratorySelection?: boolean;
}

export function LocationCombobox({
  locations,
  laboratories,
  value,
  onChange,
  emptyLabel = "Seleccionar",
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar ubicacion por nombre",
  required,
  allowLaboratorySelection = false
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredValue, setHoveredValue] = useState<string | "empty" | null>(null);
  const [collapsedLabs, setCollapsedLabs] = useState<Set<number>>(new Set());
  const [collapsedLocations, setCollapsedLocations] = useState<Set<number>>(new Set());

  const selectedLaboratoryId = value.startsWith("lab:") ? Number(value.replace("lab:", "")) : null;
  const selectedLocation = value && !selectedLaboratoryId
    ? locations.find((location) => location.id === Number(value))
    : null;
  const labs = useMemo(
    () => getLaboratoriesForLocations(locations, laboratories),
    [laboratories, locations]
  );
  const selectedLaboratory = selectedLaboratoryId
    ? labs.find((laboratory) => laboratory.id === selectedLaboratoryId) ?? null
    : null;
  const hoveredLocation = hoveredValue && hoveredValue !== "empty" && !hoveredValue.startsWith("lab:")
    ? locations.find((location) => location.id === Number(hoveredValue))
    : selectedLocation;
  const hoveredLaboratory = hoveredValue?.startsWith("lab:")
    ? labs.find((laboratory) => laboratory.id === Number(hoveredValue.replace("lab:", ""))) ?? null
    : selectedLaboratory;

  const filteredLocations = useMemo(
    () => locations.filter((location) => matchesLocationSearch(location, locations, search)),
    [locations, search]
  );
  const locationsByParent = useMemo(() => {
    const map = new Map<number | null, Location[]>();
    for (const location of locations) {
      const parentId = location.ubicacionPadreId ?? null;
      map.set(parentId, [...(map.get(parentId) ?? []), location]);
    }
    return map;
  }, [locations]);
  const filteredIds = useMemo(
    () => new Set(filteredLocations.map((location) => location.id)),
    [filteredLocations]
  );
  const normalizedSearch = search.trim().toLowerCase();

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setSearch("");
    setOpen(false);
  }

  function toggleLab(laboratoryId: number) {
    setCollapsedLabs((current) => toggleSetValue(current, laboratoryId));
  }

  function toggleLocation(locationId: number) {
    setCollapsedLocations((current) => toggleSetValue(current, locationId));
  }

  function renderLocationBranch(location: Location, level: number): ReactNode {
    const children = locationsByParent.get(location.id) ?? [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedLocations.has(location.id) && !normalizedSearch;
    const shouldShow =
      !normalizedSearch ||
      filteredIds.has(location.id) ||
      children.some((child) => branchHasMatch(child, locationsByParent, filteredIds));

    if (!shouldShow) return null;

    return (
      <div key={location.id}>
        <div className="flex items-stretch">
          <button
            type="button"
            className="grid w-8 place-items-center text-muted-foreground hover:bg-muted"
            style={{ marginLeft: Math.max(0, level - 1) * 14 }}
            onClick={(event) => {
              event.stopPropagation();
              if (hasChildren) toggleLocation(location.id);
            }}
            aria-label={hasChildren ? "Desplegar ubicacion" : "Sin sububicaciones"}
          >
            {hasChildren ? (
              isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className={cn(
              "min-w-0 flex-1 px-3 py-2 text-left text-sm hover:bg-muted",
              value === String(location.id) && "bg-primary text-primary-foreground hover:bg-primary"
            )}
            onClick={() => selectValue(String(location.id))}
            onMouseEnter={() => setHoveredValue(String(location.id))}
          >
            <span className="block truncate">{location.nombre}</span>
            <span className="block truncate text-xs opacity-80">
              {formatEnum(location.tipo)}
              {location.ubicacionPadre ? ` - Padre: ${location.ubicacionPadre.nombre}` : " - Sin padre"}
            </span>
          </button>
        </div>
        {!isCollapsed && children.map((child) => renderLocationBranch(child, level + 1))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
          !selectedLocation && !selectedLaboratory && "text-muted-foreground"
        )}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="truncate">
          {selectedLaboratory
            ? `${selectedLaboratory.codigo} / Laboratorio completo`
            : selectedLocation
              ? formatLocationPath(selectedLocation, locations)
              : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {required && !value && <input className="sr-only" required value="" onChange={() => undefined} />}

      {open && (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-md border bg-white shadow-lg">
          <div className="border-b p-2">
            <div className="flex h-9 items-center gap-2 rounded-md border bg-white px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="h-full w-full bg-transparent text-sm outline-none"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => selectValue("")}
              onMouseEnter={() => setHoveredValue("empty")}
            >
              {emptyLabel}
            </button>
            {labs.map((laboratory) => {
              const labRoots = (locationsByParent.get(null) ?? []).filter(
                (location) => location.laboratorioId === laboratory.id
              );
              const labMatches =
                !normalizedSearch ||
                laboratory.codigo.toLowerCase().includes(normalizedSearch) ||
                laboratory.nombre.toLowerCase().includes(normalizedSearch) ||
                labRoots.some((location) => branchHasMatch(location, locationsByParent, filteredIds));
              const isCollapsed = collapsedLabs.has(laboratory.id) && !normalizedSearch;

              if (!labMatches) return null;

              return (
                <div key={laboratory.id} className="border-t first:border-t-0">
                  <div className="flex items-stretch bg-muted/50">
                    <button
                      type="button"
                      className="grid w-8 place-items-center text-muted-foreground hover:bg-muted"
                      onClick={() => toggleLab(laboratory.id)}
                      aria-label="Desplegar laboratorio"
                    >
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "min-w-0 flex-1 px-3 py-2 text-left text-sm font-semibold hover:bg-muted",
                        value === `lab:${laboratory.id}` && "bg-primary text-primary-foreground hover:bg-primary"
                      )}
                      onClick={() =>
                        allowLaboratorySelection ? selectValue(`lab:${laboratory.id}`) : toggleLab(laboratory.id)
                      }
                      onMouseEnter={() => setHoveredValue(`lab:${laboratory.id}`)}
                    >
                      <span className="block truncate">
                        {laboratory.codigo} - {laboratory.nombre}
                      </span>
                      <span className="block truncate text-xs font-normal opacity-80">
                        {allowLaboratorySelection
                          ? "Seleccionar para guardar directamente en el laboratorio"
                          : "Laboratorio"}
                      </span>
                    </button>
                  </div>
                  {!isCollapsed && labRoots.map((location) => renderLocationBranch(location, 1))}
                </div>
              );
            })}
            {!filteredLocations.length && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </div>
            )}
          </div>

          {hoveredLocation && (
            <div className="border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">
                {formatLocationPath(hoveredLocation, locations)} - {formatEnum(hoveredLocation.tipo)}
              </div>
              <div>Laboratorio: {hoveredLocation.laboratorio.nombre}</div>
              <div>
                {hoveredLocation.ubicacionPadre
                  ? `Padre: ${hoveredLocation.ubicacionPadre.nombre}`
                  : "Sin padre"}
              </div>
              <div>{hoveredLocation.descripcion || "Sin descripcion"}</div>
            </div>
          )}
          {!hoveredLocation && hoveredLaboratory && (
            <div className="border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">
                {hoveredLaboratory.codigo} - {hoveredLaboratory.nombre}
              </div>
              <div>Seleccion directa al laboratorio.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getLaboratoriesForLocations(
  locations: Location[],
  explicitLaboratories?: Array<{ id: number; codigo: string; nombre: string }>
) {
  if (explicitLaboratories?.length) {
    return [...explicitLaboratories].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  const byId = new Map<number, { id: number; codigo: string; nombre: string }>();
  for (const location of locations) {
    byId.set(location.laboratorio.id, location.laboratorio);
  }
  return [...byId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function branchHasMatch(
  location: Location,
  byParent: Map<number | null, Location[]>,
  filteredIds: Set<number>
): boolean {
  if (filteredIds.has(location.id)) return true;
  return (byParent.get(location.id) ?? []).some((child) => branchHasMatch(child, byParent, filteredIds));
}

function toggleSetValue(current: Set<number>, value: number) {
  const next = new Set(current);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function matchesLocationSearch(location: Location, locations: Location[], search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return (
    location.nombre.toLowerCase().includes(normalized) ||
    location.laboratorio.codigo.toLowerCase().includes(normalized) ||
    location.laboratorio.nombre.toLowerCase().includes(normalized) ||
    formatLocationPath(location, locations).toLowerCase().includes(normalized) ||
    (location.ubicacionPadre?.nombre ?? "").toLowerCase().includes(normalized) ||
    (location.descripcion ?? "").toLowerCase().includes(normalized)
  );
}
