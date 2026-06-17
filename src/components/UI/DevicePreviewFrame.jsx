import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Renderiza `children` dentro de un <iframe> para una previsualización
 * responsive REAL (los @media del catálogo se activan según el ancho del iframe).
 *
 * Copia al iframe:
 *  - <style> y <link rel="stylesheet"> del head padre (CSS Modules + globales)
 *  - el atributo style y las clases de <html> y <body> del padre
 *    (esto trae las variables CSS del tema, p.ej. --color-primary)
 * y re-sincroniza en cada render para que el preview se actualice en vivo
 * mientras editas colores/plantilla.
 */
const DevicePreviewFrame = ({ width = "100%", height = 720, children }) => {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  const syncStyles = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.head || !doc.body) return;

    // 1) Copia <style> y <link rel=stylesheet> del head padre
    doc.head.querySelectorAll("[data-preview-style]").forEach((n) => n.remove());
    document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute("data-preview-style", "");
        doc.head.appendChild(clone);
      });

    // 2) Copia variables CSS del tema (inline style) y clases de :root y body
    const rootStyle = document.documentElement.getAttribute("style") || "";
    doc.documentElement.setAttribute("style", `background:#fff;${rootStyle}`);
    doc.documentElement.className = document.documentElement.className;

    const bodyStyle = document.body.getAttribute("style") || "";
    doc.body.setAttribute("style", `margin:0;${bodyStyle}`);
    doc.body.className = document.body.className;
  }, []);

  const setup = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) return;

    if (!doc.querySelector('meta[name="viewport"]')) {
      const meta = doc.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1";
      doc.head.appendChild(meta);
    }

    syncStyles();
    setMountNode(doc.body);
  }, [syncStyles]);

  // Por si el iframe ya cargó antes de adjuntar onLoad (about:blank es instantáneo)
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc && doc.readyState === "complete" && !mountNode) setup();
  }, [setup, mountNode]);

  // Re-sincroniza estilos/variables en cada render (tema en vivo)
  useEffect(() => {
    if (mountNode) syncStyles();
  });

  // Observa cambios en el head padre (HMR / fuentes que cargan tarde)
  useEffect(() => {
    if (!mountNode) return;
    const obs = new MutationObserver(() => syncStyles());
    obs.observe(document.head, { childList: true });
    return () => obs.disconnect();
  }, [mountNode, syncStyles]);

  return (
    <iframe
      ref={iframeRef}
      onLoad={setup}
      title="Previsualización del catálogo"
      style={{
        width,
        height,
        border: "none",
        display: "block",
        margin: "0 auto",
        background: "#ffffff",
      }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
};

export default DevicePreviewFrame;
