// Tarjetas de colección (home_mode "none"). `styles` es el módulo CSS de la
// plantilla, que define: collections, collectionsGrid, collectionCard,
// collectionMedia, collectionImg, collectionLogo, collectionBody,
// collectionName, collectionCount.
const CollectionsGrid = ({ collections = [], business, onSelect, styles }) => (
  <section className={styles.collections} aria-label="Colecciones">
    <div className={styles.collectionsGrid}>
      {collections.map((c, i) => {
        const useLogo = c.cover && c.cover === business?.logo_url;
        return (
          <button
            key={c.category_id}
            type="button"
            className={styles.collectionCard}
            onClick={() => onSelect?.(c.category_id)}
          >
            <div className={styles.collectionMedia}>
              {c.cover ? (
                <img
                  src={c.cover}
                  alt=""
                  width={400}
                  height={400}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
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
);

export default CollectionsGrid;
