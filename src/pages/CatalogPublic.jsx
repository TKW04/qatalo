import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Loading from "../components/UI/Loading";
import CatalogManager from "../components/CatalogTemplates/CatalogManager";
import { fetchBusinessBySlug } from "../services/businessApi";
import { fetchProductsByBusinessId } from "../services/productsApi";
import { fetchCategoriesByBusinessId } from "../services/categoryApi";
import { PREDEFINED_PALETTES } from "../constants/themePalettes";
import NotFoundPage from "../pages/NotFoundPage";
import "../styles/catalog.css";

const DEFAULT_PALETTE =
  (PREDEFINED_PALETTES.find((p) => p.id === "ocean-breeze") || PREDEFINED_PALETTES[0]).colors;

const parsePalette = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (typeof raw === "object") return raw;
  return null;
};

const isAvailable = (status) =>
  !status || status === "trialing" || status === "active";

const CatalogPublic = () => {
  const { slug } = useParams();

  const { data: business, isLoading: loadingBusiness, isError } = useQuery({
    queryKey: ["public-business", slug],
    queryFn: () => fetchBusinessBySlug(slug),
    enabled: !!slug,
    retry: false,
  });

  const businessId = business?.business_id;

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["public-products", businessId],
    queryFn: () => fetchProductsByBusinessId(businessId),
    enabled: !!businessId,
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories", businessId],
    queryFn: () => fetchCategoriesByBusinessId(businessId),
    enabled: !!businessId,
    retry: false,
  });

  // Normaliza: template por defecto + paleta (parse / fallback ocean-breeze)
  const normalizedBusiness = useMemo(() => {
    if (!business) return null;
    return {
      ...business,
      templateId: business.templateId || "default",
      themePalette: parsePalette(business.themePalette) || DEFAULT_PALETTE,
    };
  }, [business]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [products]
  );

  if (loadingBusiness || (businessId && loadingProducts)) {
    return <Loading message="Cargando catálogo..." visible />;
  }

  if (isError || !business || !isAvailable(business.status)) {
    return (
      <NotFoundPage
        title="Catálogo no encontrado"
        message="Este catálogo no existe o no está disponible en este momento. Si eres el dueño, verifica que tu tienda esté activa."
        homeLabel="Ir a Qatalo"
        showBack={false}
      />
    );
  }

  return (
    <CatalogManager
      businessData={normalizedBusiness}
      products={sortedProducts}
      categories={categories}
    />
  );
};

export default CatalogPublic;