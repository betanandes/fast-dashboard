import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

let carregandoScript: Promise<void> | null = null;

function carregarScript() {
  if (window.turnstile) return Promise.resolve();
  if (carregandoScript) return carregandoScript;
  carregandoScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar a verificação de segurança."));
    document.head.appendChild(script);
  });
  return carregandoScript;
}

export interface TurnstileHandle {
  reset: () => void;
}

export default function Turnstile({ siteKey, onToken, handle }: { siteKey: string; onToken: (token: string) => void; handle: React.MutableRefObject<TurnstileHandle | null> }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void carregarScript().then(() => {
      if (!ativo || !container.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: "auto",
        size: "flexible",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
      handle.current = {
        reset: () => {
          if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
          onToken("");
        },
      };
    });
    return () => {
      ativo = false;
      handle.current = null;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [handle, onToken, siteKey]);

  return <div ref={container} className="min-h-[65px]" aria-label="Verificação de segurança" />;
}
