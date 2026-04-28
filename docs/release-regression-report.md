# Web / PWA 发布前回归报告

## 当前回归结论

截至本次迭代，当前项目已经完成：

- 用户登录基础设施
- 当前用户数据回填
- 餐食 / 身体 / 运动 / 周计划真实写库
- 模板 / 饮水 / 周报 / 成就真实写库
- 统一 bootstrap 聚合读取
- 基础生产环境校验
- 健康检查与结构化日志

目前整体判断：

- **适合继续内测**
- **接近可正式上线**
- 正式上线前建议再做一轮真机与生产环境联调

## 本次继续验证结果

验证时间：`2026-04-28 23:38`（Asia/Shanghai）

本次继续执行后确认：

- `npm run check:env` 通过
- `npm run check:db` 通过
- `npm test` 通过，`12` 个测试全部通过
- `npm run lint` 通过
- `npm run build` 通过
- `npm run dev:reset` 后开发服务正常启动
- `GET /api/healthz` 返回 `200`
- `GET /api/food-items` 返回 `200`

此前浏览器日志中出现的 `/api/food-items` `500`，在清理 `.next` 并用 `dev:reset` 重启后未复现，判断仍属于已记录的开发环境缓存污染问题。

本次还新增了微信小程序 `web-view` 壳工程：

- `miniapp/project.config.json`
- `miniapp/miniprogram/pages/index`
- `miniapp/miniprogram/pages/webview`
- `miniapp/miniprogram/config.js`

## 本轮人工回归结果

已在干净开发环境下通过浏览器验证主要页面：

- 首页 `/`
- 统计页 `/stats`
- 计划页 `/plan`
- 添加食物页 `/add-food?meal=breakfast`
- 身体记录页 `/record`
- 运动记录页 `/exercise`
- 设置页 `/settings`
- 登录页 `/login`

说明：

- 并行打开多个页面时，`next dev` 首次编译阶段可能出现 `ERR_ABORTED`，单独重试后页面可正常打开。
- 这属于开发模式热编译行为，不属于当前页面运行时阻断错误。

## 已验证命令

```bash
npm run check:env
npm test
npm run lint
npm run build
```

## 已知工程边界

### 1. `.next` 缓存污染

在先执行 `next build` 再回到 `next dev` 的场景下，开发环境偶发出现静态资源 404 / 模块找不到。

当前处理方式：

- 增加 `dev:reset`

```bash
npm run dev:reset
```

如果开发环境行为异常，优先使用这个命令重启。

### 2. 统计页已切到真实 store 数据

此前统计页部分数据仍依赖 demo 快照。现在已改成基于当前真实 store 推导。

### 3. 生产环境仍需要真实 Supabase 凭据验证

当前生产链路已经具备：

- Prisma PostgreSQL schema
- build:prod
- env 校验
- Docker / Vercel / CI

但正式上线前仍要用真实 Supabase 项目做一次完整联调。

## 发布前建议再补一轮人工回归

- 登录 Magic Link 全流程
- onboarding 保存资料
- 添加食物并刷新验证
- 保存身体记录并刷新验证
- 保存运动记录并刷新验证
- 修改计划并刷新验证
- 保存模板 / 饮水并刷新验证
- 断网后打开已缓存页面
- 移动端浏览器安装 PWA
