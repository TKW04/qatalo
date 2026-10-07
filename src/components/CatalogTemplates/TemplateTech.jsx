import { Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateTech.module.css";
import shared from "./catalogShared.module.css";
import ProductThumb from "./ProductThumb";
import CardBadges from "./CardBadges";
import SearchBar from "./SearchBar";
import CategoryPills from "./CategoryPills";
import CollectionsGrid from "./CollectionsGrid";
import { cardPriceLabel, PRIORITY_IMAGES } from "./catalogPrice";

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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button type="button" onClick={onShare} className={styles.shareBtn} aria-label="Compartir catálogo">
            <Share2 size={20} aria-hidden="true" />
          </button>
        </div>

        {logo_url && (
          <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />
        )}
        <h1 className={styles.businessName}>{name}</h1>
        {description && <p className={styles.tagline}>{description}</p>}

        {/* Controles de Búsqueda y Filtros estilo iOS */}
        <div className={styles.controls}>
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar modelos, accesorios..."
            className={styles.searchBar}
            iconClassName={styles.searchIcon}
            inputClassName={styles.searchInput}
            iconSize={18}
          />

          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            allLabel="Todos"
            className={styles.segmentedControl}
            pillClassName={styles.segmentBtn}
            activeClassName={styles.activeSegment}
          />
        </div>
      </header>

      {showCollections && (
        <CollectionsGrid
          collections={collections}
          business={business}
          onSelect={onSelectCollection}
          styles={styles}
        />
      )}

      {!(showCollections && products.length === 0) && (products.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={48} strokeWidth={1} aria-hidden="true" />
          <p>No se encontraron resultados</p>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Productos">
          {products.map((product, index) => (
            <article key={product.product_id} className={styles.card}>
              <div className={styles.cardTop}>
                {product.show_quantity && product.quantity > 0 && (
                  <span className={styles.badge}>Disp: {product.quantity}</span>
                )}
                <h2 className={styles.productName}>
                  <button
                    type="button"
                    className={shared.cardLink}
                    onClick={() => onProductClick(product)}
                  >
                    {product.name}
                  </button>
                </h2>
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
                  priority={index < PRIORITY_IMAGES}
                />
                <CardBadges
                  featured={product.featured}
                  soldOut={product.is_available !== "available"}
                />
              </div>

              <div className={styles.cardBottom}>
                <span className={styles.price}>{cardPriceLabel(product)}</span>
                {/* Decorativos: toda la tarjeta abre el detalle (botón del título) */}
                <div className={styles.actions} aria-hidden="true">
                  <span className={styles.buy}>Comprar</span>
                  <span className={styles.learn}>Más información</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}