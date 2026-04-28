# CarbCycle Tracker 微信小程序壳

这个目录是微信小程序 `web-view` 壳工程，用来承载已上线的 H5 / PWA 版本。

## 使用方式

1. 用微信开发者工具打开 `miniapp/`
2. 把 `project.config.json` 里的 `appid` 替换成真实小程序 AppID
3. 把 `miniprogram/config.js` 里的 `WEB_APP_URL` 替换成正式 HTTPS 域名
4. 在小程序后台配置业务域名、request 合法域名、隐私政策与用户协议

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

## 发布前检查

- H5 域名必须是 HTTPS
- H5 域名必须完成小程序业务域名校验
- 登录、记录、设置等核心路径需要在微信内真机验证
- PWA 安装提示在微信内不会作为核心能力使用
