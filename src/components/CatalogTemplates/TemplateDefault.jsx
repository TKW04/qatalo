import { Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateDefault.module.css";
import shared from "./catalogShared.module.css";
import ProductThumb from "./ProductThumb";
import CardBadges from "./CardBadges";
import SearchBar from "./SearchBar";
import CategoryPills from "./CategoryPills";
import CollectionsGrid from "./CollectionsGrid";
import { cardPriceLabel, PRIORITY_IMAGES } from "./catalogPrice";

const TemplateDefault = ({
  business,
  categories,
  products,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onProductClick,
  onShare,
  collections = [],
  showCollections = false,
  onSelectCollection,
}) => {
  return (
    <div className={styles.templateWrapper}>
      {/* HEADER DE LA TIENDA */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.businessInfo}>
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt={`Logo de ${business.name}`}
                className={styles.logo}
              />
            )}
            <div className={styles.businessDetails}>
              <h1 className={styles.businessName}>{business?.name}</h1>
              {business?.description && (
                <p className={styles.businessDescription}>{business.description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className={styles.shareButton}
            aria-label="Compartir catálogo"
          >
            <Share2 size={20} aria-hidden="true" />
            <span>Compartir</span>
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* CONTROLES: BUSCADOR Y FILTROS */}
        <div className={styles.controls}>
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar productos..."
            className={styles.searchBar}
            iconClassName={styles.searchIcon}
            inputClassName={styles.searchInput}
          />

          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            allLabel="Todas"
            className={styles.categoryFilters}
            pillClassName={styles.categoryPill}
            activeClassName={styles.activeCategory}
          />
        </div>

        {/* COLECCIONES (solo modo "no mostrar productos") */}
        {showCollections && (
          <CollectionsGrid
            collections={collections}
            business={business}
            onSelect={onSelectCollection}
            styles={styles}
          />
        )}

        {/* GRILLA DE PRODUCTOS */}
        {!(showCollections && products.length === 0) && (products.length === 0 ? (
          <div className={styles.noProducts}>
            <ShoppingBag size={48} className={styles.emptyIcon} aria-hidden="true" />
            <h2 className={styles.emptyTitle}>No se encontraron productos</h2>
            <p>Intenta cambiar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {products.map((product, index) => (
              <article key={product.product_id} className={styles.productCard}>
                <div className={styles.imageContainer}>
                  <ProductThumb
                    product={product}
                    business={business}
                    imgClassName={styles.productImage}
                    placeholderClassName={styles.productImage}
                    priority={index < PRIORITY_IMAGES}
                  />
                  <CardBadges
                    featured={product.featured}
                    soldOut={product.is_available !== "available"}
                  />
                </div>

                <div className={styles.productInfo}>
                  <h2 className={styles.productName}>
                    <button
                      type="button"
                      className={shared.cardLink}
                      onClick={() => onProductClick(product)}
                    >
                      {product.name}
                    </button>
                  </h2>
                  <div className={styles.productPrice}>
                    {cardPriceLabel(product)}
                  </div>

                  {product.quantity > 0 && product.show_quantity && (
                    <div className={styles.productStock}>
                      Disponible: <strong>{product.quantity}</strong>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
};

export default TemplateDefault;