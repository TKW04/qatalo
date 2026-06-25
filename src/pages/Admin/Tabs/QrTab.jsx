import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TbWorld } from "react-icons/tb";
import { FaWhatsapp, FaRegCopy, FaCheck, FaShareNodes } from "react-icons/fa6";

import { getTokenInfo } from "../../../helpers/token";
import { fetchBusinessData } from "../../../services/businessApi";
import QrViewer from "../../../components/QrViewer";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./QrTab.module.css";

const QrTab = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

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
      <div className={adminStyles.adminHeader}>
        <h1>Compartir catálogo</h1>
        <p>Comparte tu código QR y tu enlace para que tus clientes hagan pedidos</p>
      </div>

      <div className={styles.grid}>
        {/* ── Columna QR ── */}
        <div className={adminStyles.adminCard}>
          <h3 className={styles.cardTitle}>Tu código QR</h3>
          <p className={styles.cardSub}>
            Imprímelo y ponlo en tu local, tus tarjetas o tus redes.
          </p>

          <div className={styles.qrWrap}>
            <QrViewer />
          </div>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => business?.slug && window.open(`/catalog/${business.slug}`, "_blank")}
          >
            <TbWorld size={20} /> Ver catálogo público
          </button>
        </div>

        {/* ── Columna compartir ── */}
        <div className={adminStyles.adminCard}>
          <h3 className={styles.cardTitle}>Comparte tu enlace</h3>
          <p className={styles.cardSub}>
            Copia el enlace o compártelo directo por tus redes.
          </p>

          {/* Link copiable */}
          <label className={styles.fieldLabel}>Enlace de tu catálogo</label>
          <div className={styles.copyRow}>
            <input className={styles.copyInput} value={catalogUrl} readOnly />
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => copy(catalogUrl, "link")}
            >
              {copied === "link" ? <><FaCheck /> Copiado</> : <><FaRegCopy /> Copiar</>}
            </button>
          </div>

          {/* Mensaje editable */}
          <label className={styles.fieldLabel} style={{ marginTop: "1.2rem" }}>
            Mensaje para compartir <span className={styles.editable}>(puedes editarlo)</span>
          </label>
          <textarea
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
              {copied === "msg" ? <><FaCheck /> Copiado</> : <><FaRegCopy /> Copiar mensaje</>}
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
              <FaWhatsapp size={20} /> Compartir por WhatsApp
            </a>
            <button type="button" className={`${styles.shareBtn} ${styles.generic}`} onClick={nativeShare}>
              <FaShareNodes size={18} /> Más opciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrTab;