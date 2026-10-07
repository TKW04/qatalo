import { Share2, UtensilsCrossed } from "lucide-react";
import styles from "./TemplateFood.module.css";
import shared from "./catalogShared.module.css";
import ProductThumb from "./ProductThumb";
import CardBadges from "./CardBadges";
import SearchBar from "./SearchBar";
import CategoryPills from "./CategoryPills";
import CollectionsGrid from "./CollectionsGrid";
import { cardPriceLabel, PRIORITY_IMAGES } from "./catalogPrice";

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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button type="button" onClick={onShare} className={styles.shareBtn} aria-label="Compartir menú">
            <Share2 size={20} aria-hidden="true" />
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
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="¿Qué se te antoja hoy?"
            label="Buscar en el menú"
            className={styles.searchContainer}
            iconClassName={styles.searchIcon}
            inputClassName={styles.searchInput}
          />

          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            allLabel="Menú Completo"
            label="Categorías del menú"
            className={styles.categoryNav}
            pillClassName={styles.catPill}
            activeClassName={styles.activePill}
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
          <UtensilsCrossed size={50} strokeWidth={1.5} aria-hidden="true" />
          <p>No encontramos platillos para esta selección.</p>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Menú">
          {products.map((product, index) => {
            const soldOut = product.is_available !== "available";
            return (
              <article
                key={product.product_id}
                className={`${styles.card} ${soldOut ? styles.isSoldOut : ""}`}
              >
                <div className={styles.media}>
                  <ProductThumb
                    product={product}
                    business={business}
                    imgClassName={styles.image}
                    placeholderClassName={styles.imagePlaceholder}
                    priority={index < PRIORITY_IMAGES}
                  />

                  <CardBadges featured={product.featured} soldOut={soldOut} />

                  {product.show_quantity && product.quantity > 0 && (
                    <span className={styles.ribbon}>Disp: {product.quantity}</span>
                  )}

                  <span className={styles.priceTag}>{cardPriceLabel(product)}</span>
                </div>

                <div className={styles.body}>
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
                  {/* Decorativo: toda la tarjeta abre el detalle (botón del título) */}
                  <span className={styles.order} aria-hidden="true">
                    {soldOut ? "No disponible" : "Ordenar ahora"}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}