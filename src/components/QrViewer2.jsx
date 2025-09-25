import { use, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";

import { getTokenInfo } from "../helpers/token";
import { useNotification } from "./UI/NotificationProvider";
import { GetBusiness } from "../store/business-store/business-actions";

import { BookUp2, Download, Link, Printer } from "lucide-react";

let once = true;

// Utilidad: descarga una imagen y la convierte a data URL (evita CORS)
async function toDataURL(url) {
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // "data:image/...;base64,xxxx"
    reader.readAsDataURL(blob);
  });
}

const QrViewer2 = () => {
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business) || {};
  const dispatch = useDispatch();
  const { showError } = useNotification();

  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (business !== null && business.business_id === "" && once) {
      dispatch(GetBusiness(auth.sub, showError));
      once = false;
    }
  }, [auth, business, business?.business_id, dispatch, showError]);

  useEffect(() => {
    if(business && business.logo_url!=="" && business.logo_url!==null){
      toDataURL(business.logo_url).then(setLogoDataUrl).catch(() => setLogoDataUrl(null));
    } else {
      setLogoDataUrl(null);
    }
  }, [business]);

  // console.log("Logo data URL:", business);
  // console.log("Logo data URL:", logoDataUrl);

  const catalogUrl = useMemo(() => {
    const slug = business?.slug || "";
    return `${window.location.origin}/catalog/${slug}`;
  }, [business?.slug]);

  
  const downloadPNG = () => {
    const wrapper = svgRef.current;
    if (!wrapper) return;
    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qrcode-${business?.slug || "catalog"}.png`;
      link.click();
    };
    // No es estrictamente necesario porque ya incrustamos data URL, pero es buena práctica
    img.crossOrigin = "anonymous";
    img.src = url;
  };

  // Imprime el SVG tal cual (con el logo inline)
  const printQR = () => {
    const wrapper = svgRef.current;
    if (!wrapper) return;
    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    const svgHTML = svg.outerHTML;
    const w = window.open("", "_blank");

    w.document.write(`
      <html>
        <head>
          <title>QR - ${business?.name || ""}</title>
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
              logoDataUrl
                ? `<img src="${logoDataUrl}" alt="Logo" class="logo">`
                : ""
            }
            <div class="business-name">${business?.name || ""}</div>
            <div class="qr-code">
              ${svgHTML}
            </div>
            <div class="url">${catalogUrl}</div>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const footer = (
    <div
      className="qr-actions"
      style={{ gap: "10px", display: "flex", flexWrap: "wrap" }}
    >
      <Button
        className="btn btn-primary"
        onClick={downloadPNG}
        style={{ display: "flex", alignItems: "center", margin: "5px" }}
        label="Descargar"
        icon={<Download />}
      />
      <Button
        className="btn btn-secondary"
        onClick={printQR}
        style={{ display: "flex", alignItems: "center", margin: "5px" }}
        label="Imprimir"
        icon={<Printer />}
      />
      <Button
        className="btn btn-outline"
        style={{
          display: "flex",
          alignItems: "center",
          margin: "5px",
          width: "100%",
        }}
        label="Catálogo"
        icon={<BookUp2 />}
        onClick={() => {
          window.location.href = catalogUrl;
        }}
      />
    </div>
  );

  const size = 300;
  const defaultLogoSize = Math.round(size * 0.8); // ~80% del QR (lectura segura)

  return (
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
              width: size,
              height: size,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              margin: "auto",
            }}
            ref={svgRef}
          >
            <QRCodeSVG
              value={catalogUrl}
              size={size}
              level="H"
              marginSize={1}
              boostLevel
              imageSettings={{
                // Forzamos data URL para evitar CORS y que se incluya en PNG
                src: logoDataUrl || undefined,
                x: undefined,
                y: undefined,
                width: defaultLogoSize,
                height: defaultLogoSize,
                excavate: false,
                opacity: 0.9,
              }}
            />
          </div>

          <div className="qr-container" style={{ marginTop: 0, width: "100%" }}>
            <div className="qr-business-info">
              {logoDataUrl && (
                <img
                  src={logoDataUrl}
                  alt={`Logo de ${business?.name || ""}`}
                  className="qr-business-logo"
                  style={{
                    width: 250,
                    height: 250,
                    // borderRadius: "50%",
                    objectFit: "contain",
                    margin: "0px",
                  }}
                />
              )}
              <div
                className="qr-business-name"
                style={{ fontWeight: "bold",  }}
              >
                {business?.name}
              </div>
              <div
                className="qr-business-url"
                style={{ fontSize: 12, color: "#666" }}
              >
                {catalogUrl}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QrViewer2;
