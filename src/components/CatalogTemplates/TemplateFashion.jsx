import { Share2, ShoppingBag } from "lucide-react";
import styles from "./TemplateFashion.module.css";
import shared from "./catalogShared.module.css";
import ProductThumb from "./ProductThumb";
import CardBadges from "./CardBadges";
import SearchBar from "./SearchBar";
import CategoryPills from "./CategoryPills";
import CollectionsGrid from "./CollectionsGrid";
import { cardPriceLabel, PRIORITY_IMAGES } from "./catalogPrice";

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

  return (
    <main className={styles.page}>
      {/* Navegación superior mínima */}
      <div className={styles.topNav}>
        <button type="button" onClick={onShare} className={styles.shareBtn} aria-label="Compartir catálogo">
          <Share2 size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>Compartir</span>
        </button>
      </div>

      <header className={styles.header}>
        {logo_url && <img className={styles.logo} src={logo_url} alt={`Logo de ${name}`} />}
        <h1 className={styles.businessName}>{name}</h1>
        {description && <p className={styles.intro}>{description}</p>}
      </header>

      {/* Controles de búsqueda y filtros estilo editorial */}
      <div className={styles.controls}>
        <CategoryPills
          categories={categories}
          selected={selectedCategory}
          onChange={onCategoryChange}
          allLabel="Colección Completa"
          className={styles.categoryNav}
          pillClassName={styles.catLink}
          activeClassName={styles.activeCat}
        />

        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Buscar piezas..."
          label="Buscar piezas"
          className={styles.searchBox}
          iconClassName={styles.searchIcon}
          inputClassName={styles.searchInput}
          iconSize={16}
        />
      </div>

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
          <p>La colección no cuenta con piezas para esta selección.</p>
        </div>
      ) : (
        <section className={styles.collection} aria-label="Colección">
          {products.map((product, index) => (
            <article
              key={product.product_id}
              className={`${styles.editorial} ${index % 2 === 1 ? styles.reverse : ""}`}
            >
              <figure className={styles.figure}>
                <ProductThumb
                  product={product}
                  business={business}
                  imgClassName={styles.image}
                  placeholderClassName={styles.imagePlaceholder}
                  priority={index < PRIORITY_IMAGES}
                  width={800}
                  height={600}
                />
                <CardBadges
                  featured={product.featured}
                  soldOut={product.is_available !== "available"}
                  soldOutClassName={styles.soldOutBadge}
                />
              </figure>

              <div className={styles.copy}>
                {product.show_quantity && product.quantity > 0 && (
                  <span className={styles.label}>
                    {product.quantity} Disponibles
                  </span>
                )}
                <h2 className={styles.productName}>
                  <button type="button" className={shared.cardLink} onClick={() => onProductClick(product)}>
                    {product.name}
                  </button>
                </h2>
                {product.description && (
                  <p className={styles.productDesc}>{product.description}</p>
                )}
                <div className={styles.footer}>
                  <span className={styles.price}>{cardPriceLabel(product)}</span>
                  <span className={styles.cta} aria-hidden="true">Descubrir</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
