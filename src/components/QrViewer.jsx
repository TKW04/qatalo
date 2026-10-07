import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCodeStyling from "qr-code-styling";
import { Download, FileCode2, Printer } from "lucide-react";

import { getTokenInfo } from "../helpers/token";
import { fetchBusinessData } from "../services/businessApi";
import { CLASSIC_QR_COLORS } from "../helpers/qrColors";
import { Button } from "./admin";
import styles from "./QrViewer.module.css";

// Vista en pantalla: SVG vectorial (nítido con cualquier devicePixelRatio).
const SIZE = 300;
// PNG de descarga/impresión: se genera aparte, a alta resolución.
const EXPORT_SIZE = 2048;

// Logo: coeficiente de qr-code-styling (con nivel H). Con 0.4 el logo ocupa ~26 % del lado
// del QR (~7 % del área, medido), muy por debajo del ~30 % que tolera la corrección H.
const MAX_IMAGE_SIZE = 0.4;
const MIN_IMAGE_SIZE = 0.12;
const LOGO_SIDE_AT_MAX = 0.26;
// Resolución de referencia para no ampliar el logo: la vista en pantalla retina (2×).
const LOGO_REF_PX = SIZE * 2;

/**
 * Limita imageSize para que el logo (bitmap) no se amplíe más allá de su tamaño nativo en la
 * vista de referencia. El lado del logo escala con √imageSize → imageSize ∝ área nativa.
 * Los SVG son vectoriales: sin límite.
 */
const logoImageSize = (logo) => {
  if (!logo || logo.vector || !logo.width || !logo.height) return { imageSize: MAX_IMAGE_SIZE, limited: false };
  const refSide = LOGO_SIDE_AT_MAX * LOGO_REF_PX;
  const fit = MAX_IMAGE_SIZE * ((logo.width * logo.height) / (refSide * refSide));
  if (fit >= MAX_IMAGE_SIZE) return { imageSize: MAX_IMAGE_SIZE, limited: false };
  return { imageSize: Math.max(MIN_IMAGE_SIZE, fit), limited: true };
};
// Lado recomendado del logo para que tampoco se amplíe en el PNG de impresión
const RECOMMENDED_LOGO_PX = Math.ceil((LOGO_SIDE_AT_MAX * EXPORT_SIZE) / 100) * 100;

// Opciones de color para qr-code-styling (vista, PNG, SVG e impresión usan las mismas)
const colorOptions = (c) => ({
  dotsOptions: { type: "rounded", color: c.dots },
  backgroundOptions: { color: c.background },
  cornersSquareOptions: { type: "extra-rounded", color: c.cornersSquare },
  cornersDotOptions: { type: "dot", color: c.cornersDot },
});

// Márgenes en px absolutos en la librería: se escalan con el tamaño para que vista y PNG coincidan.
const sizeOptions = (size, imageSize) => ({
  width: size,
  height: size,
  margin: Math.round(size * 0.027),
  imageOptions: {
    imageSize,
    margin: Math.max(2, Math.round(size * 0.02)),
    hideBackgroundDots: true,
    crossOrigin: "anonymous",
  },
});

const readLogo = (dataUrl, type) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight, vector: /svg/i.test(type || "") });
    img.onerror = () => resolve({ dataUrl, width: 0, height: 0, vector: false });
    img.src = dataUrl;
  });

const QrViewer = ({ colors = CLASSIC_QR_COLORS }) => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  const ref = useRef(null);
  const [logo, setLogo] = useState(null); // { dataUrl, width, height, vector }

  const slug = business?.slug || "";
  const catalogUrl = `${window.location.origin}/catalog/${slug}`;

  // Precarga el logo como dataURL (evita la caché de imágenes de Safari y el canvas "tainted")
  // y lee su resolución nativa para no ampliarlo de más.
  useEffect(() => {
    let cancelled = false;
    const url = business?.logo_url;
    if (!url) {
      setLogo(null);
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
            fr.onloadend = () => res(readLogo(fr.result, blob.type));
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          })
      )
      .then((info) => {
        if (!cancelled) setLogo(info);
      })
      .catch((e) => {
        console.error("No se pudo cargar el logo:", e);
        if (!cancelled) setLogo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [business?.logo_url]);

  const { imageSize, limited: logoLimited } = logoImageSize(logo);
  const logoData = logo?.dataUrl;

  // Vista: se crea una sola vez (SVG); se actualiza vía effect
  const qr = useMemo(
    () =>
      new QRCodeStyling({
        type: "svg",
        data: catalogUrl,
        // H: tolera el logo central sin perder lectura
        qrOptions: { errorCorrectionLevel: "H" },
        ...sizeOptions(SIZE, MAX_IMAGE_SIZE),
        ...colorOptions(colors),
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      qr.append(ref.current);
    }
  }, [qr]);

  const { dots, cornersSquare, cornersDot, background } = colors;
  useEffect(() => {
    qr.update({
      data: catalogUrl,
      image: logoData,
      ...sizeOptions(SIZE, imageSize),
      ...colorOptions({ dots, cornersSquare, cornersDot, background }),
    });
  }, [qr, catalogUrl, logoData, imageSize, dots, cornersSquare, cornersDot, background]);

  // PNG a alta resolución, generado aparte (no se reescala la vista)
  const exportQr = () =>
    new QRCodeStyling({
      type: "canvas",
      data: catalogUrl,
      image: logoData,
      qrOptions: { errorCorrectionLevel: "H" },
      ...sizeOptions(EXPORT_SIZE, imageSize),
      ...colorOptions({ dots, cornersSquare, cornersDot, background }),
    });

  const name = `qr-${slug || "catalogo"}`;
  const download = (extension) =>
    extension === "png" ? exportQr().download({ name, extension }) : qr.download({ name, extension });

  const printQR = async () => {
    const blob = await exportQr().getRawData("png");
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
              .box { display: inline-block; padding: 24px; border: 2px solid ${dots}; border-radius: 12px; background: ${background}; }
              .name { font-size: 24px; font-weight: bold; color: ${dots}; margin-bottom: 16px; }
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
      <div className={styles.qrPanel} style={{ background }} ref={ref} />
      {logoLimited && (
        <p className={styles.qrHint}>
          Tu logo es pequeño ({logo.width}×{logo.height} px), así que lo mostramos más chico para que no se vea
          borroso. Para imprimir, sube uno de al menos {RECOMMENDED_LOGO_PX} px de lado.
        </p>
      )}
      <div className={styles.qrActions}>
        <Button size="sm" icon={Download} onClick={() => download("png")}>
          Descargar PNG
        </Button>
        <Button size="sm" variant="secondary" icon={FileCode2} onClick={() => download("svg")}>
          Descargar SVG
        </Button>
        <Button size="sm" variant="secondary" icon={Printer} onClick={printQR}>
          Imprimir
        </Button>
      </div>
    </div>
  );
};

export default QrViewer;