# CarbCycle Tracker 上线检查清单

> 说明：已勾选项表示代码侧已具备、文档草案已准备，或已在本地验证；涉及真实生产凭据、正式域名、微信后台、备案、真机审核和运营值守的项目仍保留为待办。
>
> 状态标识：
>
> - `代码已具备`：仓库内已有实现或配置占位。
> - `后台/主体待办`：依赖微信公众平台、Supabase、Vercel、备案、主体认证或第三方后台。
> - `域名待办`：依赖正式 HTTPS 域名、业务域名、回调地址或合法域名配置。
> - `真机待验`：需要微信开发者工具、体验版或真实手机验证。
> - `人工待补`：需要运营主体、联系方式、截图、测试账号或法务确认。

---

## A. 产品基础检查

- [x] 首页、计划、添加食物、统计、身体记录、运动、设置全部可访问
- [ ] 引导页可以完整走通
- [ ] 引导完成后用户资料能保存
- [ ] 退出再进入后数据可恢复
- [x] 空状态和错误状态都有明确提示

---

## B. 用户与鉴权

- [x] 已有正式登录方案
- [x] 未登录用户无法读取他人数据
- [x] 用户资料与记录按用户隔离
- [x] token / session 刷新机制明确
- [ ] 退出登录流程正常

---

## C. 核心数据流

- [x] 餐食记录真实写库
- [x] 身体记录真实写库
- [x] 运动记录真实写库
- [x] 饮水记录真实写库
- [x] 每日计划真实写库
- [x] 模板真实写库
- [x] 周报真实写库
- [x] 成就状态真实写库

---

## D. Demo 依赖排查

- [x] 正式环境不读取 demo fallback
- [x] 数据库失败时有显式报错
- [x] 不再依赖本地默认用户作为正式数据来源
- [x] 不再依赖默认餐食 / 默认饮水 / 默认成就作为真实用户数据

---

## E. API 与安全

- [x] 所有写接口已加 Zod 校验
- [x] 所有关键读接口已做权限校验
- [x] 限流策略明确
- [ ] 敏感接口已考虑分布式限流替代方案
- [x] 错误响应统一
- [x] 非法请求有可理解报错

---

## F. 数据库与迁移

- [x] SQLite 仅用于本地开发
- [x] 生产环境使用 Supabase PostgreSQL
- [x] Prisma PostgreSQL schema 已验证
- [ ] 生产迁移可执行
- [ ] 迁移失败有回滚预案
- [ ] 数据备份策略已确认

---

## G. PWA 检查

- [x] `manifest.json` 可访问
- [x] 图标尺寸完整
- [x] `sw.js` 正常生成
- [x] 离线页可访问
- [x] 食物库接口离线缓存可用
- [x] 安装到桌面提示正常触发

---

## H. 部署检查

### Vercel

- [ ] `DATABASE_URL` 已配置（后台/主体待办）
- [ ] `DIRECT_URL` 已配置（后台/主体待办）
- [ ] `PRISMA_SCHEMA_PATH` 已配置（后台/主体待办）
- [ ] `NEXT_PUBLIC_APP_URL` 已配置为正式 HTTPS 域名（域名待办）
- [x] 构建命令为 `npm run build:prod`

### Docker

- [ ] 镜像可构建
- [ ] 容器可启动
- [ ] 环境变量注入正常
- [ ] 与生产数据库连通正常

### GitHub Actions

- [x] CI 配置已提供
- [x] PR 会执行测试 / lint / build
- [x] main 分支 push 会触发部署

---

## I. 监控与运维

- [x] 接入错误监控
- [x] 接入基础访问日志
- [x] 有慢接口监控
- [ ] 有可用性监控
- [ ] 上线当天有值守计划

---

## J. 微信小程序 `web-view` 上线前

### 代码已具备

- [x] 小程序壳工程已提供：[`../miniapp/`](../miniapp/)
- [x] 启动页已提供：[`../miniapp/miniprogram/pages/index`](../miniapp/miniprogram/pages/index)
- [x] `web-view` 页面已提供：[`../miniapp/miniprogram/pages/webview`](../miniapp/miniprogram/pages/webview)
- [x] H5 地址集中配置在：[`../miniapp/miniprogram/config.js`](../miniapp/miniprogram/config.js)
- [x] 小程序工程说明已提供：[`../miniapp/README.md`](../miniapp/README.md)
- [x] 提审材料清单草案已提供：[`miniapp-submission-materials.md`](./miniapp-submission-materials.md)

