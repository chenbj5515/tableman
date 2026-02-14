import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

// 获取表的列信息
async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const db = pool();
  // 获取列信息
  const columnsResult = await db.query(
    `
    SELECT 
      c.column_name,
      c.data_type,
      c.is_nullable
    FROM information_schema.columns c
    WHERE c.table_name = $1 
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position
  `,
    [tableName]
  );

  // 获取主键信息
  const pkResult = await db.query(
    `
    SELECT a.attname as column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE i.indisprimary
      AND c.relname = $1
      AND n.nspname = 'public'
  `,
    [tableName]
  );

  const primaryKeys = new Set(pkResult.rows.map((row) => row.column_name));

  return columnsResult.rows.map((row) => ({
    name: row.column_name,
    type: row.data_type,
    nullable: row.is_nullable === "YES",
    isPrimaryKey: primaryKeys.has(row.column_name),
  }));
}

// 验证表名是否存在（防止 SQL 注入）
async function tableExists(tableName: string): Promise<boolean> {
  const db = pool();
  const result = await db.query(
    `
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name = $1
  `,
    [tableName]
  );
  return result.rows.length > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const db = pool();
    const { name: tableName } = await params;

    // 验证表是否存在
    if (!(await tableExists(tableName))) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // 获取列信息
    const columns = await getTableColumns(tableName);

    // 构建筛选条件
    const searchParams = request.nextUrl.searchParams;
    const filters: { column: string; value: string }[] = [];

    // 从 URL 参数中提取筛选条件
    for (const column of columns) {
      const value = searchParams.get(column.name);
      if (value !== null && value !== "") {
        filters.push({ column: column.name, value });
      }
    }

    // 构建查询
    let query = `SELECT * FROM "${tableName}"`;
    const values: string[] = [];

    if (filters.length > 0) {
      const conditions = filters.map((filter, index) => {
        values.push(filter.value);
        // 使用 CAST 来处理不同类型的比较
        return `"${filter.column}"::text = $${index + 1}`;
      });
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // 分页参数
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const offset = (page - 1) * pageSize;

    // 添加分页
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;

    const result = await db.query(query, values);

    // 获取总行数
    let countQuery = `SELECT COUNT(*) as total FROM "${tableName}"`;
    if (filters.length > 0) {
      const conditions = filters.map((filter, index) => {
        return `"${filter.column}"::text = $${index + 1}`;
      });
      countQuery += ` WHERE ${conditions.join(" AND ")}`;
    }
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    return NextResponse.json({
      columns,
      rows: result.rows,
      total,
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    return NextResponse.json(
      { error: "Failed to fetch table data" },
      { status: 500 }
    );
  }
}
