"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Plus, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface FilterBarProps {
  columns: Column[];
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

const OPERATORS = [
  { value: "equals", label: "等于" },
  { value: "contains", label: "包含" },
  { value: "starts_with", label: "开头是" },
  { value: "ends_with", label: "结尾是" },
  { value: "is_null", label: "为 null" },
  { value: "is_not_null", label: "不为 null" },
];

const NO_VALUE_OPERATORS = ["is_null", "is_not_null"];

export function FilterBar({
  columns,
  filters,
  onFilterChange,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  // 获取主键列
  const pkColumn = columns.find((col) => col.isPrimaryKey);

  // 从 filters 初始化 conditions
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      const newConditions = Object.entries(filters).map(([key, value], index) => {
        // 解析 column__operator 格式
        const parts = key.split("__");
        const column = parts[0];
        const operator = parts.length === 2 ? parts[1] : "equals";
        return {
          id: `filter-${index}-${Date.now()}`,
          column,
          operator,
          value,
        };
      });
      setConditions(newConditions);
      if (newConditions.length > 0) {
        setShowFilters(true);
      }
    }
  }, []);

  // 添加新的筛选条件
  const addCondition = () => {
    // 默认使用主键，如果没有主键则使用第一个字段
    const defaultColumn = pkColumn?.name || columns[0]?.name || "";
    const newCondition: FilterCondition = {
      id: `filter-${Date.now()}`,
      column: defaultColumn,
      operator: "equals",
      value: "",
    };
    setConditions([...conditions, newCondition]);
  };

  // 删除筛选条件
  const removeCondition = (id: string) => {
    const newConditions = conditions.filter((c) => c.id !== id);
    setConditions(newConditions);
    
    // 自动应用筛选
    applyFilters(newConditions);
  };

  // 更新筛选条件
  const updateCondition = (id: string, field: keyof FilterCondition, value: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // 应用筛选
  const applyFilters = (conditionsToApply: FilterCondition[] = conditions) => {
    const activeFilters: Record<string, string> = {};
    conditionsToApply.forEach((c) => {
      if (c.column) {
        // is_null 和 is_not_null 不需要值
        if (NO_VALUE_OPERATORS.includes(c.operator)) {
          const key = `${c.column}__${c.operator}`;
          activeFilters[key] = "1"; // 用占位值
        } else if (c.value) {
          // 使用 column__operator=value 格式
          const key = `${c.column}__${c.operator}`;
          activeFilters[key] = c.value;
        }
      }
    });
    onFilterChange(activeFilters);
  };

  // 清除所有筛选
  const clearFilters = () => {
    setConditions([]);
    onFilterChange({});
  };

  // 切换筛选面板
  const toggleFilters = () => {
    if (!showFilters && conditions.length === 0) {
      // 第一次点击时，添加一个默认的筛选条件
      addCondition();
    }
    setShowFilters(!showFilters);
  };

  // 处理回车键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
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
          onClick={toggleFilters}
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
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            清除筛选
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="px-3 pb-3 space-y-2">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2">
              {/* 删除按钮 */}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => removeCondition(condition.id)}
              >
                <X className="size-4" />
              </Button>

              {/* where/and 标签 */}
              <span className="text-sm text-muted-foreground w-12 shrink-0">
                {index === 0 ? "where" : "and"}
              </span>

              {/* 字段选择器 - 可搜索的 Combobox */}
              <Popover
                open={openPopovers[condition.id]}
                onOpenChange={(open) =>
                  setOpenPopovers((prev) => ({ ...prev, [condition.id]: open }))
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPopovers[condition.id]}
                    className="w-40 justify-between text-sm h-8"
                  >
                    <span className="truncate">
                      {condition.column || "选择字段"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索字段..." />
                    <CommandList>
                      <CommandEmpty>未找到字段</CommandEmpty>
                      <CommandGroup>
                        {columns.map((column) => (
                          <CommandItem
                            key={column.name}
                            value={column.name}
                            onSelect={(value) => {
                              updateCondition(condition.id, "column", value);
                              setOpenPopovers((prev) => ({
                                ...prev,
                                [condition.id]: false,
                              }));
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                condition.column === column.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">{column.name}</span>
                            {column.isPrimaryKey && (
                              <span className="ml-1 text-xs text-primary">(PK)</span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* 操作符选择器 */}
              <Select
                value={condition.operator}
                onValueChange={(value) =>
                  updateCondition(condition.id, "operator", value)
                }
              >
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 值输入框 - is_null 和 is_not_null 不需要 */}
              {!NO_VALUE_OPERATORS.includes(condition.operator) && (
                <Input
                  placeholder="输入值"
                  value={condition.value}
                  onChange={(e) =>
                    updateCondition(condition.id, "value", e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-8 text-sm min-w-32"
                />
              )}
            </div>
          ))}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addCondition}
              className="text-muted-foreground"
            >
              <Plus className="size-4" />
              添加筛选
            </Button>
            {conditions.length > 0 && (
              <>
                <Button size="sm" onClick={() => applyFilters()}>
                  应用
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  清除筛选
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
