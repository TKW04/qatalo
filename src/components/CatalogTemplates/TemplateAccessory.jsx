import { Search, Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateAccessory.module.css";

/**
 * TemplateAccessory (Accesorios)
 * Grid compacto, minimalista tipo boutique, enfocado en los detalles
 * del producto. Hover revela acción rápida.
 */
export default function TemplateAccessory({
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
  const formatPrice = (price) =>
    Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brandInfo}>
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt={`Logo de ${business.name}`}
                className={styles.logo}
              />
            )}
            <div>
              <h1 className={styles.businessName}>{business?.name || "Boutique"}</h1>
              {business?.description && (
                <p className={styles.tagline}>{business.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onShare}
            className={styles.shareBtn}
            aria-label="Compartir catálogo"
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Controles de Búsqueda y Filtros Minimalistas */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} strokeWidth={1.5} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className={styles.searchInput}
            />
          </div>

          <nav className={styles.categoryNav}>
            <button
              className={`${styles.catBtn} ${
                selectedCategory === "all" ? styles.activeCat : ""
              }`}
              onClick={() => onCategoryChange("all")}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                className={`${styles.catBtn} ${
                  selectedCategory === cat.category_id ? styles.activeCat : ""
                }`}
                onClick={() => onCategoryChange(cat.category_id)}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={40} strokeWidth={1} />
          <p>No hay artículos disponibles</p>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Accesorios">
          {products.map((product) => (
            <article
              key={product.product_id}
              className={styles.card}
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
              <div className={styles.media}>
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

                <div className={styles.overlay}>
                  <button type="button" className={styles.quick}>
                    Vista rápida
                  </button>
                </div>
              </div>
              <div className={styles.body}>
                <h2 className={styles.productName}>{product.name}</h2>
                {product.description && (
                  <p className={styles.productDesc}>{product.description}</p>
                )}
                <span className={styles.price}>
                  {product.currency} {formatPrice(product.price)}
                </span>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}