"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Table2, ArrowLeft, Loader2 } from "lucide-react";

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
  const [isLoadingData, setIsLoadingData] = useState(true);
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
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          返回数据库一览
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-neutral-900 flex items-center justify-center">
            <Table2 className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 text-balance">
              {tableName}
            </h1>
            <p className="text-neutral-500 text-sm">数据表</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-pretty">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        {tableData && (
          <FilterBar
            columns={tableData.columns}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

        {isLoadingData && !tableData ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-8 text-neutral-400 animate-spin" />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
