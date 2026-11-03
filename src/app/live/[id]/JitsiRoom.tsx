"use client";

import { useEffect, useRef, useState } from "react";
import { Notice } from "@/components/ui/Field";

type JitsiApi = { dispose: () => void; addListener: (e: string, cb: () => void) => void };
declare global {
  interface Window { JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi }
}

export function JitsiRoom({ domain, scriptSrc, roomName, jwt, displayName, email, moderator, onLeaveHref, title }: {
  domain: string; scriptSrc: string; roomName: string; jwt: string | null; displayName: string; email: string | null; moderator: boolean; onLeaveHref: string; title: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let api: JitsiApi | null = null;
    let cancelled = false;
    function start() {
      if (cancelled || !box.current || !window.JitsiMeetExternalAPI) return;
      api = new window.JitsiMeetExternalAPI(domain, {
        roomName, jwt: jwt ?? undefined, parentNode: box.current, width: "100%", height: "100%",
        userInfo: { displayName, email: email ?? undefined },
        configOverwrite: {
          // Go straight into the class: names come from the account, so there is nothing to fill in first.
          prejoinConfig: { enabled: false }, prejoinPageEnabled: false,
          subject: title, startWithAudioMuted: !moderator, startWithVideoMuted: !moderator,
          disableDeepLinking: true, enableLobbyChat: false, disableInviteFunctions: true,
          toolbarButtons: moderator
            ? ["microphone", "camera", "desktop", "chat", "raisehand", "participants-pane", "tileview", "mute-everyone", "recording", "settings", "hangup"]
            : ["microphone", "camera", "chat", "raisehand", "tileview", "hangup"],
        },
        interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, MOBILE_APP_PROMO: false },
      });
      api.addListener("readyToClose", () => { window.location.href = onLeaveHref; });
    }
    if (window.JitsiMeetExternalAPI) start();
    else {
      const s = document.createElement("script");
      s.src = scriptSrc;
      s.async = true;
      s.onload = start;
      s.onerror = () => setError("The video service couldn't be reached. Check your internet connection and reload.");
      document.body.appendChild(s);
    }
    return () => { cancelled = true; api?.dispose(); };
  }, [domain, scriptSrc, roomName, jwt, displayName, email, moderator, onLeaveHref, title]);

  // The call fills whatever box the page gives it; Jitsi sizes its iframe to 100% of this element.
  return error ? <Notice tone="error">{error}</Notice> : <div ref={box} className="size-full overflow-hidden rounded-xl bg-ink sm:rounded-[1.25rem] [&>iframe]:block" />;
}
