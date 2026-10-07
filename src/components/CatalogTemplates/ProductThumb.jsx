import shared from "./catalogShared.module.css";

// Imagen de producto con fallback al logo del negocio.
// 1) Si el producto tiene imagen -> la muestra (con la clase del template).
// 2) Si no, muestra el logo del negocio centrado y contenido (no recortado).
// 3) Si tampoco hay logo, cae al placeholder que ya trae cada template.
// `priority`: primeras imágenes visibles (eager + fetchpriority alta); el resto lazy.
// width/height son intrínsecos (reservan proporción); el CSS del template manda el tamaño.
const ProductThumb = ({ product, business, imgClassName, placeholderClassName, priority = false, width = 600, height = 600 }) => {
  const productImg = product?.imagesUrl?.[0]?.image;
  const logo = business?.logo_url;
  const loadingProps = priority
    ? { loading: "eager", fetchPriority: "high" }
    : { loading: "lazy" };

  if (productImg) {
    return (
      <img
        className={imgClassName}
        src={productImg}
        alt={product?.name || ""}
        width={width}
        height={height}
        decoding="async"
        {...loadingProps}
      />
    );
  }

  if (logo) {
    // Logo como respaldo: contenido (no cover) sobre superficie del tema.
    return (
      <div className={`${placeholderClassName || ""} ${shared.thumbFallback}`} role="img" aria-label={product?.name || ""}>
        <img
          src={logo}
          alt=""
          className={shared.thumbFallbackLogo}
          decoding="async"
          {...loadingProps}
        />
      </div>
    );
  }

  // Sin imagen ni logo: placeholder original del template.
  return <div className={placeholderClassName}></div>;
};

export default ProductThumb;
