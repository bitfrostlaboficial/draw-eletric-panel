import { useEffect } from "react";
import { useEditor } from "@/lib/editor-store";

/**
 * Mantém o navegador em fullscreen real quando o estado do editor pede.
 *
 * - Quando `fullscreen` vira true → pede requestFullscreen no <html>.
 * - Quando vira false → sai do fullscreen do browser.
 * - Se o usuário pressionar ESC, o browser sai do fullscreen, mas o estado
 *   do editor PERMANECE true (overlay CSS continua maximizado). Apenas F11
 *   ou o botão "Sair" alteram o estado. Isso satisfaz o requisito de
 *   "ESC não deve sair do modo tela cheia".
 */
export function useBrowserFullscreen() {
  const fullscreen = useEditor((s) => s.fullscreen);

  useEffect(() => {
    const el = document.documentElement;
    if (fullscreen) {
      if (!document.fullscreenElement) {
        el.requestFullscreen?.().catch(() => {
          /* iframe sem permissão de fullscreen — overlay CSS já cobre o viewport */
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [fullscreen]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);
}
