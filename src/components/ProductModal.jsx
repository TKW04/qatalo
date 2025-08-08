"use client"

import { useEffect } from "react"

function ProductModal({ product, business, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [onClose])

  const handleWhatsApp = () => {
    const catalogUrl = window.location.href
    const message = `Hola, me interesa el producto "${product.name}". Lo vi en tu catálogo: ${catalogUrl}`
    const whatsappUrl = `https://wa.me/${business.phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content product-modal-content">
        <div className="product-modal-header">
          <img
            src={product.imageUrl || "/placeholder.svg?height=300&width=500&query=producto"}
            alt={product.name}
            className="product-modal-image"
          />
          <button className="product-modal-close" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="product-modal-body">
          <h2 className="product-modal-title">{product.name}</h2>
          <div className="product-modal-price">${product.price.toFixed(2)}</div>

          {product.description && <p className="product-modal-description">{product.description}</p>}

          <div className="product-modal-actions">
            {product.available ? (
              <button className="btn btn-primary" onClick={handleWhatsApp}>
                💬 Contactar por WhatsApp
              </button>
            ) : (
              <button className="btn" disabled>
                Producto agotado
              </button>
            )}
            <button className="btn btn-outline" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductModal
