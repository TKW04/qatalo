import { useState } from "react";
import { Smartphone, X } from "lucide-react";
import styles from "./IosAppBanner.module.css";

const IOS_APP_URL = "https://apps.apple.com/app/id6820258202";
const STORAGE_KEY = "qatalo:iosAppBannerDismissedAt";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

/**
 * iPhone/iPod (Safari, Chrome = CriOS, Firefox = FxiOS…). Se excluye iPad: la app es
 * solo iPhone y iPadOS 13+ se anuncia como Mac, así que no se detecta de forma fiable.
 * Tampoco se muestra dentro del WebView de la app (react-native-webview).
 */
function shouldOfferIosApp(win = typeof window !== "undefined" ? window : undefined) {
  if (!win?.navigator) return false;
  if (win.ReactNativeWebView) return false;
  const ua = win.navigator.userAgent || "";
  if (/QataloApp/i.test(ua)) return false;
  return /\b(iPhone|iPod)\b/.test(ua);
}

function isDismissed(now = Date.now()) {
  try {
    const ts = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(ts) && ts > 0 && now - ts < DISMISS_MS;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* almacenamiento no disponible (modo privado): solo se oculta en esta sesión */
  }
}

/** Sugerencia para descargar la app de iOS en el panel admin (solo iPhone). */
const IosAppBanner = () => {
  const [visible, setVisible] = useState(() => shouldOfferIosApp() && !isDismissed());

  if (!visible) return null;

  const close = () => {
    rememberDismiss();
    setVisible(false);
  };

  return (
    <aside className={styles.banner} aria-label="Aplicación de Qatalo para iPhone">
      <span className={styles.icon} aria-hidden="true">
        <Smartphone size={20} />
      </span>
      <p className={styles.text}>
        Gestiona tu catálogo desde el iPhone — <strong>Descarga la app de Qatalo</strong>
      </p>
      <a
        className={styles.download}
        href={IOS_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Descargar
      </a>
      <button
        type="button"
        className={styles.close}
        onClick={close}
        aria-label="Cerrar sugerencia de la app"
        title="Cerrar"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
};

export default IosAppBanner;
