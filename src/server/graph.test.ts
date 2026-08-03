import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishImages } from "./graph";

const acc = { igUserId: "IG1", token: "T" };

function mockFetchSequence(responses: any[]) {
  const f = vi.fn();
  responses.forEach((r) => f.mockResolvedValueOnce({ ok: true, status: 200, json: async () => r, text: async () => JSON.stringify(r) }));
  globalThis.fetch = f as any;
  return f;
}

describe("publishImages", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("1 imagem = post simples e retorna permalink", async () => {
    const f = mockFetchSequence([
      { id: "CONT1" },                        // POST /IG1/media
      { status_code: "FINISHED" },            // GET container
      { id: "MEDIA1" },                       // POST /IG1/media_publish
      { permalink: "https://insta/p/x" },     // GET permalink
    ]);
    const r = await publishImages(acc, ["https://img/1.jpg"], "cap");
    expect(r.mediaId).toBe("MEDIA1");
    expect(r.permalink).toBe("https://insta/p/x");
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("2+ imagens = carrossel", async () => {
    mockFetchSequence([
      { id: "C1" }, { id: "C2" },             // filhos
      { id: "PARENT" },                       // pai CAROUSEL
      { status_code: "FINISHED" },            // GET container pai
      { id: "MEDIA2" },                       // media_publish
      { permalink: "https://insta/p/y" },
    ]);
    const r = await publishImages(acc, ["a", "b"], "cap");
    expect(r.mediaId).toBe("MEDIA2");
  });

  it("lança em erro HTTP", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "bad" }) as any;
    await expect(publishImages(acc, ["a"], "c")).rejects.toThrow(/Graph API 400/);
  });
});
