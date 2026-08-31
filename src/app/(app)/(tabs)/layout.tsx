import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";

export default function TabsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden">
      <div className="min-h-0 flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
