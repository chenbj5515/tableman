# TableMan - 数据库表管理系统

一个基于 Next.js 15 + Tailwind CSS + shadcn/ui 的 PostgreSQL 数据库表管理系统。

## 功能特性

- 左侧显示数据库中所有表的列表
- 点击表名查看该表的所有数据
- 支持按字段进行相等筛选
- 支持选择多行数据
- 支持批量删除选中的行

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS v4
- **UI 组件**: shadcn/ui
- **数据库**: PostgreSQL
- **数据库工具**: Drizzle ORM + pg

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置你的 PostgreSQL 数据库连接：

```
DATABASE_URL=postgresql://用户名:密码@主机:端口/数据库名
```

例如：

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── tables/
│   │       ├── route.ts              # GET: 获取所有表名
│   │       └── [name]/
│   │           ├── route.ts          # GET: 获取表数据(支持筛选)
│   │           └── delete/
│   │               └── route.ts      # POST: 删除行
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── sidebar.tsx                   # 左侧表列表
│   ├── filter-bar.tsx                # 筛选栏
│   ├── data-table.tsx                # 数据表格
│   └── ui/                           # shadcn 组件
└── lib/
    ├── db.ts                         # 数据库连接
    └── utils.ts                      # 工具函数
```

## API 接口

### GET `/api/tables`

获取数据库中所有表名。

**响应示例：**

```json
{
  "tables": ["users", "products", "orders"]
}
```

### GET `/api/tables/[name]`

获取指定表的数据，支持筛选。

**查询参数：** 任意列名作为参数，值为要筛选的内容（相等匹配）

例如：`/api/tables/users?name=John&age=25`

**响应示例：**

```json
{
  "columns": [
    { "name": "id", "type": "integer", "nullable": false, "isPrimaryKey": true },
    { "name": "name", "type": "character varying", "nullable": true, "isPrimaryKey": false }
  ],
  "rows": [
    { "id": 1, "name": "John" }
  ],
  "total": 1
}
```

### POST `/api/tables/[name]/delete`

删除指定表中的行。

**请求体：**

```json
{
  "ids": [1, 2, 3]
}
```

**响应示例：**

```json
{
  "deleted": 3
}
```

## 注意事项

- 该系统会显示 `public` schema 下的所有基础表
- 删除操作需要表有主键
- 数据返回限制为 1000 行
- 筛选使用文本匹配，会将字段转换为文本进行比较

## License

MIT