### 后台 / 主体 / 域名待办

- [ ] 小程序主体已认证（后台/主体待办）
- [ ] 小程序 AppID 已替换到 `miniapp/project.config.json`（后台/主体待办）
- [ ] 正式 H5 域名已启用 HTTPS，且与 `NEXT_PUBLIC_APP_URL` / `WEB_APP_URL` 使用同一 origin（域名待办）
- [ ] 业务域名已备案、校验并配置（域名待办）
- [ ] request 合法域名已配置；同源 API 填 H5 origin，独立 API 额外填 API origin（域名待办）
- [ ] uploadFile / downloadFile 合法域名已按真实能力配置；当前不调用原生上传 / 下载时已在审核备注说明（域名待办）
- [ ] Supabase Auth 回调地址包含正式域名（后台/主体待办）
- [ ] 隐私政策、用户协议、个人信息收集说明线上页面已发布（人工待补）
- [ ] 小程序文案、截图、测试账号和审核备注已按 [`miniapp-submission-materials.md`](./miniapp-submission-materials.md) 模板准备（人工待补）

### 真机待验

- [ ] 微信内登录、记录、统计、设置流程可用（真机待验）
- [ ] 邮箱登录 / Magic Link 回调在 iOS 和 Android 微信内可回到 H5（真机待验）
- [ ] 摄像头扫码授权弹窗、拒绝授权提示和关闭摄像头流程在微信内可用（真机待验）
- [ ] 条码查询在微信内可用；若 `BarcodeDetector`、摄像头或微信内核不兼容，手动输入条码路径可完成查询（真机待验）
- [ ] CSV 导出在微信内可接受，或有明确提示（真机待验）
- [ ] 返回、重新进入、弱网场景无阻断白屏（真机待验）
- [ ] 协议、隐私、反馈、导出和注销 / 删除数据入口在微信内可访问（真机待验）

---

## K. 法务与合规

- [x] 用户协议草案：[`terms-of-service-draft.md`](./terms-of-service-draft.md)
- [x] 隐私政策草案：[`privacy-policy-draft.md`](./privacy-policy-draft.md)
- [x] 个人信息收集说明草案：[`personal-information-collection-list.md`](./personal-information-collection-list.md)
- [x] 第三方服务说明草案（Supabase / Open Food Facts / Vercel / 微信等）：[`third-party-services.md`](./third-party-services.md)
- [x] 合规草案已补充摄像头扫码用途、手动条码兜底、Open Food Facts 商品图 / 内置同源静态图 / 自定义图片 URL 来源、自定义食物用户归属待验收口径、身体对比照当前仅本地预览口径
- [ ] 运营主体、联系方式、通信地址、投诉反馈入口已补齐（人工待补）
- [ ] 账号注销 / 删除全部数据 / 撤回授权处理流程已补齐（人工待补）
- [ ] 自定义食物用户归属已完成数据库迁移、接口过滤、前端展示、跨账号隔离和测试账号验收；验收前不得在正式隐私材料中承诺用户私有（人工待补）
- [ ] 若身体对比照上线为 URL 或上传路径，图片上传域名、访问权限、删除方式、保留期限和隐私政策已同步更新（人工待补）
- [ ] 法务或负责人完成正式版确认（人工待补）
- [ ] 合规页面已部署到正式 HTTPS URL，并可从 H5 / 小程序访问（域名待办）

---

## L. 发布前最后回归

- [ ] 添加食物
- [ ] 应用模板
- [ ] 摄像头条码识别
- [ ] 手动输入条码兜底
- [ ] 饮水增加
- [ ] 保存身体记录
- [ ] 身体对比照本地预览不上传、不随记录保存；若前端 / API 已改为上传，则按隐私口径重新验收
- [ ] 保存运动记录
- [ ] 导出 CSV
- [ ] 深色模式
- [ ] 周报查看
- [ ] 成就展示

---

## M. 小程序提审材料

- [x] 提审与合规审计记录已准备：[`miniapp-release-audit.md`](./miniapp-release-audit.md)
- [x] 提审材料清单草案已准备：[`miniapp-submission-materials.md`](./miniapp-submission-materials.md)
- [ ] 小程序名称、头像、简介、服务类目已确认（人工待补）
- [ ] 测试账号、测试步骤和审核备注已准备（人工待补）
- [ ] 首页、引导、记录、统计、设置截图已准备（人工待补）
- [ ] 微信开发者工具上传体验版完成（后台/主体待办）
- [ ] 体验版真机回归通过（真机待验）
