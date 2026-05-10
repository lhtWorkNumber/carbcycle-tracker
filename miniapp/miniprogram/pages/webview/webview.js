const config = require("../../config");

function getOrigin(url) {
  const match = /^(https:\/\/[^/?#]+)(?:[/?#]|$)/.exec(url);
  return match ? match[1].toLowerCase() : "";
}

function resolveUrl(options) {
  const configuredOrigin = getOrigin(config.WEB_APP_URL);

  if (options.url) {
    const decodedUrl = decodeURIComponent(options.url);

    if (decodedUrl.charAt(0) === "/" && configuredOrigin) {
      return `${configuredOrigin}${decodedUrl}`;
    }

    return decodedUrl;
  }

  return config.WEB_APP_URL;
}

function isAllowedWebviewUrl(url) {
  const configuredOrigin = getOrigin(config.WEB_APP_URL);
  const targetOrigin = getOrigin(url);

  return Boolean(configuredOrigin) &&
    configuredOrigin.indexOf("your-domain.com") === -1 &&
    targetOrigin === configuredOrigin;
}

Page({
  data: {
    src: ""
  },

  onLoad(options) {
    const src = resolveUrl(options);

    if (!isAllowedWebviewUrl(src)) {
      wx.showToast({
        title: "H5 地址未配置",
        icon: "none"
      });
      wx.navigateBack();
      return;
    }

    this.setData({ src });
  },

  handleMessage(event) {
    console.log("web-view message", event.detail);
  },

  handleError(event) {
    console.error("web-view error", event.detail);
    wx.showToast({
      title: "页面加载失败",
      icon: "none"
    });
  }
});
