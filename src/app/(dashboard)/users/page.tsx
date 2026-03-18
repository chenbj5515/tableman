"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { UsersTable, type UserRow } from "@/components/users-table";
import { Users, Loader2 } from "lucide-react";

const PAGE_SIZE = 50;

interface UsersResponse {
  tableExists: boolean;
  rows: UserRow[];
  total: number;
  error?: string;
  columnMap?: Record<string, string | null>;
}

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminFilter, setAdminFilter] = useState<boolean | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      if (adminFilter !== null) {
        params.set("isAdmin", adminFilter.toString());
      }
      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "获取用户列表失败");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "获取用户列表失败";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, adminFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (ids: (string | number)[]) => {
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "删除失败");
      }
      const result = await res.json();
      toast.success(`成功删除 ${result.deleted} 个用户`);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="flex flex-col p-6 lg:p-8 h-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex justify-center items-center bg-neutral-900 rounded-xl size-10">
            <Users className="size-5 text-white" />
          </div>
          <h1 className="font-semibold text-neutral-900 text-2xl text-balance">
            用户管理
          </h1>
        </div>
        <p className="text-neutral-500 text-pretty">
          查看用户信息、Token使用情况和付费状态
        </p>
      </div>

      {error && (
        <div className="bg-red-50 mb-4 p-4 rounded-xl text-red-600 text-pretty">
          {error}
        </div>
      )}

      <div className="flex flex-col flex-1 bg-white border border-neutral-200 rounded-2xl min-h-0 overflow-hidden">
        {isLoading && !data ? (
          <div className="flex flex-1 justify-center items-center">
            <Loader2 className="size-8 text-neutral-400 animate-spin" />
          </div>
        ) : (
          <UsersTable
            rows={data?.rows ?? []}
            total={data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            isLoading={isLoading}
            tableExists={data?.tableExists ?? false}
            adminFilter={adminFilter}
            hasAdminColumn={!!data?.columnMap?.isAdmin}
            onDelete={handleDelete}
            onPageChange={setPage}
            onAdminFilterChange={(value) => {
              setAdminFilter(value);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
