"use client";

import { AuthProvider } from "@/lib/auth";
import { FiltersProvider } from "@/lib/filters";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FiltersProvider>{children}</FiltersProvider>
    </AuthProvider>
  );
}
