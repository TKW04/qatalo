import { Search, Share2, ShoppingBag, Star } from "lucide-react";
import styles from "./TemplateDefault.module.css";
import { curSymbol } from "../../helpers/utils";
import ProductThumb from "./ProductThumb";

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
  const formatPrice = (price) =>
    Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
            onClick={onShare}
            className={styles.shareButton}
            aria-label="Compartir catálogo"
          >
            <Share2 size={20} />
            <span>Compartir</span>
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* CONTROLES: BUSCADOR Y FILTROS */}
        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos..."
            />
          </div>

          <div className={styles.categoryFilters}>
            <button
              className={`${styles.categoryPill} ${
                selectedCategory === "all" ? styles.activeCategory : ""
              }`}
              onClick={() => onCategoryChange("all")}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.category_id}
                className={`${styles.categoryPill} ${
                  selectedCategory === category.category_id
                    ? styles.activeCategory
                    : ""
                }`}
                onClick={() => onCategoryChange(category.category_id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* COLECCIONES (solo modo "no mostrar productos") */}
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

        {/* GRILLA DE PRODUCTOS */}
        {!(showCollections && products.length === 0) && (products.length === 0 ? (
          <div className={styles.noProducts}>
            <ShoppingBag size={48} className={styles.emptyIcon} />
            <h3>No se encontraron productos</h3>
            <p>Intenta cambiar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {products.map((product) => (
              <article
                key={product.product_id}
                className={styles.productCard}
                onClick={() => onProductClick(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onProductClick(product);
                  }
                }}
                aria-label={`Ver detalles de ${product.name}`}
              >
                <div className={styles.imageContainer}>
                  <ProductThumb
                    product={product}
                    business={business}
                    imgClassName={styles.productImage}
                    placeholderClassName={styles.productImage}
                  />
                  {product.featured && (
                    <span className={styles.featuredStar} aria-label="Destacado">
                      <Star size={16} strokeWidth={2} fill="currentColor" />
                    </span>
                  )}
                  {product.is_available !== "available" && (
                    <span className={styles.badgeUnavailable}>Agotado</span>
                  )}
                </div>

                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.productPrice}>
                    {curSymbol(product.currency)} {formatPrice(product.price)}
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