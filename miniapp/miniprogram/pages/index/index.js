const config = require("../../config");

function getOrigin(url) {
  const match = /^(https:\/\/[^/?#]+)(?:[/?#]|$)/.exec(url);
  return match ? match[1].toLowerCase() : "";
}

function resolveTargetUrl(rawUrl) {
  const configuredOrigin = getOrigin(config.WEB_APP_URL);

  if (!rawUrl) {
    return config.WEB_APP_URL;
  }

  const decodedUrl = decodeURIComponent(rawUrl);

  if (decodedUrl.charAt(0) === "/" && configuredOrigin) {
    return `${configuredOrigin}${decodedUrl}`;
  }

  return decodedUrl;
}

function isConfiguredUrl(url) {
  const configuredOrigin = getOrigin(config.WEB_APP_URL);
  const targetOrigin = getOrigin(url);

  return Boolean(configuredOrigin) &&
    configuredOrigin.indexOf("your-domain.com") === -1 &&
    targetOrigin === configuredOrigin;
}

Page({
  data: {
    targetUrl: config.WEB_APP_URL,
    canOpen: isConfiguredUrl(config.WEB_APP_URL)
  },

  onLoad(options) {
    if (options.url) {
      const targetUrl = resolveTargetUrl(options.url);
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
