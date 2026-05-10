# CarbCycle Tracker 鉴权方案决策

## 结论

当前项目采用：

- **Supabase Auth** 作为用户鉴权与会话管理方案
- **Supabase PostgreSQL** 作为生产数据库
- **Next.js App Router + `@supabase/ssr`** 作为前后端会话同步方案

这是当前项目最合适的方案，因为它和已有的：

- Supabase PostgreSQL 生产计划
- Next.js 14 App Router
- Prisma 数据层

可以自然协同，落地成本最低。

---

## 为什么选 Supabase Auth

### 优点

- 与 Supabase PostgreSQL 同生态
- 支持邮箱登录、Magic Link、OAuth 等
- 有成熟的 Next.js SSR 方案
- 前端、服务端、中间件三层都好接
- 后续如果要上微信生态，也方便统一账号体系

### 当前阶段最适合的登录方式

第一阶段建议优先：

- 邮箱 OTP / Magic Link

原因：

- 开发快
- 审核阻力小
- 不需要先接手机短信服务

后续可再追加：

- 手机号验证码
- 微信登录

---

## 当前任务范围

本轮已完成：

- Task 1：鉴权方案定型与基础设施准备
- Task 2：登录页、Magic Link 登录、登录回调、当前用户上下文
- Task 3：用户资料正式入库，并支持引导页与设置页保存资料
- Task 4：核心业务数据按当前登录用户读取与写入
- Task 5：正式数据模式下的 shell 页面登录保护与资料完成保护

当前代码已覆盖：

- `/api/bootstrap` 基于当前登录用户一次性拉取资料、餐食、身体记录、运动、每日计划、模板、饮水、周报与成就数据
- `/api/users` 基于 Supabase session 读取 / upsert 当前用户资料
- `/api/meal-logs`、`/api/body-records`、`/api/exercise-logs`、`/api/daily-plans` 按当前 auth 用户写库
- `/api/meal-templates`、`/api/water-logs`、`/api/weekly-summaries`、`/api/achievements` 按当前数据库用户隔离
- Supabase 已配置时，`(shell)` 业务页面要求先登录；已登录但未完成资料的用户会进入 `/onboarding`

仍需在真实环境验证：

- 配置真实 Supabase 项目的邮箱 OTP / Magic Link 回跳
- 使用真实浏览器会话完成登录、引导、记录、刷新后的数据恢复回归
- 生产 Supabase PostgreSQL 迁移与 Vercel 环境变量联调

---

## 已新增文件

- `lib/supabase/env.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `middleware.ts`

---

## 环境变量

本地与生产都需要：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

说明：

- 当前阶段只需要匿名公钥即可
- 后续如果接服务端管理能力，再按需增加 service role key

---

## 下一步任务

建议按这个顺序继续：

1. 在 Supabase 项目中配置 Auth URL、邮件模板与允许的重定向地址
2. 用真实账号跑通 Magic Link 登录、引导资料入库和 shell 页面保护
3. 部署到 Vercel 后验证 PostgreSQL 生产 schema、cookie 与回调域名
4. 根据真实使用反馈决定是否追加手机号验证码、微信登录或原生小程序登录

---

## 风险提示

### 1. 需要真实 Supabase 环境联调

代码路径已经接好，但 Magic Link 是否可达取决于 Supabase 项目的 Auth 配置、邮件投递和重定向白名单。

### 2. 自定义食物用户归属仍需回归

当前代码路径已为 `FoodItem` 增加可空 `user_id` 字段，并在创建 / 查询自定义食物时按当前用户处理。上线前仍需确认数据库迁移已执行、旧自定义食物数据归属策略已明确、接口过滤和前端展示通过跨账号回归。

### 3. 生产环境仍需完成数据库与域名回归

Vercel、Supabase PostgreSQL、邮件回跳域名和 PWA 缓存需要在同一套生产配置下完成回归后再上线。
