import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCodeStyling from "qr-code-styling";
import { MdOutlineCloudDownload } from "react-icons/md";
import { FiPrinter } from "react-icons/fi";

import { getTokenInfo } from "../helpers/token";
import { fetchBusinessData } from "../services/businessApi";
import styles from "./QrViewer.module.css";

const SIZE = 300;

const QrViewer = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  const ref = useRef(null);
  const [logoData, setLogoData] = useState(undefined);

  const slug = business?.slug || "";
  const catalogUrl = `${window.location.origin}/catalog/${slug}`;

  // Precarga el logo como dataURL (evita la caché de imágenes de Safari y el canvas "tainted")
  useEffect(() => {
    let cancelled = false;
    const url = business?.logo_url;
    if (!url) {
      setLogoData(undefined);
      return;
    }
    fetch(url, { mode: "cors", cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(
        (blob) =>
          new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onloadend = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => {
        if (!cancelled) setLogoData(dataUrl);
      })
      .catch((e) => {
        console.error("No se pudo cargar el logo:", e);
        if (!cancelled) setLogoData(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [business?.logo_url]);

  // Se crea una sola vez; se actualiza vía effect
  const qr = useMemo(
    () =>
      new QRCodeStyling({
        width: SIZE,
        height: SIZE,
        type: "canvas",
        data: catalogUrl,
        margin: 8,
        qrOptions: { errorCorrectionLevel: "H" },
        dotsOptions: { type: "rounded", color: "#113F67" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "extra-rounded", color: "#34699A" },
        cornersDotOptions: { type: "dot", color: "#113F67" },
        imageOptions: { margin: 6, imageSize: 0.4, hideBackgroundDots: true },
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      qr.append(ref.current);
    }
  }, [qr]);

  useEffect(() => {
    qr.update({ data: catalogUrl, image: logoData });
  }, [qr, catalogUrl, logoData]);

  const downloadPNG = () =>
    qr.download({ name: `qr-${slug || "catalogo"}`, extension: "png" });

  const printQR = async () => {
    const blob = await qr.getRawData("png");
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`
        <html>
          <head>
            <title>QR - ${business?.name || ""}</title>
            <style>
              body { font-family: 'Roboto', sans-serif; text-align: center; margin: 0; padding: 24px; }
              .box { display: inline-block; padding: 24px; border: 2px solid #113F67; border-radius: 12px; }
              .name { font-size: 24px; font-weight: bold; color: #113F67; margin-bottom: 16px; }
              img { width: 320px; height: 320px; }
              .url { margin-top: 12px; color: #666; font-size: 13px; word-break: break-all; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="name">${business?.name || ""}</div>
              <img src="${dataUrl}" onload="window.focus(); window.print();" />
              <div class="url">${catalogUrl}</div>
            </div>
          </body>
        </html>`);
      w.document.close();
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className={styles.qrContainer}>
      <div className={styles.qrPanel} ref={ref} />
      <div className={styles.qrActions}>
        <button type="button" className={`${styles.btn} ${styles.btnDownload}`} onClick={downloadPNG}>
          <MdOutlineCloudDownload size={20} /> Descargar
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrint}`} onClick={printQR}>
          <FiPrinter size={20} /> Imprimir
        </button>
      </div>
    </div>
  );
};

export default QrViewer;