import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({});
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function() { return { send: sendMock }; }),
  PutObjectCommand: vi.fn(function(input) { return { input }; }),
}));

describe("uploadPublic", () => {
  beforeEach(() => { sendMock.mockClear(); process.env.R2_PUBLIC_BASE = "https://cdn.itb/x"; process.env.R2_BUCKET = "b"; });
  it("sobe e retorna URL publica", async () => {
    const { uploadPublic } = await import("./r2");
    const url = await uploadPublic(Buffer.from("x"), "posts/1/a.jpg", "image/jpeg");
    expect(url).toBe("https://cdn.itb/x/posts/1/a.jpg");
    expect(sendMock).toHaveBeenCalledOnce();
  });
});
