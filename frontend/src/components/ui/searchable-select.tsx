import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar",
  emptyLabel = "Seleccionar",
  required,
  disabled,
  className
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value) ?? null;
  const filteredOptions = useMemo(() => {
    const normalized = normalizeSearch(search);
    if (!normalized) return options;
    return options.filter((option) =>
      normalizeSearch(`${option.label} ${option.description ?? ""} ${option.searchText ?? ""}`).includes(
        normalized
      )
    );
  }, [options, search]);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
          !selected && "text-muted-foreground"
        )}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {required && !value && <input className="sr-only" required value="" onChange={() => undefined} />}

      {open && !disabled && (
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

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => selectValue("")}
            >
              {emptyLabel}
            </button>
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  value === option.value && "bg-primary text-primary-foreground hover:bg-primary"
                )}
                onClick={() => selectValue(option.value)}
              >
                <span className="block truncate">{option.label}</span>
                {option.description && (
                  <span className="block truncate text-xs opacity-80">{option.description}</span>
                )}
              </button>
            ))}
            {!filteredOptions.length && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
