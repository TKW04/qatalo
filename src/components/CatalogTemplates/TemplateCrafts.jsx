import { Search, Share2, ShoppingBag, Star } from "lucide-react";
import styles from "./TemplateCrafts.module.css";
import { curSymbol } from "../../helpers/utils";
import ProductThumb from "./ProductThumb";

/**
 * TemplateCrafts (Manualidades)
 * Diseño Masonry (estilo Pinterest), bordes redondeados, paletas suaves.
 * Usa CSS columns para un mosaico natural de alturas variables.
 */
export default function TemplateCrafts({
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
  const { name = "Taller", description = "", logo_url } = business;

  const formatPrice = (price) =>
    Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          <button onClick={onShare} className={styles.shareBtn} aria-label="Compartir catálogo">
            <Share2 size={20} />
          </button>
        </div>
        {logo_url && <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />}
        <h1 className={styles.businessName}>{name}</h1>
        {description && <p className={styles.description}>{description}</p>}

        {/* Controles de búsqueda y filtros con estilo redondeado */}
        <div className={styles.controls}>
          <div className={styles.searchBubble}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar creaciones..."
              className={styles.searchInput}
            />
          </div>

          <nav className={styles.categoryNav}>
            <button
              className={`${styles.chipBtn} ${selectedCategory === "all" ? styles.activeChip : ""}`}
              onClick={() => onCategoryChange("all")}
            >
              Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                className={`${styles.chipBtn} ${selectedCategory === cat.category_id ? styles.activeChip : ""}`}
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
          <ShoppingBag size={48} strokeWidth={1.5} />
          <p>No encontramos creaciones con estos filtros</p>
        </div>
      ) : (
        <section className={styles.masonry} aria-label="Galería de productos">
          {products.map((product) => (
            <article
              key={product.product_id}
              className={styles.pin}
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
              <div className={styles.imageWrap}>
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

                <button type="button" className={styles.save}>
                  Ver
                </button>
              </div>
              <div className={styles.body}>
                <h2 className={styles.productName}>{product.name}</h2>
                {product.description && (
                  <p className={styles.productDesc}>{product.description}</p>
                )}
                <div className={styles.meta}>
                  <span className={styles.price}>
                    {curSymbol(product.currency)} {formatPrice(product.price)}
                  </span>
                  {product.show_quantity && product.quantity > 0 && (
                    <span className={styles.chip}>Disp: {product.quantity}</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}