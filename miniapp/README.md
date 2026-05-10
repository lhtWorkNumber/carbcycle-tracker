# CarbCycle Tracker 微信小程序壳

这个目录是微信小程序 `web-view` 壳工程，用来承载已上线的 H5 / PWA 版本。

## 使用方式

1. 用微信开发者工具打开 `miniapp/`
2. 把 `project.config.json` 里的 `appid` 替换成真实小程序 AppID
3. 把 `miniprogram/config.js` 里的 `WEB_APP_URL` 替换成正式 HTTPS H5 入口
4. 确认生产环境 `NEXT_PUBLIC_APP_URL` 与 `WEB_APP_URL` 使用同一个 HTTPS origin
5. 在小程序后台配置业务域名、request 合法域名、隐私政策、用户协议与隐私保护指引
6. 按 [`../docs/miniapp-submission-materials.md`](../docs/miniapp-submission-materials.md) 准备提审材料

## 目录说明

```text
miniprogram/
  app.js
  app.json
  app.wxss
  config.js
  pages/
    index/
    webview/
```

`pages/index` 是启动页，`pages/webview` 使用微信 `web-view` 打开线上 H5。

`web-view` 入口只允许打开 `WEB_APP_URL` 同源页面。需要从启动页进入 H5 子路径时，可以传入同源完整 URL 或 `/path`，不要传入第三方 URL。

## 隐私与权限口径

- 小程序壳当前不声明原生摄像头、相册、上传或下载权限。
- 条码扫码发生在 H5 `web-view` 内，用户点击后由浏览器请求摄像头，仅用于本地识别包装条码，不上传、不保存视频流；扫码不可用时必须保留手动输入条码。
- 食物图片可能来自 Open Food Facts 商品图、内置同源静态兜底图或后续用户填写的自定义图片 URL；第三方图片加载失败不能阻断核心记录流程。
- 自定义食物已有用户归属代码路径，提审前仍需确认迁移、接口过滤、前端展示和测试账号数据隔离均验收通过，再在正式材料中承诺“仅当前账号可见”。
- 身体记录 API / schema 已预留对比照 URL 字段，但当前前端仍只做浏览器本地预览，不上传、不传 URL；若后续保存 URL 或上传路径，需要先补上传域名、访问权限、删除方式、保留期限和隐私材料。

## 发布材料

- [微信小程序 web-view 上线清单](../docs/wechat-webview-checklist.md)
- [小程序提审与合规审计记录](../docs/miniapp-release-audit.md)
- [小程序提审材料清单](../docs/miniapp-submission-materials.md)
- [隐私政策草案](../docs/privacy-policy-draft.md)
- [用户协议草案](../docs/terms-of-service-draft.md)
- [个人信息收集说明草案](../docs/personal-information-collection-list.md)
- [第三方服务说明草案](../docs/third-party-services.md)

## 发布前检查

### 代码已具备

- 小程序壳工程、启动页和 `web-view` 页面已在当前目录内。
- H5 入口集中放在 `miniprogram/config.js`，便于切换正式域名。

### 后台 / 主体 / 域名待办

- H5 域名必须是 HTTPS。
- H5 域名必须完成小程序业务域名校验，并与 `miniprogram/config.js` 的 `WEB_APP_URL` origin 一致。
- `project.config.json` 需要替换真实 AppID。
- 微信后台需要配置 request 合法域名；同源 API 填 H5 origin，独立 API 需额外加入 API origin。
- 当前小程序壳不调用 `wx.uploadFile` / `wx.downloadFile`；如 H5 CSV 导出不触发原生下载，可在审核备注中说明“不涉及原生上传 / 下载能力”。若食物图片或身体对比照改成上传能力，需重新配置上传域名并更新提审材料。
- 隐私政策、用户协议、个人信息收集说明需要发布为线上可访问页面。

### 真机待验

- 登录、记录、统计、设置等核心路径需要在微信内真机验证。
- 摄像头扫码、拒绝授权提示、手动输入条码兜底和 CSV 导出需要在微信内验证兼容性。
- 食物图片加载失败时的兜底展示需要在微信内验证；内置兜底图已随 H5 静态资源同源提供。
- 身体对比照当前仅本地预览，不应在提审材料中描述为已上传保存。
- PWA 安装提示在微信内不会作为核心能力使用。
- Magic Link 或邮箱登录回调需要在 iOS / Android 微信内分别验证。
- 协议、隐私、反馈、导出和注销 / 删除数据入口需要在设置页或固定入口可访问。
