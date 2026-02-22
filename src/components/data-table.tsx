"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Trash2, AlertCircle } from "lucide-react";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  onDelete: (ids: (string | number)[]) => Promise<void>;
  onPageChange: (page: number) => void;
}

export function DataTable({
  columns,
  rows,
  total,
  page,
  pageSize,
  isLoading,
  onDelete,
  onPageChange,
}: DataTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取主键列
  const pkColumn = columns.find((col) => col.isPrimaryKey);

  // 获取行的主键值
  const getRowId = (row: Record<string, unknown>): string | number | null => {
    if (!pkColumn) return null;
    const value = row[pkColumn.name];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
    return null;
  };

  // 切换单行选择
  const toggleRowSelection = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 切换全选
  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = rows
        .map(getRowId)
        .filter((id): id is string | number => id !== null);
      setSelectedIds(new Set(allIds));
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `确定要删除选中的 ${selectedIds.size} 行数据吗？此操作不可撤销。`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  // 复制到剪切板
  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label ? `已复制: ${label}` : "已复制");
    } catch {
      toast.error("复制失败");
    }
  }, []);

  const copyColumnName = useCallback(
    (columnName: string) => copyToClipboard(columnName, columnName),
    [copyToClipboard]
  );

  // 格式化单元格值
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "NULL";
    }
    if (typeof value === "object") {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 justify-center items-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex flex-1 justify-center items-center text-muted-foreground">
        <div className="text-center">
          <AlertCircle className="opacity-50 mx-auto mb-4 size-12" />
          <p>请选择一个表</p>
        </div>
      </div>
    );
  }

  const hasPrimaryKey = !!pkColumn;

  // 计算分页信息
  const totalPages = Math.ceil(total / pageSize);
  const startRow = (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, total);

  // 生成分页按钮
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // 显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 始终显示第一页
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // 当前页附近的页码
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      // 始终显示最后一页
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 操作栏 */}
      <div className="flex justify-between items-center p-3 border-b">
        <div className="text-muted-foreground text-sm">
          共 {total} 行
          {total > 0 && `，显示第 ${startRow}-${endRow} 行`}
          {selectedIds.size > 0 && (
            <span className="ml-2 text-foreground">
              已选择 {selectedIds.size} 行
            </span>
          )}
        </div>
        {hasPrimaryKey && selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            {isDeleting ? "删除中..." : `删除 (${selectedIds.size})`}
          </Button>
        )}
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {hasPrimaryKey && (
                <TableHead className="w-10 min-w-10 max-w-10 sticky top-0 z-10 bg-background">
                  <Checkbox
                    checked={rows.length > 0 && selectedIds.size === rows.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="全选"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.name} className="sticky top-0 z-10 bg-background text-foreground">
                  <div className="flex items-center gap-1 truncate">
                    <span 
                      className="truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => copyColumnName(column.name)}
                      title="点击复制列名"
                    >
                      {column.name}
                    </span>
                    {column.isPrimaryKey && (
                      <span className="text-primary text-xs shrink-0">(PK)</span>
                    )}
                  </div>
                  <div className="font-normal text-muted-foreground text-xs truncate">
                    {column.type}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasPrimaryKey ? 1 : 0)}
                  className="py-8 min-w-0 max-w-none text-muted-foreground text-center"
                >
                  没有数据
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = rowId !== null && selectedIds.has(rowId);

                return (
                  <TableRow
                    key={rowId ?? index}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    {hasPrimaryKey && (
                      <TableCell className="w-10 min-w-10 max-w-10">
                        {rowId !== null && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRowSelection(rowId)}
                            aria-label={`选择行 ${rowId}`}
                          />
                        )}
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const formatted = formatCellValue(row[column.name]);
                      return (
                        <TableCell
                          key={column.name}
                          title={formatted}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => copyToClipboard(formatted)}
                        >
                          <span
                            className={
                              row[column.name] === null
                                ? "text-muted-foreground italic"
                                : ""
                            }
                          >
                            {formatted}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center p-3 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                />
              </PaginationItem>
              {getPageNumbers().map((pageNum, index) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
