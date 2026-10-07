import { Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateAccessory.module.css";
import shared from "./catalogShared.module.css";
import ProductThumb from "./ProductThumb";
import CardBadges from "./CardBadges";
import SearchBar from "./SearchBar";
import CategoryPills from "./CategoryPills";
import CollectionsGrid from "./CollectionsGrid";
import { cardPriceLabel, PRIORITY_IMAGES } from "./catalogPrice";

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
  collections = [],
  showCollections = false,
  onSelectCollection,
}) {
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
            type="button"
            onClick={onShare}
            className={styles.shareBtn}
            aria-label="Compartir catálogo"
          >
            <Share2 size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Controles de Búsqueda y Filtros Minimalistas */}
        <div className={styles.controls}>
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar..."
            label="Buscar artículos"
            className={styles.searchBox}
            iconClassName={styles.searchIcon}
            inputClassName={styles.searchInput}
            iconSize={16}
          />

          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            allLabel="Todos"
            className={styles.categoryNav}
            pillClassName={styles.catBtn}
            activeClassName={styles.activeCat}
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
          <ShoppingBag size={40} strokeWidth={1} aria-hidden="true" />
          <p>No hay artículos disponibles</p>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Accesorios">
          {products.map((product, index) => (
            <article key={product.product_id} className={styles.card}>
              <div className={styles.media}>
                <ProductThumb
                  product={product}
                  business={business}
                  imgClassName={styles.image}
                  placeholderClassName={styles.imagePlaceholder}
                  priority={index < PRIORITY_IMAGES}
                />

                <div className={styles.overlay} aria-hidden="true">
                  <span className={styles.quick}>Vista rápida</span>
                </div>

                <CardBadges
                  featured={product.featured}
                  soldOut={product.is_available !== "available"}
                  starClassName={styles.star}
                  soldOutClassName={styles.soldOutBadge}
                />
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
                <span className={styles.price}>{cardPriceLabel(product)}</span>
              </div>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
