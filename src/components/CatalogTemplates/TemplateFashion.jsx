import { Search, Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateFashion.module.css";

/**
 * TemplateFashion (Ropa / Perfume)
 * Editorial, imágenes grandes, tipografía elegante, mucho espacio en blanco.
 * Layout alternado tipo revista para crear ritmo visual.
 */
export default function TemplateFashion({
  business = {},
  categories = [],
  products = [],
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onProductClick,
  onShare,
}) {
  const { name = "Maison", description = "", logo_url } = business;

  const formatPrice = (price) =>
    Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className={styles.page}>
      {/* Navegación superior mínima */}
      <nav className={styles.topNav}>
        <button onClick={onShare} className={styles.shareBtn} aria-label="Compartir catálogo">
          <Share2 size={18} strokeWidth={1.5} />
          <span>Compartir</span>
        </button>
      </nav>

      <header className={styles.header}>
        {logo_url && <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />}
        <h1 className={styles.businessName}>{name}</h1>
        {description && <p className={styles.intro}>{description}</p>}
      </header>

      {/* Controles de búsqueda y filtros estilo editorial */}
      <div className={styles.controls}>
        <nav className={styles.categoryNav} aria-label="Categorías">
          <button
            className={`${styles.catLink} ${selectedCategory === "all" ? styles.activeCat : ""}`}
            onClick={() => onCategoryChange("all")}
          >
            Colección Completa
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              className={`${styles.catLink} ${selectedCategory === cat.category_id ? styles.activeCat : ""}`}
              onClick={() => onCategoryChange(cat.category_id)}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        <div className={styles.searchBox}>
          <Search size={16} strokeWidth={1.5} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar piezas..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={40} strokeWidth={1} />
          <p>La colección no cuenta con piezas para esta selección.</p>
        </div>
      ) : (
        <section className={styles.collection} aria-label="Colección">
          {products.map((product, index) => (
            <article
              key={product.product_id}
              className={`${styles.editorial} ${index % 2 === 1 ? styles.reverse : ""}`}
              onClick={() => onProductClick(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onProductClick(product);
                }
              }}
            >
              <figure className={styles.figure}>
                {product.imagesUrl?.[0]?.image ? (
                  <img
                    className={styles.image}
                    src={product.imagesUrl[0].image}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.imagePlaceholder}></div>
                )}

                {product.is_available !== "available" && (
                  <span className={styles.soldOutBadge}>Agotado</span>
                )}
              </figure>
              
              <div className={styles.copy}>
                {product.show_quantity && product.quantity > 0 && (
                  <span className={styles.label}>
                    {product.quantity} Disponibles
                  </span>
                )}
                <h2 className={styles.productName}>{product.name}</h2>
                {product.description && (
                  <p className={styles.productDesc}>{product.description}</p>
                )}
                <div className={styles.footer}>
                  <span className={styles.price}>
                    {product.currency} {formatPrice(product.price)}
                  </span>
                  <button type="button" className={styles.cta}>
                    Descubrir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}