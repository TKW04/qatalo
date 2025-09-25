import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card } from "primereact/card";
import { Download, Printer, BookUp2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getTokenInfo } from "../helpers/token";
import { useNotification } from "./UI/NotificationProvider";
import { GetBusiness } from "../store/business-store/business-actions";

let once = true;

/* ==================== Helpers anti-CORS / composición ==================== */

function withBust(url) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

// Descarga el logo con fetch CORS y lo convierte a data:URL (base64)
async function fetchAsDataURL(url) {
  const res = await fetch(withBust(url), { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error(`Logo HTTP ${res.status}`);
  const blob = await res.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

async function loadImageFromDataURL(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // para data URLs no se requiere crossOrigin
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Genera un dataURL de QR con un logo centrado encima.
 * Usa nivel de corrección "H" y un parche blanco detrás del logo.
 */
async function qrWithLogoDataURL({
  text,
  opts = {},
  logoUrl,
  size = 256,
  logoScale = 0.2,
  drawSafeZone = true,
  safeZonePadding = 8,
}) {
  // 1) QR en canvas temporal
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: "H",
    width: size,
    margin: 2,
    ...opts,
  });
  const ctx = canvas.getContext("2d");

  // 2) Logo (si hay) — usando data:URL para evitar contaminar el canvas
  if (logoUrl) {
    try {
      const dataUrl = await fetchAsDataURL(logoUrl);
      const logoImg = await loadImageFromDataURL(dataUrl);

      const logoSize = Math.floor(size * logoScale);
      const x = Math.floor((size - logoSize) / 2);
      const y = Math.floor((size - logoSize) / 2);

      if (drawSafeZone) {
        const pad = safeZonePadding;
        const boxX = x - pad;
        const boxY = y - pad;
        const boxW = logoSize + pad * 2;
        const boxH = logoSize + pad * 2;
        const r = 8;

        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(boxX + r, boxY);
        ctx.lineTo(boxX + boxW - r, boxY);
        ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
        ctx.lineTo(boxX + boxW, boxY + boxH - r);
        ctx.quadraticCurveTo(
          boxX + boxW,
          boxY + boxH,
          boxX + boxW - r,
          boxY + boxH
        );
        ctx.lineTo(boxX + r, boxY + boxH);
        ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
        ctx.lineTo(boxX, boxY + r);
        ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
    } catch (e) {
      console.warn("Logo no embebido (data URL):", e);
    }
  }

  // 3) Exportar PNG del QR ya compuesto
  return canvas.toDataURL("image/png");
}

/* ==================== Componente ==================== */

const QrViewer = () => {
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business);
  const dispatch = useDispatch();
  const { showError } = useNotification();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  const catalogUrl = `${window.location.origin}/catalog/${business.slug}`;

  useEffect(() => {
    if (business !== null && business.business_id === "" && once) {
      dispatch(GetBusiness(auth.sub, showError));
      once = false;
    }
  }, [auth, business, business.business_id, dispatch, showError]);

  // Generar QR con logo centrado (robusto a CORS)
  useEffect(() => {
    let cancelled = false;
    const generateQR = async () => {
      try {
        setLoading(true);

        const qrOpts = {
          color: { dark: "#113F67", light: "#FFFFFF" },
        };

        const composed = await qrWithLogoDataURL({
          text: catalogUrl,
          opts: qrOpts,
          logoUrl: business?.logo_url || null,
          size: 256,
          logoScale: 0.39, // ajusta 0.16–0.22 según legibilidad
          drawSafeZone: true,
          safeZonePadding: 8,
        });

        if (!cancelled) setQrDataUrl(composed);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    generateQR();
    return () => {
      cancelled = true;
    };
  }, [catalogUrl, business?.logoUrl]);

  // Descargar “flyer” con encabezado + QR ya compuesto
  const downloadQR = async () => {
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = 400;
      canvas.height = 500;

      // Fondo blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawHeaderThenQR = () => {
        // Nombre
        ctx.fillStyle = "#113F67";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(business.name, 200, business.logoUrl ? 130 : 50);

        // QR (ya con logo centrado)
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 72, business.logoUrl ? 150 : 80, 256, 256);

          // URL
          ctx.fillStyle = "#666666";
          ctx.font = "14px Arial";
          ctx.fillText(catalogUrl, 200, business.logoUrl ? 430 : 360);

          // Descargar
          const link = document.createElement("a");
          link.download = `qr-${business.slug}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        };
        qrImg.src = qrDataUrl;
      };

      if (business.logoUrl) {
        try {
          // Encabezado: logo de empresa arriba (no el del centro del QR)
          const headerDataUrl = await fetchAsDataURL(business.logoUrl);
          const headerImg = await loadImageFromDataURL(headerDataUrl);
          ctx.drawImage(headerImg, 160, 20, 80, 80);
          drawHeaderThenQR();
        } catch (error) {
          console.warn("No se pudo cargar logo de encabezado:", error);
          drawHeaderThenQR();
        }
      } else {
        drawHeaderThenQR();
      }
    } catch (error) {
      console.error("Error downloading QR:", error);
    }
  };

  // Imprimir tarjeta con el QR compuesto
  const printQR = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>QR - ${business.name}</title>
          <style>
            body { 
              font-family: 'Roboto', sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              padding: 20px;
              border: 2px solid #113F67;
              border-radius: 8px;
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              border-radius: 50%; 
              margin-bottom: 10px;
              object-fit: cover;
            }
            .business-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #113F67; 
              margin: 10px 0;
            }
            .qr-code { 
              margin: 20px 0; 
            }
            .url { 
              font-size: 14px; 
              color: #666; 
              margin-top: 10px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${
              business.logoUrl
                ? `<img src="${business.logoUrl}" alt="Logo" class="logo">`
                : ""
            }
            <div class="business-name">${business.name}</div>
            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Code" style="width: 256px; height: 256px;">
            </div>
            <div class="url">${catalogUrl}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const footer = (
    <>
      <div className="qr-actions" style={{ gap: "10px" }}>
        <Link
          className="btn btn-primary"
          onClick={downloadQR}
          disabled={loading}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", margin: "5px" }}
        >
          <Download /> Descargar
        </Link>
        <Link
          className="btn btn-secondary"
          onClick={printQR}
          disabled={loading}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", margin: "5px" }}
        >
          <Printer /> Imprimir
        </Link>

        <Link
          to={catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ display: "flex", alignItems: "center", margin: "5px" }}
        >
          <BookUp2 /> Catálogo
        </Link>
      </div>
    </>
  );

  return (
    <>
      <div style={{ marginLeft: "0px", maxWidth: "530px" }}>
        <Card
          footer={footer}
          style={{
            border: "8px solid #34699a",
            borderRadius: "8px",
            width: "100%",
            padding: "20px",
          }}
        >
          <div className="qr-viewer" style={{ textAlign: "center" }}>
            <h1>Código QR del Catálogo</h1>
            <div
              className="qr-code"
              style={{
                width: "256px",
                height: "256px",
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                margin: "auto",
              }}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <img
                  src={qrDataUrl || "/placeholder.svg"}
                  alt="Código QR del catálogo"
                  width={256}
                  height={256}
                />
              )}
            </div>
            <div className="qr-container">
              <div className="qr-business-info">
                {business.logoUrl && (
                  <img
                    src={business.logoUrl || "/placeholder.svg"}
                    alt={`Logo de ${business.name}`}
                    className="qr-business-logo"
                  />
                )}
                <div className="qr-business-name">{business.name}</div>
                <div className="qr-business-url">{catalogUrl}</div>
              </div>
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </Card>
      </div>
    </>
  );
};

export default QrViewer;
