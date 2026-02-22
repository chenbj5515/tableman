"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tables, setTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const pathname = usePathname();

  // 从路径解析当前选中的表: /tables/[name] -> name
  const selectedTable =
    pathname?.startsWith("/tables/") && pathname !== "/tables"
      ? decodeURIComponent(pathname.replace(/^\/tables\//, "").split("/")[0] ?? "")
      : null;

  useEffect(() => {
    async function fetchTables() {
      try {
        setIsLoadingTables(true);
        const response = await fetch("/api/tables");
        if (!response.ok) throw new Error("获取表列表失败");
        const data = await response.json();
        setTables(data.tables);
      } catch {
        setTables([]);
      } finally {
        setIsLoadingTables(false);
      }
    }
    fetchTables();
  }, []);

  return (
    <div className="h-screen flex">
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        isLoading={isLoadingTables}
      />
      {children}
    </div>
  );
}
