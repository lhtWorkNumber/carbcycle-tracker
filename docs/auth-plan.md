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
- Task 2：登录页、Magic Link 登录、登录回调、当前用户上下文基础版
- Task 3：用户资料正式入库的后端字段与 API 改造基础

本轮仍未完成：

- 基于真实登录用户的完整资料读取覆盖
- 所有业务页面按登录用户读取真实后端数据
- 完整的未登录保护策略
- 业务记录按 auth 用户写库

这些属于后续 Task 3 / Task 4。

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

1. 创建登录页与登录表单
2. 建立当前用户上下文
3. 引导页完成后把用户资料写入数据库
4. 把前端 store 从“默认 demo 用户”切换成“当前登录用户”

---

## 风险提示

### 1. 现在还没有真正用户登录

虽然基础设施已经准备好，但用户仍然不能真正登录。

### 2. 业务数据仍未按 auth 用户隔离

当前 API 还没有基于 Supabase session 做用户身份绑定。

### 3. 当前还是“认证基础设施就绪”，不是“正式用户体系完成”

所以这一步完成后，不代表用户系统已经上线，只代表后续实现路径已经固定。
