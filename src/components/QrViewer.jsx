import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "primereact/button";

import { MdOutlineCloudDownload } from "react-icons/md";
import { FiPrinter } from "react-icons/fi";

import { getTokenInfo } from "../helpers/token";
import { useNotification } from "./UI/NotificationProvider";
import styles from "./QrViewer.module.css";

const QrViewer = () => {
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business);
  const dispatch = useDispatch();
  const { showError } = useNotification();
  const svgRef = useRef(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    if (
      business !== null &&
      business.business_id !== "" &&
      logoDataUrl === null
    ) {
      setLogoDataUrl(business.logo_url);
    }
  }, [auth, business, business.business_id, dispatch, logoDataUrl, showError]);

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
            
            .business-name { 
            font-family: 'Roboto', sans-serif; 
              font-size: 24px; 
              font-weight: bold; 
              color: #113F67; 
              margin: 10px 0;
            }
            .qr-code { 
              margin: 20px 0; 
            }
            .url { 
            font-family: 'Roboto', sans-serif; 
              font-size: 14px; 
              color: #666; 
              margin-top: 10px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="business-name">${business?.name || ""}</div>
            <div class="qr-code">
              ${svgHTML}
            </div>    
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const size = 300;
  const defaultLogoSize = Math.round(size * 0.8);
  const isMobile = window.innerWidth <= 480;

  return (
    <>
      <div className={`grid ${styles.qrContainer}`}>
        <div
          className={`col-${isMobile ? "12" : "6"}`}
          style={{ borderRadius: "10px" }}
          ref={svgRef}
        >
          <QRCodeSVG
            value={catalogUrl}
            size={size}
            level="H"
            marginSize={1}
            boostLevel
            style={{ borderRadius: "10px" }}
            imageSettings={{
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

        <div className={`col-${isMobile ? "12 mt-6" : "6"} `}>
          <div className={styles.qrActions}>
            <Button
              onClick={downloadPNG}
              className={styles.qrDownloadButton}
              label="Descargar"
              icon={<MdOutlineCloudDownload size={20} />}
            />
            <Button
              onClick={printQR}
              className={styles.qrPrintButton}
              label="Imprimir"
              icon={<FiPrinter size={20} />}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default QrViewer;
