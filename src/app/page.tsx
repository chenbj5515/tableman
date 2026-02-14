"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

interface TableData {
  columns: Column[];
  rows: Record<string, unknown>[];
  total: number;
}

const PAGE_SIZE = 50;

export default function Home() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取表列表
  useEffect(() => {
    async function fetchTables() {
      try {
        setIsLoadingTables(true);
        setError(null);
        const response = await fetch("/api/tables");
        if (!response.ok) {
          throw new Error("获取表列表失败");
        }
        const data = await response.json();
        setTables(data.tables);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取表列表失败");
      } finally {
        setIsLoadingTables(false);
      }
    }
    fetchTables();
  }, []);

  // 获取表数据
  const fetchTableData = useCallback(async () => {
    if (!selectedTable) return;

    try {
      setIsLoadingData(true);
      setError(null);

      // 构建查询参数
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", PAGE_SIZE.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const url = `/api/tables/${encodeURIComponent(selectedTable)}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("获取表数据失败");
      }

      const data = await response.json();
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取表数据失败");
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedTable, filters, page]);

  // 当选择表或筛选条件变化时获取数据
  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable, fetchTableData]);

  // 选择表
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setFilters({}); // 重置筛选条件
    setPage(1); // 重置页码
    setTableData(null);
  };

  // 更新筛选条件
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1); // 重置页码
  };

  // 翻页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 删除行
  const handleDelete = async (ids: (string | number)[]) => {
    if (!selectedTable) return;

    try {
      const response = await fetch(
        `/api/tables/${encodeURIComponent(selectedTable)}/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) {
        throw new Error("删除失败");
      }

      const result = await response.json();
      alert(`成功删除 ${result.deleted} 行数据`);

      // 刷新数据
      fetchTableData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="h-screen flex">
      {/* 侧边栏 */}
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={handleSelectTable}
        isLoading={isLoadingTables}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 错误提示 */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 border-b">
            {error}
          </div>
        )}

        {/* 表头信息 */}
        {selectedTable && (
          <div className="p-4 border-b bg-muted/20">
            <h1 className="text-xl font-semibold">{selectedTable}</h1>
          </div>
        )}

        {/* 筛选栏 */}
        {tableData && (
          <FilterBar
            columns={tableData.columns}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* 数据表格 */}
        <DataTable
          columns={tableData?.columns ?? []}
          rows={tableData?.rows ?? []}
          total={tableData?.total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          isLoading={isLoadingData}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
