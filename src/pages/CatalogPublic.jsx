import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  getBusinessData,
  getCategoriesData,
  getProductsData,
} from "../services/storage";
import HeaderPublic from "../components/HeaderPublic";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import ProductGrid from "../components/ProductGrid";
import ProductModal from "../components/ProductModal";
import "../styles/catalog.css";
import { useDispatch, useSelector } from "react-redux";
import { GetCategoriesByBusinessId } from "../store/categories-store/category-actions";
import { useNotification } from "../components/UI/NotificationProvider";
import { GetProductsByBusinessId } from "../store/product-store/product-actions";
import Loading from "../components/UI/Loading";

const CatalogPublic = () => {
  const { slug } = useParams();
  const business = useSelector((state) => state.business.business);
  const categories = useSelector((state) => state.category.categories);
  const products = useSelector((state) => state.product.products);
  const dispatch = useDispatch();
  const { showError } = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (
      business &&
      business.business_id !== undefined &&
      business.business_id !== null &&
      business.business_id !== ""
    ) {
      setIsLoading(true);
      if (categories.length === 0) {
        dispatch(GetCategoriesByBusinessId(business.business_id, showError));
      }
      if (products.length === 0) {
        dispatch(GetProductsByBusinessId(business.business_id, showError));
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [business, categories, products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          searchTerm === "" ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === "all" ||
          product.category_id === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.order - b.order);
  }, [products, searchTerm, selectedCategory]);

  if (isLoading) {
    return <Loading message="Cargando..." visible={isLoading} />;
  }

  if (!business) {
    return (
      <div className="catalog">
        <div
          className="container"
          style={{ padding: "4rem 1rem", textAlign: "center" }}
        >
          <h1>Catálogo no encontrado</h1>
          <p>El catálogo que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isLoading && (
        <div className="catalog">
          <HeaderPublic />
          <main className="catalog-main">
            <div className="container">
              <div className="catalog-controls">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar productos..."
                />
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>

              <ProductGrid
                products={filteredProducts}
                onProductClick={setSelectedProduct}
              />
            </div>
          </main>

          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              business={business}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default CatalogPublic;
