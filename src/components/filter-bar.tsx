"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X, Search } from "lucide-react";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

interface FilterBarProps {
  columns: Column[];
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

export function FilterBar({
  columns,
  filters,
  onFilterChange,
}: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(filters);
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (column: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleApply = () => {
    // 过滤掉空值
    const activeFilters = Object.fromEntries(
      Object.entries(localFilters).filter(([, value]) => value !== "")
    );
    onFilterChange(activeFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="border-b">
      <div className="p-3 flex items-center gap-2">
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="size-4" />
          筛选
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="size-4" />
            清除筛选
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {columns.map((column) => (
              <div key={column.name} className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">
                  {column.name}
                  {column.isPrimaryKey && (
                    <span className="ml-1 text-primary">(PK)</span>
                  )}
                </label>
                <Input
                  placeholder={`筛选 ${column.name}`}
                  value={localFilters[column.name] || ""}
                  onChange={(e) => handleInputChange(column.name, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply}>
              <Search className="size-4" />
              应用筛选
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              清除
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
