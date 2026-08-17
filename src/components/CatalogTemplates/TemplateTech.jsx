import { Search, Share2, ShoppingBag, Star } from "lucide-react";
import styles from "./TemplateTech.module.css";
import { curSymbol } from "../../helpers/utils";
import ProductThumb from "./ProductThumb";

/**
 * TemplateTech (Celulares / Electrónica)
 * Estilo Apple: minimalista, mucho espacio para destacar el producto,
 * tipografía técnica y precisa.
 */
export default function TemplateTech({
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
  const { name = "Tech Store", description = "", logo_url } = business;

  const formatPrice = (price) =>
    Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={onShare} className={styles.shareBtn} aria-label="Compartir catálogo">
            <Share2 size={20} />
          </button>
        </div>

        {logo_url && (
          <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />
        )}
        <h1 className={styles.businessName}>{name}</h1>
        {description && <p className={styles.tagline}>{description}</p>}

        {/* Controles de Búsqueda y Filtros estilo iOS */}
        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar modelos, accesorios..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.segmentedControl}>
            <button
              className={`${styles.segmentBtn} ${selectedCategory === "all" ? styles.activeSegment : ""}`}
              onClick={() => onCategoryChange("all")}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                className={`${styles.segmentBtn} ${selectedCategory === cat.category_id ? styles.activeSegment : ""}`}
                onClick={() => onCategoryChange(cat.category_id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
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
          <ShoppingBag size={48} strokeWidth={1} />
          <p>No se encontraron resultados</p>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Productos">
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
              <div className={styles.cardTop}>
                {product.show_quantity && product.quantity > 0 && (
                  <span className={styles.badge}>Disp: {product.quantity}</span>
                )}
                <h2 className={styles.productName}>{product.name}</h2>
                {product.description && (
                  <p className={styles.productDesc}>{product.description}</p>
                )}
              </div>

              <div className={styles.stage}>
                <ProductThumb
                  product={product}
                  business={business}
                  imgClassName={styles.image}
                  placeholderClassName={styles.imagePlaceholder}
                />

                {product.featured && (
                  <span className={styles.featuredStar} aria-label="Destacado">
                    <Star size={16} strokeWidth={2} fill="currentColor" />
                  </span>
                )}

                {product.is_available !== "available" && (
                  <span className={styles.soldOutBadge}>Agotado</span>
                )}
              </div>

              <div className={styles.cardBottom}>
                <span className={styles.price}>
                  Desde {curSymbol(product.currency)} {formatPrice(product.price)}
                </span>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.buy}
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick(product);
                    }}
                  >
                    Comprar
                  </button>
                  <button
                    type="button"
                    className={styles.learn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick(product);
                    }}
                  >
                    Más información
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}