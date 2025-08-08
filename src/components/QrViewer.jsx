"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Download, Printer, BookUp2 } from "lucide-react";
import { Link } from "react-router-dom";

function QrViewer({ business, isDemo }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  const catalogUrl = isDemo
    ? `${window.location.origin}/demo/catalog/${business.slug}`
    : `${window.location.origin}/catalog/${business.slug}`;

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        const dataUrl = await QRCode.toDataURL(catalogUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: "#113F67",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setLoading(false);
      }
    };
    generateQR();
  }, [catalogUrl]);

  const downloadQR = async () => {
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas size
      canvas.width = 400;
      canvas.height = 500;

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Business logo (if available)
      if (business.logoUrl) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.onload = () => {
            ctx.drawImage(logoImg, 160, 20, 80, 80);
            drawRestOfQR();
          };
          logoImg.src = business.logoUrl;
        } catch (error) {
          console.warn("Could not load logo:", error);
          drawRestOfQR();
        }
      } else {
        drawRestOfQR();
      }

      function drawRestOfQR() {
        // Business name
        ctx.fillStyle = "#113F67";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(business.name, 200, business.logoUrl ? 130 : 50);

        // QR Code
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 72, business.logoUrl ? 150 : 80, 256, 256);

          // URL text
          ctx.fillStyle = "#666666";
          ctx.font = "14px Arial";
          ctx.fillText(catalogUrl, 200, business.logoUrl ? 430 : 360);

          // Download
          const link = document.createElement("a");
          link.download = `qr-${business.slug}.png`;
          link.href = canvas.toDataURL();
          link.click();
        };
        qrImg.src = qrDataUrl;
      }
    } catch (error) {
      console.error("Error downloading QR:", error);
    }
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>QR - ${business.name}</title>
          <style>
            body { 
              font-family: 'Roboto', sans-serif;; 
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

            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          </div>
        </Card>
      </div>
    </>
  );
}

export default QrViewer;
