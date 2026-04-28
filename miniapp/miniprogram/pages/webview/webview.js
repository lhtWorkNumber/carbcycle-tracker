const config = require("../../config");

function resolveUrl(options) {
  if (options.url) {
    return decodeURIComponent(options.url);
  }

  return config.WEB_APP_URL;
}

Page({
  data: {
    src: ""
  },

  onLoad(options) {
    const src = resolveUrl(options);

    if (!/^https:\/\/[^/]+/.test(src)) {
      wx.showToast({
        title: "H5 地址无效",
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
