import { Search, Share2, UtensilsCrossed, Star } from "lucide-react";
import styles from "./TemplateFood.module.css";
import ProductThumb from "./ProductThumb";

/**
 * TemplateFood (Comidas / Dulces)
 * Imágenes de alto impacto, tarjetas tipo 'card' con precios resaltados,
 * botones de acción grandes y apetitosos.
 */
export default function TemplateFood({
  business = {},
  categories = [],
  products = [],
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onProductClick,
  onShare,
  collections = [],
  showCollections = false,
  onSelectCollection,
}) {
  const { name = "Cocina", description = "", logo_url } = business;

  const formatPrice = (price) =>
    Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={onShare} className={styles.shareBtn} aria-label="Compartir menú">
            <Share2 size={20} />
          </button>
        </div>

        <div className={styles.brandContainer}>
          {logo_url && (
            <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />
          )}
          <div>
            <h1 className={styles.businessName}>{name}</h1>
            {description && <p className={styles.tagline}>{description}</p>}
          </div>
        </div>

        {/* Controles estilo App de Delivery */}
        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="¿Qué se te antoja hoy?"
              className={styles.searchInput}
            />
          </div>

          <nav className={styles.categoryNav} aria-label="Categorías del menú">
            <button
              className={`${styles.catPill} ${selectedCategory === "all" ? styles.activePill : ""}`}
              onClick={() => onCategoryChange("all")}
            >
              Menú Completo
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                className={`${styles.catPill} ${selectedCategory === cat.category_id ? styles.activePill : ""}`}
                onClick={() => onCategoryChange(cat.category_id)}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {showCollections && (
        <section className={styles.collections} aria-label="Colecciones">
          <div className={styles.collectionsGrid}>
            {collections.map((c) => {
              const useLogo = c.cover && c.cover === business?.logo_url;
              return (
                <button
                  key={c.category_id}
                  type="button"
                  className={styles.collectionCard}
                  onClick={() => onSelectCollection?.(c.category_id)}
                >
                  <div className={styles.collectionMedia}>
                    {c.cover ? (
                      <img
                        src={c.cover}
                        alt={c.name}
                        loading="lazy"
                        className={useLogo ? styles.collectionLogo : styles.collectionImg}
                      />
                    ) : null}
                  </div>
                  <div className={styles.collectionBody}>
                    <span className={styles.collectionName}>{c.name}</span>
                    <span className={styles.collectionCount}>{c.count} producto{c.count !== 1 ? "s" : ""}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!(showCollections && products.length === 0) && (products.length === 0 ? (
        <div className={styles.emptyState}>
          <UtensilsCrossed size={50} strokeWidth={1.5} />
          <p>No encontramos platillos para esta selección.</p>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Menú">
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
                <ProductThumb
                  product={product}
                  business={business}
                  imgClassName={styles.image}
                  placeholderClassName={styles.imagePlaceholder}
                />

                {product.show_quantity && product.quantity > 0 && (
                  <span className={styles.ribbon}>Disp: {product.quantity}</span>
                )}

                {product.featured && (
                  <span className={styles.featuredStar} aria-label="Destacado">
                    <Star size={16} strokeWidth={2} fill="currentColor" />
                  </span>
                )}

                {product.is_available !== "available" && (
                  <div className={styles.soldOutOverlay}>
                    <span>Agotado</span>
                  </div>
                )}

                <span className={styles.priceTag}>
                  <small>{product.currency}</small> {formatPrice(product.price)}
                </span>
              </div>

              <div className={styles.body}>
                <h2 className={styles.productName}>{product.name}</h2>
                {product.description && (
                  <p className={styles.productDesc}>{product.description}</p>
                )}
                <button
                  type="button"
                  className={styles.order}
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductClick(product);
                  }}
                  disabled={product.is_available !== "available"}
                >
                  {product.is_available === "available" ? "Ordenar ahora" : "No disponible"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}