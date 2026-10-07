import shared from "./catalogShared.module.css";
import { themeVars } from "./catalogTheme";

// Skeleton de carga del catálogo público con la paleta del negocio
// (o neutra si aún no se conoce). Sin marca Qatalo.
const CatalogSkeleton = ({ palette }) => {
  const { scheme, vars } = themeVars(palette);
  const style = palette
    ? {
      "--theme-primary": palette.primary,
      "--theme-secondary": palette.secondary,
      "--theme-accent": palette.accent,
      "--theme-background": palette.background,
      ...vars,
    }
    : { "--theme-background": "#f6f6f6", "--theme-secondary": "#2b2b2b" };

  return (
    <div className={`${shared.themeRoot} ${shared.skeleton}`} data-scheme={palette ? scheme : "light"} style={style} aria-busy="true">
      <span className={shared.visuallyHidden} role="status">Cargando catálogo…</span>
      <div className={shared.skeletonInner} aria-hidden="true">
        <div className={shared.skHeader}>
          <div className={`${shared.skBlock} ${shared.skLogo}`} />
          <div className={shared.skLines}>
            <div className={`${shared.skBlock} ${shared.skLine}`} style={{ width: "45%", height: 22 }} />
            <div className={`${shared.skBlock} ${shared.skLine}`} style={{ width: "70%" }} />
          </div>
        </div>
        <div className={`${shared.skBlock} ${shared.skSearch}`} />
        <div className={shared.skPills}>
          {[0, 1, 2, 3].map((i) => <div key={i} className={`${shared.skBlock} ${shared.skPill}`} />)}
        </div>
        <div className={shared.skGrid}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={shared.skCard}>
              <div className={`${shared.skBlock} ${shared.skImage}`} />
              <div className={`${shared.skBlock} ${shared.skLine}`} style={{ width: "80%" }} />
              <div className={`${shared.skBlock} ${shared.skLine}`} style={{ width: "40%" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatalogSkeleton;
