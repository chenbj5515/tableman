"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Table2 } from "lucide-react";

interface SidebarProps {
  tables: string[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  isLoading?: boolean;
}

export function Sidebar({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
}: SidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="size-5" />
          <h2 className="font-semibold">数据库表</h2>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              加载中...
            </div>
          ) : tables.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              没有找到表
            </div>
          ) : (
            <div className="space-y-1">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                    selectedTable === table
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Table2 className="size-4 shrink-0" />
                  <span className="truncate">{table}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t text-xs text-muted-foreground">
        共 {tables.length} 个表
      </div>
    </div>
  );
}
