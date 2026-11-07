import "server-only";

/**
 * VdoCipher: DRM-protected video hosting (Widevine and FairPlay). Videos are encrypted, so a link copied from
 * the browser's developer tools plays nowhere else, and a moving watermark shows the viewer's name.
 * Set VDOCIPHER_API_SECRET (from the VdoCipher dashboard, Config > API keys) to switch it on.
 * Docs: https://www.vdocipher.com/docs/server/playbackauth/otp/
 */
const API = "https://dev.vdocipher.com/api";

export function vdocipherReady() {
  return Boolean(process.env.VDOCIPHER_API_SECRET);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const secret = process.env.VDOCIPHER_API_SECRET;
  if (!secret) throw new Error("Protected video hosting is not set up yet.");
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Apisecret ${secret}`, Accept: "application/json", "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`The video service said no (${res.status}).`);
  return res.json() as Promise<T>;
}

/** A one-time pass to play one video, valid for five minutes, with the viewer's name drifting across the picture. */
export async function vdoPlayback(videoId: string, viewerLabel: string) {
  const annotate = JSON.stringify([
    { type: "rtext", text: viewerLabel.slice(0, 40), alpha: "0.55", color: "0xFFFFFF", size: "14", interval: "5000" },
  ]);
  return call<{ otp: string; playbackInfo: string }>(`/videos/${encodeURIComponent(videoId)}/otp`, {
    method: "POST",
    body: JSON.stringify({ ttl: 300, annotate }),
  });
}

export type VdoUploadTicket = {
  videoId: string;
  clientPayload: {
    policy: string; key: string; "x-amz-signature": string; "x-amz-algorithm": string;
    "x-amz-date": string; "x-amz-credential": string; uploadLink: string;
  };
};

/** Short-lived permission for the teacher's browser to send one file straight to VdoCipher's storage. */
export async function vdoUploadTicket(title: string) {
  const folder = process.env.VDOCIPHER_FOLDER_ID ? `&folderId=${encodeURIComponent(process.env.VDOCIPHER_FOLDER_ID)}` : "";
  return call<VdoUploadTicket>(`/videos?title=${encodeURIComponent(title.slice(0, 120))}${folder}`, { method: "PUT" });
}

export async function vdoDelete(videoIds: string[]) {
  if (!videoIds.length) return;
  await call(`/videos?videos=${videoIds.map(encodeURIComponent).join(",")}`, { method: "DELETE" });
}
