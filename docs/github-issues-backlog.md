# CarbCycle Tracker GitHub Issues 任务池

> 用法建议：
> 1. 先创建 Epic
> 2. 再把对应子任务拆成独立 Issue
> 3. 每个 Issue 都带验收标准

---

## Epic 1：正式用户体系

### Issue 1.1 接入用户登录与会话

**目标**

为应用增加正式登录机制，替代当前本地单用户模式。

**任务**

- 选定鉴权方案
- 接入登录
- 建立当前用户上下文

**验收标准**

- 用户可登录 / 退出
- 登录后页面可识别当前用户

### Issue 1.2 引导页资料正式入库

**目标**

引导页完成后不再只写 Zustand，本地状态只作为缓存。

**参考位置**

- [`components/screens/onboarding-flow.tsx`](../components/screens/onboarding-flow.tsx)
- [`store/tracker-store.ts`](../store/tracker-store.ts)

**验收标准**

- 刷新后资料仍存在
- 多设备登录能看到同一份资料

---

## Epic 2：核心记录写库

### Issue 2.1 餐食记录接真实 API

**目标**

首页、添加食物页写入真实餐食记录。

**验收标准**

- 添加后刷新不丢失
- 数据来自服务端

### Issue 2.2 身体记录接真实 API

### Issue 2.3 运动记录接真实 API

### Issue 2.4 每日计划接真实 API

### Issue 2.5 去掉正式路径 demo fallback

**参考位置**

- [`app/(shell)/add-food/page.tsx`](../app/(shell)/add-food/page.tsx)
- [`app/(shell)/settings/page.tsx`](../app/(shell)/settings/page.tsx)
- [`lib/demo-data.ts`](../lib/demo-data.ts)

---

## Epic 3：高级功能持久化

### Issue 3.1 新增 MealTemplate 数据模型

### Issue 3.2 新增 WaterLog 数据模型

### Issue 3.3 新增 WeeklySummary 数据模型

### Issue 3.4 新增 AchievementProgress 数据模型

### Issue 3.5 模板、饮水、周报、成就接真实后端

**验收标准**

- 所有数据跨设备一致

---

## Epic 4：生产环境准备

### Issue 4.1 切换生产数据库到 Supabase PostgreSQL

**参考位置**

- [`prisma/schema.postgres.prisma`](../prisma/schema.postgres.prisma)
- [`prisma.config.ts`](../prisma.config.ts)

### Issue 4.2 演练生产迁移

### Issue 4.3 Vercel 环境变量与部署流程验证

### Issue 4.4 Docker 镜像验证

### Issue 4.5 增加 staging 环境

---

## Epic 5：监控与稳定性

### Issue 5.1 接入错误监控

### Issue 5.2 增加 API 操作日志

### Issue 5.3 增加健康检查接口

### Issue 5.4 修复 build/dev 切换导致的 `.next` 污染问题

**说明**

这个问题在开发环境里表现为：

- `/_next/static/...` 资源 404 / 500
- dev server 出现 `Cannot find module './276.js'`

---

## Epic 6：微信小程序 `web-view`

### Issue 6.1 创建小程序壳工程

### Issue 6.2 配置业务域名与合法域名

### Issue 6.3 创建 `web-view` 页面与入口页

### Issue 6.4 补隐私政策与提审材料

### Issue 6.5 微信内登录兼容

**验收标准**

- 微信中能正常打开
- 登录、查看、记录可完成

---

## Epic 7：原生小程序预研

### Issue 7.1 评估 Taro 迁移方案

### Issue 7.2 抽离共享业务包

### Issue 7.3 评估图表、扫码、上传替代方案

### Issue 7.4 输出原生小程序技术设计文档

---

## 优先级建议

### P0

- 用户登录
- 用户资料入库
- 餐食 / 身体 / 运动 / 计划写库
- 去 demo fallback
- 生产数据库与部署

### P1

- 模板 / 饮水 / 周报 / 成就持久化
- 错误监控
- staging 环境
- 微信小程序 `web-view`

### P2

- 原生小程序预研
- 更复杂 AI 能力
- 更细粒度权限系统

