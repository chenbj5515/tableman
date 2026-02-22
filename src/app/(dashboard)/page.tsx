"use client";

import { DataTable } from "@/components/data-table";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <DataTable
        columns={[]}
        rows={[]}
        total={0}
        page={1}
        pageSize={50}
        isLoading={false}
        onDelete={async () => {}}
        onPageChange={() => {}}
      />
    </div>
  );
}
