import ProductCard from "./ProductCard";

const ProductGrid = ({ products, onProductClick }) => {
  if (products.length === 0) {
    return (
      <div className="no-products">
        <h3>No se encontraron productos</h3>
        <p>Intenta cambiar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products
        .sort((a, b) => a.orden - b.orden)
        .map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            onClick={onProductClick}
          />
        ))}
    </div>
  );
};

export default ProductGrid;
