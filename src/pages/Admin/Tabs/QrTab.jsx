import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TbWorld } from "react-icons/tb";
import { FaWhatsapp, FaRegCopy, FaCheck, FaShareNodes } from "react-icons/fa6";

import { getTokenInfo } from "../../../helpers/token";
import { CLASSIC_QR_COLORS, brandQrColors } from "../../../helpers/qrColors";
import { fetchBusinessData } from "../../../services/businessApi";
import QrViewer from "../../../components/QrViewer";
import { PageHeader } from "../../../components/admin";
import styles from "./QrTab.module.css";

const QR_STYLE_KEY = "qatalo.qrStyle";
const readQrStyle = () => {
  try { return localStorage.getItem(QR_STYLE_KEY) === "brand" ? "brand" : "classic"; } catch { return "classic"; }
};

const QrTab = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  // Estilo del QR: clásico (negro/blanco) o colores del catálogo. Solo local.
  const [qrStyle, setQrStyleState] = useState(readQrStyle);
  const setQrStyle = (value) => {
    setQrStyleState(value);
    try { localStorage.setItem(QR_STYLE_KEY, value); } catch { /* storage no disponible */ }
  };
  const brandColors = useMemo(() => brandQrColors(business?.themePalette), [business?.themePalette]);
  const qrColors = qrStyle === "brand" ? brandColors : CLASSIC_QR_COLORS;

  const businessName = business?.business_name || business?.name || "nuestro negocio";

  // URL pública del catálogo
  const catalogUrl = useMemo(() => {
    if (!business?.slug) return "";
    return `${window.location.origin}/catalog/${business.slug}`;
  }, [business?.slug]);

  // Texto editable para compartir (con un valor por defecto)
  const defaultMessage = useMemo(
    () =>
      `¡Hola! 👋 Mira el catálogo de ${businessName} aquí 👉 ${catalogUrl}\n\nHaz tu pedido fácil y rápido 🛍️`,
    [businessName, catalogUrl]
  );
  const [message, setMessage] = useState(null); // null = usar default
  const shareText = message === null ? defaultMessage : message;

  // Feedback de copiado
  const [copied, setCopied] = useState("");
  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // Fallback simple si el navegador no permite clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Web Share API nativa (móvil) — compartir a cualquier app
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, text: shareText, url: catalogUrl });
      } catch { /* usuario canceló */ }
    } else {
      copy(shareText, "share");
    }
  };

  return (
    <div>
      <PageHeader
        title="Compartir catálogo"
        description="Comparte tu código QR y tu enlace para que tus clientes hagan pedidos."
      />

      <div className={styles.grid}>
        {/* ── Columna QR ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Tu código QR</h2>
          <p className={styles.cardSub}>
            Imprímelo y ponlo en tu local, tus tarjetas o tus redes.
          </p>

          <div className={styles.styleToggle} role="group" aria-label="Colores del QR">
            <button
              type="button"
              aria-pressed={qrStyle === "classic"}
              className={`${styles.styleBtn} ${qrStyle === "classic" ? styles.styleBtnActive : ""}`}
              onClick={() => setQrStyle("classic")}
            >
              <span className={styles.swatches} aria-hidden="true">
                <span className={styles.swatch} style={{ background: CLASSIC_QR_COLORS.dots }} />
                <span className={styles.swatch} style={{ background: CLASSIC_QR_COLORS.background }} />
              </span>
              Clásico
            </button>
            <button
              type="button"
              aria-pressed={qrStyle === "brand"}
              className={`${styles.styleBtn} ${qrStyle === "brand" ? styles.styleBtnActive : ""}`}
              onClick={() => setQrStyle("brand")}
            >
              <span className={styles.swatches} aria-hidden="true">
                <span className={styles.swatch} style={{ background: brandColors.dots }} />
                <span className={styles.swatch} style={{ background: brandColors.cornersSquare }} />
                <span className={styles.swatch} style={{ background: brandColors.background }} />
              </span>
              Colores de tu marca
            </button>
          </div>
          <p className={styles.styleHint}>
            {qrStyle === "brand"
              ? brandColors.adjusted
                ? "Usamos los colores de tu catálogo, ajustados para que el QR se lea bien."
                : "Usamos los colores de tu catálogo."
              : "Negro sobre blanco: máxima lectura en cualquier impresión."}
          </p>

          <div className={styles.qrWrap}>
            <QrViewer colors={qrColors} />
          </div>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => business?.slug && window.open(`/catalog/${business.slug}`, "_blank")}
          >
            <TbWorld size={20} aria-hidden="true" /> Ver catálogo público
          </button>
        </div>

        {/* ── Columna compartir ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Comparte tu enlace</h2>
          <p className={styles.cardSub}>
            Copia el enlace o compártelo directo por tus redes.
          </p>

          {/* Link copiable */}
          <label className={styles.fieldLabel} htmlFor="qr-catalog-url">Enlace de tu catálogo</label>
          <div className={styles.copyRow}>
            <input id="qr-catalog-url" className={styles.copyInput} value={catalogUrl} readOnly />
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => copy(catalogUrl, "link")}
              aria-live="polite"
            >
              {copied === "link" ? <><FaCheck aria-hidden="true" /> Copiado</> : <><FaRegCopy aria-hidden="true" /> Copiar</>}
            </button>
          </div>

          {/* Mensaje editable */}
          <label className={`${styles.fieldLabel} ${styles.fieldGap}`} htmlFor="qr-share-message">
            Mensaje para compartir <span className={styles.editable}>(puedes editarlo)</span>
          </label>
          <textarea
            id="qr-share-message"
            className={styles.messageBox}
            rows={4}
            value={shareText}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className={styles.msgActions}>
            <button
              type="button"
              className={styles.copyTextBtn}
              onClick={() => copy(shareText, "msg")}
            >
              {copied === "msg" ? <><FaCheck aria-hidden="true" /> Copiado</> : <><FaRegCopy aria-hidden="true" /> Copiar mensaje</>}
            </button>
            {message !== null && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => setMessage(null)}
              >
                Restaurar texto
              </button>
            )}
          </div>

          {/* Botones de compartir */}
          <div className={styles.shareButtons}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.shareBtn} ${styles.whatsapp}`}
            >
              <FaWhatsapp size={20} aria-hidden="true" /> Compartir por WhatsApp
            </a>
            <button type="button" className={`${styles.shareBtn} ${styles.generic}`} onClick={nativeShare}>
              <FaShareNodes size={18} aria-hidden="true" /> Más opciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrTab;