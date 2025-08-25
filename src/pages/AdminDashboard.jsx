import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Dialog } from "primereact/dialog";

import AdminSidebar from "../components/AdminSidebar";
import { getProductsData, setProductsData } from "../services/storage";
import { showToast } from "../services/shareService";

import { useNotification } from "../components/UI/NotificationProvider";
import Business from "../components/Tabs/Business";
import {
  CreateBusiness,
  GetBusiness,
  UpdateBusiness,
} from "../store/business-store/business-actions";
import Loading from "../components/UI/Loading";

import { getTokenInfo } from "../helpers/token";
import Categories from "../components/Tabs/Categories";
import {
  CreateCategory,
  DeleteCategory,
  GetCategories,
  UpdateCategory,
} from "../store/categories-store/category-actions";

import { categoryActions } from "../store/categories-store/category-slice";
import "../styles/admin.css";
import { Button } from "primereact/button";
import Products from "../components/Tabs/Products";

let business_once = true;
let categories_once = true;
const AdminDashboard = () => {
  const auth = getTokenInfo();
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");

  const [activeTab, setActiveTab] = useState("business");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Business data
  const business = useSelector((state) => state.business.business);
  const [businessErrors, setBusinessErrors] = useState({});

  // Categories data
  const categories = useSelector((state) => state.category.categories);
  const category = useSelector((state) => state.category.category);
  const [editingCategory, setEditingCategory] = useState(false);

  // Products data
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    categoryId: "",
    available: true,
    order: 1,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productErrors, setProductErrors] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (business_once && business.business_id === "") {
      business_once = false;
      setIsLoading(true);
      dispatch(GetBusiness(auth.sub, showError));
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [
    auth.sub,
    business.business_id,
    dispatch,
    showError,
    showSuccess,
    showWarning,
  ]);

  useEffect(() => {
    if (categories_once && categories.length === 0) {
      categories_once = false;
      setIsLoading(true);
      dispatch(GetCategories(showError));
      dispatch(categoryActions.startCategory());
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [categories.length, dispatch, showError, showSuccess, showWarning]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProductsData());
  };

  // Business functions
  const validateBusiness = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "El nombre es requerido";
    if (!data.slug.trim()) errors.slug = "El slug es requerido";
    else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.slug =
        "El slug solo puede contener letras minúsculas, números y guiones";
    }
    if (!data.phone.trim()) errors.phone = "El teléfono es requerido";
    if (data.logoUrl && !isValidUrl(data.logoUrl)) {
      errors.logoUrl = "La URL del logo no es válida";
    }

    return errors;
  };

  const handleBusinessSubmit = (e) => {
    e.preventDefault();
    const errors = validateBusiness(business);
    setBusinessErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      if (business.business_id === "") {
        setLoadingMessage("Creando negocio...");
        dispatch(CreateBusiness(business, showError, showWarning, showSuccess));
      } else {
        setLoadingMessage("Actualizando negocio...");
        dispatch(UpdateBusiness(business, showError, showWarning, showSuccess));
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 4500);
    }
  };

  // Category functions
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (category.category_id) {
      setLoadingMessage("Actualizando categoría...");
      dispatch(UpdateCategory(category, showError, showWarning, showSuccess));
    } else {
      setLoadingMessage("Creando categoría...");
      dispatch(CreateCategory(category, showError, showWarning, showSuccess));
    }
    setTimeout(() => {
      setActiveTab("categories");
      dispatch(GetCategories(showError));
      dispatch(categoryActions.startCategory());
      setIsLoading(false);
    }, 1500);
  };

  const handleEditCategory = (category) => {
    dispatch(categoryActions.setCategory({ category: category }));
    setEditingCategory(true);
  };

  const handleDeleteCategory = (showDialog, category) => {
    setShowDeleteDialog(showDialog);
    dispatch(categoryActions.setCategory({ category: category }));
  };

  const footerContent = (
    <div>
      <Button
        className="btn btn-secondary"
        label="No"
        icon="pi pi-times"
        onClick={() => setShowDeleteDialog(false)}
        style={{ width: "100px", margin: "2px" }}
      />
      <Button
        className="btn btn-danger"
        label="Yes"
        icon="pi pi-check"
        onClick={() => {
          setIsLoading(true);
          setLoadingMessage("Eliminando categoría...");
          dispatch(
            DeleteCategory(
              category.category_id,
              showError,
              showWarning,
              showSuccess
            )
          );

          setTimeout(() => {
            setActiveTab("categories");
            dispatch(GetCategories(showError));
            dispatch(categoryActions.startCategory());
            setIsLoading(false);
            setShowDeleteDialog(false);
          }, 1500);
        }}
        style={{ width: "100px", margin: "2px" }}
      />
    </div>
  );

  // Product functions
  const validateProduct = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "El nombre es requerido";
    if (!data.price || isNaN(data.price) || Number.parseFloat(data.price) < 0) {
      errors.price = "El precio debe ser un número mayor o igual a 0";
    }
    if (!data.categoryId) errors.categoryId = "La categoría es requerida";
    if (data.imageUrl && !isValidUrl(data.imageUrl)) {
      errors.imageUrl = "La URL de la imagen no es válida";
    }

    return errors;
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const errors = validateProduct(newProduct);
    setProductErrors(errors);

    if (Object.keys(errors).length === 0) {
      const productData = {
        ...newProduct,
        id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
        price: Number.parseFloat(newProduct.price),
        order: Number.parseInt(newProduct.order) || 1,
      };

      let updatedProducts;
      if (editingProduct) {
        updatedProducts = products.map((prod) =>
          prod.id === editingProduct.id ? productData : prod
        );
      } else {
        updatedProducts = [...products, productData];
      }

      setProducts(updatedProducts);
      setProductsData(updatedProducts);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        categoryId: "",
        available: true,
        order: 1,
      });
      setEditingProduct(null);
      setProductErrors({});
      showToast(editingProduct ? "Producto actualizado" : "Producto creado");
    }
  };

  const handleEditProduct = (product) => {
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      available: product.available,
      order: product.order,
    });
    setEditingProduct(product);
  };

  const handleDeleteProduct = (productId) => {
    if (confirm()) {
      const updatedProducts = products.filter((prod) => prod.id !== productId);
      setProducts(updatedProducts);
      setProductsData(updatedProducts);
      showToast("Producto eliminado");
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (error) {
      console.log(error);

      return false;
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Sin categoría";
  };

  return (
    <div className="admin-layout">
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Dialog
        header="Eliminar categoría"
        visible={showDeleteDialog}
        position={"center"}
        style={{ width: "50vw" }}
        onHide={() => {
          if (!showDeleteDialog) return;
          setShowDeleteDialog(false);
        }}
        footer={footerContent}
        draggable={false}
        resizable={false}
      >
        <p className="dialog">¿Estás seguro de eliminar esta Categoría?</p>
      </Dialog>
      <main className="admin-main">
        <Loading message={loadingMessage} visible={isLoading} />
        {activeTab === "business" && (
          <>
            {/* <Loading message="Guardando..." visible={isLoading} /> */}
            {!isLoading && (
              <Business
                business={business}
                businessErrors={businessErrors}
                handleBusinessSubmit={handleBusinessSubmit}
                isDemo={false}
                isLoading={isLoading}
              />
            )}
          </>
        )}

        {activeTab === "categories" && (
          <>
            {!isLoading && (
              <Categories
                categories={categories}
                editingCategory={editingCategory}
                newCategory={category}
                handleCategorySubmit={handleCategorySubmit}
                handleDeleteCategory={handleDeleteCategory}
                handleEditCategory={handleEditCategory}
                generateSlug={generateSlug}
                isDemo={false}
              />
            )}
          </>
        )}

        {activeTab === "products" && (
         <Products
            products={products}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            handleProductSubmit={handleProductSubmit}
            handleEditProduct={handleEditProduct}
            handleDeleteProduct={handleDeleteProduct}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            productErrors={productErrors}
            categories={categories.map((cat) => ({
              code: cat.category_id,
              name: cat.name,
            }))}
            setProductErrors={setProductErrors}
            getCategoryName={getCategoryName}
          />
        )}

        {activeTab === "qr" && (
          <div>
            <div className="admin-header">
              <h1>Código QR</h1>
              <p>Genera y descarga el código QR de tu catálogo</p>
            </div>

            <div className="admin-card">
              <div style={{ textAlign: "center" }}>
                <p style={{ marginBottom: "2rem", color: "#666" }}>
                  Comparte este código QR para que tus clientes accedan a tu
                  catálogo
                </p>
                <div className="form-actions">
                  <a
                    href="/admin/qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Ver QR del Catálogo
                  </a>
                  <a
                    href={`/catalog/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    Ver Catálogo Público
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
