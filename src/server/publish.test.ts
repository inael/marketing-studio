import { describe, it, expect, vi } from "vitest";
import { publishPost } from "./publish";

const brand = { id: "b1", slug: "itbooster", ig_user_id: "IG1", ig_token: "T", nome: "IT Booster" } as any;

function deps(overrides: any = {}) {
  return {
    getPost: vi.fn().mockResolvedValue({ id: "p1", brand_id: "b1", status: "approved", media: ["https://img/1.jpg"], legenda: "oi", hashtags: ["a"] }),
    getBrand: vi.fn().mockResolvedValue(brand),
    getBrandById: vi.fn().mockResolvedValue(brand),
    publishImages: vi.fn().mockResolvedValue({ mediaId: "M1", permalink: "https://insta/p/x" }),
    setPostStatus: vi.fn().mockResolvedValue(undefined),
    logPublish: vi.fn().mockResolvedValue(undefined),
    env: {},
    ...overrides,
  };
}

describe("publishPost", () => {
  it("publica post aprovado e marca published", async () => {
    const d = deps();
    const r = await publishPost("p1", d as any);
    expect(r).toEqual({ ok: true, url: "https://insta/p/x" });
    expect(d.publishImages).toHaveBeenCalledWith({ igUserId: "IG1", token: "T" }, ["https://img/1.jpg"], "oi\n\n#a");
    expect(d.setPostStatus).toHaveBeenCalledWith("p1", "published", { external_url: "https://insta/p/x" });
  });

  it("recusa post nao aprovado", async () => {
    const d = deps({ getPost: vi.fn().mockResolvedValue({ id: "p1", status: "draft", brand_id: "b1", media: ["a"], legenda: "", hashtags: [] }) });
    const r = await publishPost("p1", d as any);
    expect(r).toEqual({ ok: false, error: "not_approved" });
    expect(d.publishImages).not.toHaveBeenCalled();
  });

  it("em falha do graph marca failed", async () => {
    const d = deps({ publishImages: vi.fn().mockRejectedValue(new Error("boom")) });
    const r = await publishPost("p1", d as any);
    expect(r).toEqual({ ok: false, error: "boom" });
    expect(d.setPostStatus).toHaveBeenCalledWith("p1", "failed", { erro: "boom" });
  });
});
