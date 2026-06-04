import { useState, useMemo } from "react";
import TemplateDefault from "./TemplateDefault";
import TemplateFashion from "./TemplateFashion";
import TemplateTech from "./TemplateTech";
import TemplateCrafts from "./TemplateCrafts";
import TemplateFood from "./TemplateFood";
import TemplateAccessory from "./TemplateAccessory";
import ProductModal from "../ProductModal";
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES } from "./previewData";

const Templates = {
  default: TemplateDefault,
  fashion: TemplateFashion,
  tech: TemplateTech,
  crafts: TemplateCrafts,
  food: TemplateFood,
  accessory: TemplateAccessory,
};

const noop = () => {};

const parsePalette = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (typeof raw === "object") return raw;
  return {};
};

const CatalogManager = ({ businessData, products = [], categories: categoriesProp, isPreview = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocality, setSelectedLocality] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const usingDummy = isPreview && products.length === 0;
  const sourceProducts = usingDummy ? DUMMY_PRODUCTS : products;

  const categories = useMemo(() => {
    if (usingDummy) return DUMMY_CATEGORIES;
    if (categoriesProp && categoriesProp.length) return categoriesProp;
    return Array.from(
      new Map(
        sourceProducts
          .filter((p) => p.category_id)
          .map((p) => [p.category_id, { category_id: p.category_id, name: p.category_name || p.category_id }])
      ).values()
    );
  }, [usingDummy, categoriesProp, sourceProducts]);

  const localityOptions = useMemo(() => {
    if (businessData?.localities && businessData.localities.length) return businessData.localities;
    const set = new Set();
    sourceProducts.forEach((p) => (p.localities || []).forEach((l) => set.add(l)));
    return Array.from(set);
  }, [businessData, sourceProducts]);

  // Variables canónicas que TODOS los templates escuchan
  const palette = parsePalette(businessData?.themePalette);
  const themeStyles = {
    "--theme-primary": palette.primary,
    "--theme-secondary": palette.secondary,
    "--theme-accent": palette.accent,
    "--theme-background": palette.background,
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sourceProducts.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(term);
      const matchesCat = selectedCategory === "all" || p.category_id === selectedCategory;
      const locs = p.localities || [];
      const matchesLoc = selectedLocality === "all" || locs.length === 0 || locs.includes(selectedLocality);
      return matchesSearch && matchesCat && matchesLoc;
    });
  }, [sourceProducts, searchTerm, selectedCategory, selectedLocality]);

  const SelectedTemplate = Templates[businessData?.templateId] || TemplateDefault;
  const handleProductClick = isPreview ? noop : setSelectedProduct;

  return (
    <div style={{ ...themeStyles, width: "100%", minHeight: "100%" }}>
      {localityOptions.length > 0 && (
        <div style={{
          background: "var(--theme-background, #f7fafc)",
          padding: ".75rem 1rem",
          display: "flex", justifyContent: "center", alignItems: "center", gap: ".6rem",
          borderBottom: "1px solid rgba(0,0,0,.06)",
        }}>
          <span style={{ fontSize: ".9rem", color: "var(--theme-secondary, #2d3e50)", fontWeight: 600 }}>Localidad:</span>
          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            style={{ padding: ".45rem .8rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,.15)", background: "#fff", color: "#1d2939", fontWeight: 600, fontSize: "16px" }}
          >
            <option value="all">Todas</option>
            {localityOptions.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
          </select>
        </div>
      )}

      <SelectedTemplate
        business={businessData}
        products={filteredProducts}
        categories={categories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onProductClick={handleProductClick}
        onShare={noop}
      />

      {!isPreview && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          business={businessData}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default CatalogManager;