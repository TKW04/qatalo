// Pantalla neutra cuando el catálogo no está disponible (dueño sin suscripción vigente).
// No revela el motivo real; mantiene la marca del negocio con dignidad.
const CatalogUnavailable = ({ name, logoUrl }) => {
  return (
    <div style={S.wrap}>
      <div style={S.card}>
        {logoUrl ? (
          <img src={logoUrl} alt={name || "Logo"} style={S.logo} loading="lazy" />
        ) : (
          <div style={S.logoFallback}>{(name || "?").charAt(0).toUpperCase()}</div>
        )}
        {name && <h1 style={S.name}>{name}</h1>}
        <div style={S.divider} />
        <h2 style={S.title}>Este catálogo no está disponible en este momento</h2>
        <p style={S.text}>Vuelve pronto. Estamos trabajando para atenderte lo antes posible.</p>
      </div>
      <div style={S.foot}>
        <span style={S.footText}>Powered by Qatalo</span>
      </div>
    </div>
  );
};

const S = {
  wrap: {
    minHeight: "100vh", minHeight: "100dvh",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "1.5rem", background: "#f6f7f9", textAlign: "center",
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "2.5rem 1.75rem",
    maxWidth: 420, width: "100%", boxShadow: "0 10px 40px rgba(17,63,103,0.08)",
  },
  logo: { width: 96, height: 96, objectFit: "contain", margin: "0 auto 1rem", display: "block" },
  logoFallback: {
    width: 96, height: 96, borderRadius: "50%", background: "#113f67", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "2.5rem", fontWeight: 800, margin: "0 auto 1rem",
  },
  name: { fontSize: "1.25rem", fontWeight: 800, color: "#113f67", margin: "0 0 1rem" },
  divider: { height: 1, background: "#eef0f3", margin: "1rem 0 1.25rem" },
  title: { fontSize: "1.05rem", fontWeight: 700, color: "#1d2939", margin: "0 0 .6rem", lineHeight: 1.4 },
  text: { fontSize: ".92rem", color: "#667085", margin: 0, lineHeight: 1.5 },
  foot: { marginTop: "1.5rem" },
  footText: { fontSize: ".78rem", color: "#98a2b3" },
};

export default CatalogUnavailable;