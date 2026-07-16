// Imagen de producto con fallback al logo del negocio.
// 1) Si el producto tiene imagen -> la muestra (con la clase del template).
// 2) Si no, muestra el logo del negocio centrado y contenido (no recortado).
// 3) Si tampoco hay logo, cae al placeholder que ya trae cada template.
const ProductThumb = ({ product, business, imgClassName, placeholderClassName }) => {
  const productImg = product?.imagesUrl?.[0]?.image;
  const logo = business?.logo_url;

  if (productImg) {
    return (
      <img
        className={imgClassName}
        src={productImg}
        alt={product?.name || ""}
        loading="lazy"
      />
    );
  }

  if (logo) {
    // Logo como respaldo: contenido (no cover) sobre fondo neutro, para que no se deforme.
    return (
      <div
        className={placeholderClassName}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f5f7",
          width: "100%",
          height: "100%",
        }}
        aria-label={product?.name || ""}
      >
        <img
          src={logo}
          alt={business?.name ? `Logo de ${business.name}` : ""}
          loading="lazy"
          style={{
            maxWidth: "55%",
            maxHeight: "55%",
            objectFit: "contain",
            opacity: 0.75,
          }}
        />
      </div>
    );
  }

  // Sin imagen ni logo: placeholder original del template.
  return <div className={placeholderClassName}></div>;
};

export default ProductThumb;