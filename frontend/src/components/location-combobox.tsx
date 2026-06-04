import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { formatEnum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Location } from "@/types/inventory";

interface LocationComboboxProps {
  locations: Location[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
}

export function LocationCombobox({
  locations,
  value,
  onChange,
  emptyLabel = "Seleccionar",
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar ubicacion por nombre",
  required
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<number | "empty" | null>(null);

  const selectedLocation = value
    ? locations.find((location) => location.id === Number(value))
    : null;
  const hoveredLocation = hoveredId === "empty"
    ? null
    : hoveredId
      ? locations.find((location) => location.id === hoveredId)
      : selectedLocation;

  const filteredLocations = useMemo(
    () => locations.filter((location) => matchesLocationSearch(location, search)),
    [locations, search]
  );

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
          !selectedLocation && "text-muted-foreground"
        )}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="truncate">{selectedLocation?.nombre ?? placeholder}</span>
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
              onMouseEnter={() => setHoveredId("empty")}
            >
              {emptyLabel}
            </button>
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  value === String(location.id) && "bg-primary text-primary-foreground hover:bg-primary"
                )}
                onClick={() => selectValue(String(location.id))}
                onMouseEnter={() => setHoveredId(location.id)}
              >
                <span className="block truncate">{location.nombre}</span>
                <span className="block truncate text-xs opacity-80">
                  {formatEnum(location.tipo)}
                  {location.ubicacionPadre ? ` - Padre: ${location.ubicacionPadre.nombre}` : " - Sin padre"}
                </span>
              </button>
            ))}
            {!filteredLocations.length && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </div>
            )}
          </div>

          {hoveredLocation && (
            <div className="border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">
                {hoveredLocation.nombre} - {formatEnum(hoveredLocation.tipo)}
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
        </div>
      )}
    </div>
  );
}

function matchesLocationSearch(location: Location, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return (
    location.nombre.toLowerCase().includes(normalized) ||
    (location.descripcion ?? "").toLowerCase().includes(normalized)
  );
}
