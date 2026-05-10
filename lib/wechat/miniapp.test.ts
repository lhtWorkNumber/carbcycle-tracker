import { afterEach, describe, expect, it, vi } from "vitest";

import {
  WechatMiniappApiError,
  exchangeWechatLoginCode,
  getWechatPhoneNumber,
  normalizeWechatPhoneIdentity
} from "@/lib/wechat/miniapp";

describe("wechat miniapp helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchanges wx.login code for stable identity fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        openid: "openid-1",
        unionid: "union-1",
        session_key: "session-key"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(exchangeWechatLoginCode("login-code", { appId: "app-id", appSecret: "secret" })).resolves.toEqual({
      openid: "openid-1",
      unionid: "union-1",
      sessionKey: "session-key"
    });

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.hostname).toBe("api.weixin.qq.com");
    expect(calledUrl.searchParams.get("appid")).toBe("app-id");
    expect(calledUrl.searchParams.get("js_code")).toBe("login-code");
  });

  it("surfaces WeChat API errors with errcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errcode: 40029,
          errmsg: "invalid code"
        })
      })
    );

    await expect(exchangeWechatLoginCode("bad-code", { appId: "app-id", appSecret: "secret" })).rejects.toMatchObject({
      code: 40029
    } satisfies Partial<WechatMiniappApiError>);
  });

  it("gets authorized phone number from one-time phone code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errcode: 0,
          errmsg: "ok",
          phone_info: {
            phoneNumber: "+8613800000000",
            purePhoneNumber: "13800000000",
            countryCode: "86",
            watermark: {
              appid: "app-id",
              timestamp: 1710000000
            }
          }
        })
      })
    );

    await expect(getWechatPhoneNumber("access-token", "phone-code")).resolves.toMatchObject({
      purePhoneNumber: "13800000000",
      countryCode: "86"
    });
  });

  it("normalizes phone identity to E.164-like format", () => {
    expect(normalizeWechatPhoneIdentity({ countryCode: "+86", purePhoneNumber: "13800000000" })).toBe("+8613800000000");
  });
});
