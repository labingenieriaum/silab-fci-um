import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
