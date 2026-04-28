# 碳循环追踪

`CarbCycle Tracker` 是一个面向移动端的碳循环、热量记录与身体数据管理应用。项目基于 Next.js 14 App Router 构建，支持离线使用、安装到桌面、智能食物推荐、饮食模板、周报、扫码录入和训练记录，适合做减脂、维持或增肌期的日常追踪工具。

## 项目介绍

应用围绕“每日执行”和“每周复盘”两条主线设计：

- 每日查看高碳 / 中碳 / 低碳 / 休息日计划
- 记录早餐、午餐、晚餐、加餐、饮水与训练
- 根据剩余宏量自动推荐更合适的食物
- 用模板快速重复常见饮食组合
- 用周报、趋势图和成就系统追踪长期进展

同时，项目已经配置为 PWA，可离线访问关键页面并缓存食物库。

## 功能特性

### 核心追踪

- 用户引导设置：性别、年龄、身高、体重、体脂、活动量、目标、训练日
- BMR / TDEE 自动计算
- 碳循环周计划自动生成
- 首页圆环进度、剩余热量、周历视图
- 餐次记录：早餐 / 午餐 / 晚餐 / 加餐
- 身体记录：体重、体脂、腰围、备注、对比照
- 运动记录：快速添加、时长、消耗热量

### 智能功能

- 智能食物推荐：基于当天剩余热量与宏量营养推荐食物
- AI 搭配今日饮食：根据剩余餐次和食物库自动生成建议组合
- 饮食模板系统：保存和一键应用常用饮食组合
- 周报系统：自动生成本周 vs 上周对比
- 成就系统：连续打卡、记录天数、减重进度

### PWA 能力

- `next-pwa` 配置完成
- 支持离线 fallback 页面
- 缓存食物库接口 `/api/food-items`
- 安装到桌面提示条
- 多尺寸图标与 `manifest.json`

### 录入增强

- Open Food Facts 条码查询接口代理
- 浏览器支持时可直接调用 `BarcodeDetector` 进行扫码
- 全局 toast 通知、加载状态、错误提示

### 工程化与安全

- Prisma + SQLite 本地开发
- Prisma + Supabase PostgreSQL 生产部署
- API 输入校验：Zod
- API 基础限流：按 IP + 时间窗口
- Docker 化部署
- Vercel 部署配置
- GitHub Actions CI/CD

## 技术栈说明

### 前端

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui 风格基础组件
- Zustand
- Recharts

### 后端与数据

- Prisma ORM
- SQLite（本地开发）
- Supabase PostgreSQL（生产环境）
- Zod（接口校验）

### PWA 与部署

- next-pwa
- Service Worker / Workbox
- Docker
- Vercel
- GitHub Actions

## 本地开发指南

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制本地示例：

```bash
cp .env.example .env
```

默认本地使用 SQLite：

```env
APP_ENV="development"
DATABASE_URL="file:./dev.db"
PRISMA_SCHEMA_PATH="prisma/schema.prisma"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RATE_LIMIT_MAX_REQUESTS="60"
RATE_LIMIT_WINDOW_MS="60000"
```

### 3. 生成 Prisma Client 与初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

### 5. 常用命令

```bash
npm test
npm run lint
npm run build
```

## PWA 说明

项目已经内置以下 PWA 资源与配置：

- `public/manifest.json`
- `next.config.mjs` 中的 `next-pwa`
- `worker/index.js` 自定义 Service Worker 扩展
- `app/%5Foffline/page.tsx` 离线回退页面，对应 `/_offline`
- `components/pwa/install-prompt-banner.tsx` 安装到桌面提示

食物库接口 `GET /api/food-items` 会被缓存，用于离线浏览最近同步的数据。

## 部署说明

### 一、生产数据库迁移到 Supabase PostgreSQL

生产环境使用独立 Prisma schema：

```text
prisma/schema.postgres.prisma
```

请准备 Supabase 两条连接串：

- `DATABASE_URL`
  - 用于应用运行
  - 建议填 Supabase 池化连接串
