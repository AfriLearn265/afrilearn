import "server-only";
import { createSign } from "node:crypto";

/**
 * Live classes run on Jitsi. With JaaS keys (8x8 Jitsi as a Service) calls are
 * unlimited and teachers are moderators. Without them we fall back to the public
 * meet.jit.si server, which ends embedded calls after 5 minutes.
 */
export function liveProvider() {
  const appId = process.env.JAAS_APP_ID;
  const kid = process.env.JAAS_API_KEY_ID;
  const key = process.env.JAAS_PRIVATE_KEY;
  return appId && kid && key ? { kind: "jaas" as const, appId, kid, key: key.replace(/\\n/g, "\n") } : { kind: "public" as const };
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export function jaasToken(p: { appId: string; kid: string; key: string }, user: { id: string; name: string; email: string | null; moderator: boolean }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", kid: p.kid, typ: "JWT" };
  const payload = {
    aud: "jitsi", iss: "chat", sub: p.appId, room: "*", nbf: now - 10, exp: now + 3 * 3600,
    context: {
      user: { id: user.id, name: user.name, email: user.email ?? "", moderator: user.moderator ? "true" : "false" },
      features: { livestreaming: "false", recording: user.moderator ? "true" : "false", transcription: "false", "outbound-call": "false" },
    },
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(p.key);
  return `${unsigned}.${b64url(signature)}`;
}
