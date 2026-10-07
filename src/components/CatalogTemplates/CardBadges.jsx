import { Star } from "lucide-react";
import shared from "./catalogShared.module.css";

// Badges de tarjeta con posición única en las 6 plantillas:
// estrella "Destacado" arriba-izquierda, "Agotado" (pill) arriba-derecha.
// Cada plantilla puede pasar clases extra para ajustar forma/tipografía,
// nunca la posición. El contenedor debe tener position:relative.
const CardBadges = ({ featured, soldOut, starClassName = "", soldOutClassName = "" }) => (
  <>
    {featured && (
      <span className={`${shared.badgeStar} ${starClassName}`} role="img" aria-label="Destacado">
        <Star size={16} strokeWidth={2} fill="currentColor" aria-hidden="true" />
      </span>
    )}
    {soldOut && (
      <span className={`${shared.badgeSoldOut} ${soldOutClassName}`}>Agotado</span>
    )}
  </>
);

export default CardBadges;
