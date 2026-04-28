# 微信小程序 web-view 上线清单

## 当前代码状态

- [x] 已新增小程序壳工程：`miniapp/`
- [x] 已新增启动页：`miniapp/miniprogram/pages/index`
- [x] 已新增 `web-view` 页面：`miniapp/miniprogram/pages/webview`
- [x] H5 地址集中配置在：`miniapp/miniprogram/config.js`
- [x] 小程序工程说明已写入：`miniapp/README.md`

## 上线前必须完成

- [ ] 替换 `miniapp/project.config.json` 中的真实 AppID
- [ ] 替换 `miniapp/miniprogram/config.js` 中的正式 HTTPS 域名
- [ ] 在微信小程序后台配置业务域名
- [ ] 在微信小程序后台配置 request 合法域名
- [ ] 准备隐私政策、用户协议、个人信息收集说明
- [ ] 用真机验证微信内登录、记录、统计、设置流程

## H5 配合项

- [ ] 正式域名启用 HTTPS
- [ ] Supabase Auth 回调地址包含正式域名
- [ ] 微信内打开时隐藏或弱化 PWA 安装提示
- [ ] 条码扫描在微信内提供手动输入或后续切换 `wx.scanCode`
- [ ] CSV 导出在微信内验证兼容性，不兼容时给出明确提示

## 提审前检查

- [ ] 小程序名称、类目、头像、简介已配置
- [ ] 小程序截图与功能描述已准备
- [ ] 隐私协议内容与实际收集信息一致
- [ ] 线上 H5 可稳定访问
- [ ] 小程序内核心路径无阻断级错误
