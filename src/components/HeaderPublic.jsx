import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Share } from "lucide-react";
import { Button } from "primereact/button";

import { shareContent } from "../services/shareService";
import { useNotification } from "./UI/NotificationProvider";
import { GetBusinessBySlug } from "../store/business-store/business-actions";

let once = true;
const HeaderPublic = ({ setIsLoading }) => {
  const business = useSelector((state) => state.business.business);
  const { showError, showSuccess, showWarning } = useNotification();
  const dispatch = useDispatch();
  const { slug } = useParams();

  useEffect(() => {
    if (once) {
      dispatch(GetBusinessBySlug(slug, showError));
      setIsLoading(true);
      once = false;
    }
  }, [dispatch, slug, showError, setIsLoading]);

  const handleShare = () => {
    const url = window.location.href;
    const text = `Mira el catálogo de ${business.name}`;
    shareContent(text, url, showSuccess, showWarning);
  };

  return (
    <header className="catalog-header">
      <div className="container">
        <div className="catalog-header-content">
          <div className="catalog-business-info">
            {business.logo_url && (
              <img
                src={business.logo_url || "/placeholder.svg"}
                alt={`Logo de ${business.name}`}
                className="catalog-logo"
              />
            )}
            <div className="catalog-business-details">
              <h1>{business.name}</h1>
              {business.description && <p>{business.description}</p>}
            </div>
          </div>

          <Button
            onClick={handleShare}
            className="btn btn-share"
            aria-label="Compartir catálogo"
            label="Compartir"
            icon={<Share />}
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderPublic;
