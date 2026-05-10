export type WechatMiniappEnv = {
  appId: string;
  appSecret: string;
};

export type WechatCodeSession = {
  openid: string;
  sessionKey: string;
  unionid?: string;
};

export type WechatPhoneInfo = {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: string;
  watermark: {
    appid: string;
    timestamp: number;
  };
};

type WechatCodeSessionResponse =
  | {
      openid: string;
      session_key: string;
      unionid?: string;
      errcode?: never;
      errmsg?: never;
    }
  | {
      errcode: number;
      errmsg: string;
    };

type WechatPhoneNumberResponse =
  | {
      errcode: 0;
      errmsg: string;
      phone_info: WechatPhoneInfo;
    }
  | {
      errcode: number;
      errmsg: string;
    };

export class WechatMiniappApiError extends Error {
  constructor(
    message: string,
    readonly code: number
  ) {
    super(message);
    this.name = "WechatMiniappApiError";
  }
}

export function isWechatMiniappConfigured() {
  return Boolean(process.env.WECHAT_MINIAPP_APP_ID && process.env.WECHAT_MINIAPP_APP_SECRET);
}

export function getWechatMiniappEnv(): WechatMiniappEnv {
  const appId = process.env.WECHAT_MINIAPP_APP_ID;
  const appSecret = process.env.WECHAT_MINIAPP_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("微信小程序环境变量未配置：WECHAT_MINIAPP_APP_ID / WECHAT_MINIAPP_APP_SECRET。");
  }

  return {
    appId,
    appSecret
  };
}

export async function exchangeWechatLoginCode(code: string, env = getWechatMiniappEnv()): Promise<WechatCodeSession> {
  const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
  url.searchParams.set("appid", env.appId);
  url.searchParams.set("secret", env.appSecret);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`微信登录接口请求失败：${response.status}`);
  }

  const data = (await response.json()) as WechatCodeSessionResponse;

  if ("errcode" in data && typeof data.errcode === "number") {
    throw new WechatMiniappApiError(data.errmsg || "微信登录接口返回错误。", data.errcode);
  }

  return {
    openid: data.openid,
    sessionKey: data.session_key,
    unionid: data.unionid
  };
}

export async function getWechatPhoneNumber(accessToken: string, code: string): Promise<WechatPhoneInfo> {
  const url = new URL("https://api.weixin.qq.com/wxa/business/getuserphonenumber");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    throw new Error(`微信手机号接口请求失败：${response.status}`);
  }

  const data = (await response.json()) as WechatPhoneNumberResponse;

  if (!("phone_info" in data)) {
    throw new WechatMiniappApiError(data.errmsg, data.errcode);
  }

  return data.phone_info;
}

export function normalizeWechatPhoneIdentity(phoneInfo: Pick<WechatPhoneInfo, "countryCode" | "purePhoneNumber">) {
  const countryCode = phoneInfo.countryCode.replace(/^\+/, "");
  return `+${countryCode}${phoneInfo.purePhoneNumber}`;
}
