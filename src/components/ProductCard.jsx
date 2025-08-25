const ProductCard = ({ product, onClick }) => {
  console.log(product);
  
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
        src={product.imagesUrl[0] || "/placeholder.svg?height=200&width=300&query=producto"}
        alt={product.name}
        className="product-image"
      />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">${product.price.toFixed(2)}</div>
        <span
          className={`product-status ${
            product.available ? "available" : "unavailable"
          }`}
        >
          {product.available ? "Disponible" : "Agotado"}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
