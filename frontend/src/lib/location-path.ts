import type { Location } from "@/types/inventory";

export function formatLocationPath(location: Location, locations: Location[]) {
  const byId = new Map(locations.map((item) => [item.id, item]));
  const chain: string[] = [];
  const visited = new Set<number>();
  let cursor: Location | undefined = location;

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    chain.unshift(cursor.nombre);
    cursor = cursor.ubicacionPadreId ? byId.get(cursor.ubicacionPadreId) : undefined;
  }

  return `${location.laboratorio.codigo} / ${chain.join(" / ")}`;
}

export function formatLocationPathById(
  locationId: number | null | undefined,
  locations: Location[],
  fallback = "Ubicacion no encontrada"
) {
  if (!locationId) {
    return "Sin ubicacion";
  }

  const location = locations.find((item) => item.id === locationId);
  return location ? formatLocationPath(location, locations) : fallback;
}
