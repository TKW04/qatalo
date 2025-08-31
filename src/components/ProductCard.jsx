const ProductCard = ({ product, onClick }) => {
  const formatted = Number(product.price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <div
      className="product-card"
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(product);
        }
      }}
      aria-label={`Ver detalles de ${product.name}`}
    >
      <img
        src={product.imagesUrl[0].image}
        alt={product.name}
        className="product-image"
      />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          {product.currency}
          {formatted}
        </div>
        <span
          className={`product-status  product-status_${
            product.is_available === "available" ? "available" : "unavailable"
          }`}
        >
          {product.is_available === "available" ? "Disponible" : "Agotado"}
        </span>
        {product.quantity>0 && (
          <span
            className={`product-stock  product-stock_${
              product.quantity > 0 ? "in-stock" : "out-of-stock"
            }`}
          >
            <span style={{ color: "black" }}>Cantidad disponible:</span>{" "}
            {product.quantity}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
