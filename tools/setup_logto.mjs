// Cria o app "marketing-studio" no Logto via Management API (M2M do vault).
// Salva APP_ID/SECRET/COOKIE_SECRET no vault (sem exibir o secret).
import { readFileSync, appendFileSync } from "node:fs";
import crypto from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const vault = join(homedir(), ".claude/credentials/services.env");
const env = (k) => {
  const l = readFileSync(vault, "utf8").split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim() : null;
};

const TOKEN_ENDPOINT = "https://auth.itbooster.com.br/oidc/token";
const ADMIN = env("LOGTO_ADMIN_ENDPOINT"); // https://auth-admin.itbooster.com.br
const M2M_ID = env("LOGTO_M2M_SETUP_ID");
const M2M_SECRET = env("LOGTO_M2M_SETUP_SECRET");
const RESOURCE = "https://default.logto.app/api";

async function getToken() {
  const body = new URLSearchParams({ grant_type: "client_credentials", resource: RESOURCE, scope: "all" });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${M2M_ID}:${M2M_SECRET}`).toString("base64") },
    body,
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`token ${res.status}: ${t.slice(0, 250)}`);
  return JSON.parse(t).access_token;
}
async function api(tk, method, path, json) {
  const res = await fetch(ADMIN + path, { method, headers: { Authorization: "Bearer " + tk, "Content-Type": "application/json" }, body: json ? JSON.stringify(json) : undefined });
  const t = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${t.slice(0, 250)}`);
  return t ? JSON.parse(t) : {};
}

const tk = await getToken();
console.log("token M2M OK");
const apps = await api(tk, "GET", "/api/applications?page=1&page_size=200");
let app = (Array.isArray(apps) ? apps : []).find((a) => a.name === "marketing-studio");
if (!app) {
  app = await api(tk, "POST", "/api/applications", { name: "marketing-studio", type: "Traditional", description: "Marketing Studio (Midia Play)" });
  console.log("app criado id=", app.id);
} else {
  console.log("app ja existe id=", app.id);
}
await api(tk, "PATCH", `/api/applications/${app.id}`, {
  oidcClientMetadata: { redirectUris: ["https://midiaplay.net/logto/callback"], postLogoutRedirectUris: ["https://midiaplay.net"] },
});
console.log("redirect URIs setadas");
let secret = app.secret;
if (!secret) {
  const full = await api(tk, "GET", `/api/applications/${app.id}`);
  secret = full.secret;
}
const cookie = crypto.randomBytes(32).toString("hex");
appendFileSync(
  vault,
  `\n# Logto app Marketing Studio (2026-08-03)\nLOGTO_MARKETING_STUDIO_APP_ID=${app.id}\nLOGTO_MARKETING_STUDIO_APP_SECRET=${secret}\nLOGTO_MARKETING_STUDIO_COOKIE_SECRET=${cookie}\n`
);
console.log("salvo no vault: LOGTO_MARKETING_STUDIO_APP_ID/SECRET/COOKIE_SECRET. APP_ID =", app.id, " (secret nao exibido)");
