import { Search, Share2, ShoppingBag, Star } from "lucide-react";
import styles from "./TemplateFashion.module.css";
import { curSymbol } from "../../helpers/utils";
import ProductThumb from "./ProductThumb";

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
  collections = [],
  showCollections = false,
  onSelectCollection,
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
                    {curSymbol(product.currency)} {formatPrice(product.price)}
                  </span>
                  <button type="button" className={styles.cta}>
                    Descubrir
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