- `DIRECT_URL`
  - 用于 Prisma migration / deploy
  - 建议填直连数据库连接串

生产环境示例见：

```text
.env.production.example
```

生成生产 Prisma Client：

```bash
npm run prisma:generate:prod
```

执行生产迁移：

```bash
npm run prisma:migrate:prod
```

### 二、Vercel 部署

项目已提供：

- `vercel.json`
- `build:prod` 脚本
- PostgreSQL Prisma schema 生成脚本

Vercel 需要配置的环境变量至少包括：

```env
DATABASE_URL=
DIRECT_URL=
PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma
NEXT_PUBLIC_APP_URL=
RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_WINDOW_MS=60000
```

建议在 Vercel 项目中把 `PRISMA_SCHEMA_PATH` 固定为：

```env
prisma/schema.postgres.prisma
```

### 三、Docker 部署

项目已提供多阶段构建 `Dockerfile`。

构建镜像：

```bash
docker build -t carbcycle-tracker .
```

运行容器：

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e DIRECT_URL="postgresql://..." \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.com" \
  carbcycle-tracker
```

说明：

- Docker 镜像默认按生产 PostgreSQL schema 构建
- 建议在容器启动前或 CI/CD 中单独执行 `npm run prisma:migrate:prod`

### 四、GitHub Actions CI/CD

项目已提供：

```text
.github/workflows/ci-cd.yml
```

CI 会执行：

- `npm ci`
- `npm run prisma:generate`
- `npm test`
- `npm run lint`
- `npm run build`

推送到 `main` 且配置了以下 secrets 时，会自动部署到 Vercel：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`

## 微信小程序 web-view 壳

项目已新增一个独立小程序壳工程：

```text
miniapp/
```

使用方式：

1. 用微信开发者工具打开 `miniapp/`
2. 将 `miniapp/project.config.json` 中的 `appid` 替换为真实 AppID
3. 将 `miniapp/miniprogram/config.js` 中的 `WEB_APP_URL` 替换为正式 HTTPS 域名
4. 在微信小程序后台完成业务域名、合法请求域名、隐私政策与用户协议配置

更多检查项见：

```text
docs/wechat-webview-checklist.md
```

## API 安全与校验

### 输入校验

已通过 Zod 为以下接口增加输入校验：

- `/api/users`
- `/api/food-items`
- `/api/meal-logs`
- `/api/daily-plans`
- `/api/body-records`
- `/api/exercise-logs`
- `/api/barcode/[barcode]`

### 限流

已为主要 API 路由增加基础限流：

- 基于 IP + 路由 key
- 返回 `429` 与 `X-RateLimit-*` 响应头
- 可通过环境变量统一调节时间窗与最大请求数

说明：

- 当前实现为进程内存级限流
- 单实例部署已可用
- 如需多实例 / 多区域强一致限流，建议后续替换为 Redis / Upstash 方案

## 目录结构

```text
app/
  (shell)/
  api/
  %5Foffline/
  onboarding/
components/
  navigation/
  providers/
  pwa/
  screens/
  tracker/
  ui/
hooks/
lib/
prisma/
  schema.prisma
  schema.postgres.prisma
store/
worker/
public/
  icons/
```

## 截图展示区域

后续可在这里补充真实截图：

| 页面 | 截图 |
| --- | --- |
| 首页 Dashboard | `docs/screenshots/dashboard.png` |
| 引导页 Onboarding | `docs/screenshots/onboarding.png` |
| 添加食物 | `docs/screenshots/add-food.png` |
| 计划页 | `docs/screenshots/plan.png` |
| 统计页 | `docs/screenshots/stats.png` |
| 设置页 | `docs/screenshots/settings.png` |

也可以直接替换成 Markdown 图片：

```md
![首页](docs/screenshots/dashboard.png)
![添加食物](docs/screenshots/add-food.png)
```

## 备注

- 本地默认是 SQLite，方便快速开发
- 生产建议使用 Supabase PostgreSQL
- 若浏览器不支持 `BarcodeDetector`，扫码区会自动回退到“手动输入条码”
- `build:prod` 已按 PostgreSQL 方案验证通过
