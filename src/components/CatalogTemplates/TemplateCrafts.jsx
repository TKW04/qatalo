import { Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateCrafts.module.css";
import shared from "./catalogShared.module.css";
import ProductThumb from "./ProductThumb";
import CardBadges from "./CardBadges";
import SearchBar from "./SearchBar";
import CategoryPills from "./CategoryPills";
import CollectionsGrid from "./CollectionsGrid";
import { cardPriceLabel, PRIORITY_IMAGES } from "./catalogPrice";

// Proporciones fijas (rotan por posición): mantienen el ritmo del mosaico
// sin saltos de layout mientras cargan las imágenes.
const RATIOS = [
  { cls: "ratioPortrait", w: 600, h: 750 },
  { cls: "ratioSquare", w: 600, h: 600 },
  { cls: "ratioTall", w: 600, h: 800 },
];

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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          <button type="button" onClick={onShare} className={styles.shareBtn} aria-label="Compartir catálogo">
            <Share2 size={20} aria-hidden="true" />
          </button>
        </div>
        {logo_url && <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />}
        <h1 className={styles.businessName}>{name}</h1>
        {description && <p className={styles.description}>{description}</p>}

        {/* Controles de búsqueda y filtros con estilo redondeado */}
        <div className={styles.controls}>
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar creaciones..."
            label="Buscar creaciones"
            className={styles.searchBubble}
            iconClassName={styles.searchIcon}
            inputClassName={styles.searchInput}
            iconSize={18}
          />

          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            allLabel="Todo"
            className={styles.categoryNav}
            pillClassName={styles.chipBtn}
            activeClassName={styles.activeChip}
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
          <ShoppingBag size={48} strokeWidth={1.5} aria-hidden="true" />
          <p>No encontramos creaciones con estos filtros</p>
        </div>
      ) : (
        <section className={styles.masonry} aria-label="Galería de productos">
          {products.map((product, index) => {
            const ratio = RATIOS[index % RATIOS.length];
            return (
              <article key={product.product_id} className={styles.pin}>
                <div className={`${styles.imageWrap} ${styles[ratio.cls]}`}>
                  <ProductThumb
                    product={product}
                    business={business}
                    imgClassName={styles.image}
                    placeholderClassName={styles.imagePlaceholder}
                    priority={index < PRIORITY_IMAGES}
                    width={ratio.w}
                    height={ratio.h}
                  />

                  <CardBadges
                    featured={product.featured}
                    soldOut={product.is_available !== "available"}
                  />

                  <span className={styles.save} aria-hidden="true">Ver</span>
                </div>
                <div className={styles.body}>
                  <h2 className={styles.productName}>
                    <button type="button" className={shared.cardLink} onClick={() => onProductClick(product)}>
                      {product.name}
                    </button>
                  </h2>
                  {product.description && (
                    <p className={styles.productDesc}>{product.description}</p>
                  )}
                  <div className={styles.meta}>
                    <span className={styles.price}>{cardPriceLabel(product)}</span>
                    {product.show_quantity && product.quantity > 0 && (
                      <span className={styles.chip}>Disp: {product.quantity}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
