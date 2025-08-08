import { shareContent } from "../services/shareService";
import { Share } from "lucide-react";

function HeaderPublic({ business }) {
  const handleShare = () => {
    const url = window.location.href;
    const text = `Mira el catálogo de ${business.name}`;
    shareContent(text, url);
  };

  return (
    <header className="catalog-header">
      <div className="container">
        <div className="catalog-header-content">
          <div className="catalog-business-info">
            {business.logoUrl && (
              <img
                src={business.logoUrl || "/placeholder.svg"}
                alt={`Logo de ${business.name}`}
                className="catalog-logo"
              />
            )}
            <div className="catalog-business-details">
              <h1>{business.name}</h1>
              {business.description && <p>{business.description}</p>}
            </div>
          </div>

          <button
            onClick={handleShare}
            className="btn btn-secondary"
            aria-label="Compartir catálogo"
          >
            <Share /> Compartir
          </button>
        </div>
      </div>
    </header>
  );
}

export default HeaderPublic;
