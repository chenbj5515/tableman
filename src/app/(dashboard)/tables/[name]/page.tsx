"use client";

import { useState, useEffect, useCallback, use } from "react";
import { toast } from "sonner";
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

interface TablePageProps {
  params: Promise<{ name: string }>;
}

export default function TablePage({ params }: TablePageProps) {
  const { name: tableName } = use(params);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTableData = useCallback(async () => {
    if (!tableName) return;

    try {
      setIsLoadingData(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set("page", page.toString());
      searchParams.set("pageSize", PAGE_SIZE.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.set(key, value);
      });

      const url = `/api/tables/${encodeURIComponent(tableName)}?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error("获取表数据失败");

      const data = await response.json();
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取表数据失败");
    } finally {
      setIsLoadingData(false);
    }
  }, [tableName, filters, page]);

  useEffect(() => {
    if (tableName) fetchTableData();
  }, [tableName, fetchTableData]);

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (ids: (string | number)[]) => {
    if (!tableName) return;

    try {
      const response = await fetch(
        `/api/tables/${encodeURIComponent(tableName)}/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) throw new Error("删除失败");

      const result = await response.json();
      toast.success(`成功删除 ${result.deleted} 行数据`);
      fetchTableData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 border-b">
          {error}
        </div>
      )}

      <div className="p-4 border-b bg-muted/20">
        <h1 className="text-xl font-semibold">{tableName}</h1>
      </div>

      {tableData && (
        <FilterBar
          columns={tableData.columns}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

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
  );
}
