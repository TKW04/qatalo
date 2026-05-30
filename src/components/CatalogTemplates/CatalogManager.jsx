// src/components/CatalogTemplates/CatalogManager.jsx
import { useState, useMemo } from "react";
import TemplateDefault from "./TemplateDefault";
import TemplateFashion from "./TemplateFashion";
import TemplateTech from "./TemplateTech";
import TemplateCrafts from "./TemplateCrafts";
import TemplateFood from "./TemplateFood";
import TemplateAccessory from "./TemplateAccessory";
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES } from "./previewData";

const Templates = {
  default: TemplateDefault,
  fashion: TemplateFashion,
  tech: TemplateTech,
  crafts: TemplateCrafts,
  food: TemplateFood,
  accessory: TemplateAccessory,
};

const noop = () => { };

const CatalogManager = ({ businessData, products = [], isPreview = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const usingDummy = isPreview && products.length === 0;
  const sourceProducts = usingDummy ? DUMMY_PRODUCTS : products;
  const categories = usingDummy
    ? DUMMY_CATEGORIES
    : Array.from(
      new Map(
        sourceProducts
          .filter((p) => p.category_id)
          .map((p) => [p.category_id, { category_id: p.category_id, name: p.category_name || p.category_id }])
      ).values()
    );

  // 👇 Nombres canónicos que TODOS los templates escuchan
  const palette = businessData?.themePalette || {};
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
      return matchesSearch && matchesCat;
    });
  }, [sourceProducts, searchTerm, selectedCategory]);

  const SelectedTemplate = Templates[businessData?.templateId] || TemplateDefault;

  return (
    <div style={{ ...themeStyles, width: "100%", height: "100%" }}>
      <SelectedTemplate
        business={businessData}
        products={filteredProducts}
        categories={categories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onProductClick={noop}
        onShare={noop}
      />
    </div>
  );
};

export default CatalogManager;