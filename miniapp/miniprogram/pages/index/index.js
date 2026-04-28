const config = require("../../config");

function isConfiguredUrl(url) {
  return /^https:\/\/[^/]+/.test(url) && url.indexOf("your-domain.com") === -1;
}

Page({
  data: {
    targetUrl: config.WEB_APP_URL,
    canOpen: isConfiguredUrl(config.WEB_APP_URL)
  },

  onLoad(options) {
    if (options.url) {
      const targetUrl = decodeURIComponent(options.url);
      this.setData({
        targetUrl,
        canOpen: isConfiguredUrl(targetUrl)
      });
    }
  },

  openWebview() {
    const { targetUrl, canOpen } = this.data;

    if (!canOpen) {
      wx.showToast({
        title: "请先配置域名",
        icon: "none"
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(targetUrl)}`
    });
  }
});
