import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getBusinessData,
  setBusinessData,
  getCategoriesData,
  setCategoriesData,
  getProductsData,
  setProductsData,
} from "../../services/storage";
import "../../styles/admin.css";
import QrTab from "../../components/Tabs/QRTab";
import Business from "../../components/Tabs/Business";
import Categories from "../../components/Tabs/Categories";
import Products from "../../components/Tabs/Products";
import { useNotification } from "../../components/UI/NotificationProvider";

const AdminDemoDashboard = () => {
  const { showSuccess } = useNotification();

  const [activeTab, setActiveTab] = useState("business");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Business data
  const [business, setBusiness] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    phone: "",
    description: "",
  });
  const [businessErrors, setBusinessErrors] = useState({});

  // Categories data
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [editingCategory, setEditingCategory] = useState(null);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBusiness(getBusinessData());
    setCategories(getCategoriesData());
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
      setBusinessData(business);
      showSuccess(
        "Negocio actualizado",
        "Configuración guardada correctamente"
      );
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
    if (!newCategory.name.trim()) return;

    const categoryData = {
      ...newCategory,
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      slug: newCategory.slug || generateSlug(newCategory.name),
    };

    let updatedCategories;
    if (editingCategory) {
      updatedCategories = categories.map((cat) =>
        cat.id === editingCategory.id ? categoryData : cat
      );
    } else {
      updatedCategories = [...categories, categoryData];
    }

    setCategories(updatedCategories);
    setCategoriesData(updatedCategories);
    setNewCategory({ name: "", slug: "" });
    setEditingCategory(null);
    showSuccess(editingCategory ? "Categoría actualizada" : "Categoría creada");
  };

  const handleEditCategory = (category) => {
    setNewCategory({ name: category.name, slug: category.slug });
    setEditingCategory(category);
  };

  const handleDeleteCategory = (categoryId) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      const updatedCategories = categories.filter(
        (cat) => cat.id !== categoryId
      );
      setCategories(updatedCategories);
      setCategoriesData(updatedCategories);
      showSuccess("Categoría eliminada");
    }
  };

  // Product functions
  const validateProduct = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "El nombre es requerido";
    if (!data.price || isNaN(data.price) || Number.parseFloat(data.price) < 0) {
      errors.price = "El precio debe ser un número mayor o igual a 0";
    }
    if (!data.categoryId) errors.categoryId = "La categoría es requerida";
    // if (data.imageUrl && !isValidUrl(data.imageUrl)) {
    //   errors.imageUrl = "La URL de la imagen no es válida";
    // }

    return errors;
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const errors = validateProduct(newProduct);
    setProductErrors(errors);

    if (Object.keys(errors).length === 0) {
      const imagesUrl = [];
      console.log(newProduct);

      newProduct.images.forEach((image) => {
        imagesUrl.push(URL.createObjectURL(image));
      });
      const productData = {
        ...newProduct,
        id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
        price: Number.parseFloat(newProduct.price),
        order: Number.parseInt(newProduct.order) || 1,
        imagesUrl: imagesUrl,
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
        imagesUrl: [],
        categoryId: "",
        available: true,
        order: 1,
      });
      setEditingProduct(null);
      setProductErrors({});
      showSuccess(editingProduct ? "Producto actualizado" : "Producto creado");
      setTimeout(() => {
        // window.location.reload();
        setActiveTab("business");
      }, 1000);
    }
  };

  const handleEditProduct = (product) => {
    console.log(product);

    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId,
      available: product.available,
      order: product.order,
    });
    setEditingProduct(product);
  };

  const handleDeleteProduct = (productId) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const updatedProducts = products.filter((prod) => prod.id !== productId);
      setProducts(updatedProducts);
      setProductsData(updatedProducts);
      showSuccess("Producto eliminado");
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
        <Menu />
      </button>

      <AdminSidebar
        isDemo={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="admin-main">
        {activeTab === "business" && (
          <Business
            business={business}
            setBusiness={setBusiness}
            businessErrors={businessErrors}
            handleBusinessSubmit={handleBusinessSubmit}
            isDemo={true}
          />
        )}

        {activeTab === "categories" && (
          <Categories
            categories={categories}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            handleCategorySubmit={handleCategorySubmit}
            handleDeleteCategory={handleDeleteCategory}
            handleEditCategory={handleEditCategory}
            generateSlug={generateSlug}
            isDemo={true}
          />
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
              code: cat.id,
              name: cat.name,
            }))}
            setProductErrors={setProductErrors}
            getCategoryName={getCategoryName}
            isDemo={true}
          />
        )}

        {activeTab === "qr" && <QrTab business={business} isDemo={true} />}
      </main>
    </div>
  );
};

export default AdminDemoDashboard;
