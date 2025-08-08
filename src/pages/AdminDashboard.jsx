import { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import {
  getBusinessData,
  setBusinessData,
  getCategoriesData,
  setCategoriesData,
  getProductsData,
  setProductsData,
} from "../services/storage";
import { showToast } from "../services/shareService";
import "../styles/admin.css";

function AdminDashboard() {
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
      showToast("Configuración guardada correctamente");
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
    showToast(editingCategory ? "Categoría actualizada" : "Categoría creada");
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
      showToast("Categoría eliminada");
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
    if (confirm("¿Estás seguro de eliminar este producto?")) {
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

      <main className="admin-main">
        {activeTab === "business" && (
          <div>
            <div className="admin-header">
              <h1>Configuración del Negocio</h1>
              <p>Configura la información básica de tu negocio</p>
            </div>

            <div className="admin-card">
              <h2>Información General</h2>
              <form onSubmit={handleBusinessSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre del negocio *</label>
                    <input
                      type="text"
                      className={`input ${businessErrors.name ? "error" : ""}`}
                      value={business.name}
                      onChange={(e) =>
                        setBusiness({ ...business, name: e.target.value })
                      }
                      placeholder="Mi Tienda"
                    />
                    {businessErrors.name && (
                      <div className="error-message">{businessErrors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Slug (URL) *</label>
                    <input
                      type="text"
                      className={`input ${businessErrors.slug ? "error" : ""}`}
                      value={business.slug}
                      onChange={(e) =>
                        setBusiness({ ...business, slug: e.target.value })
                      }
                      placeholder="mi-tienda"
                    />
                    {businessErrors.slug && (
                      <div className="error-message">{businessErrors.slug}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Teléfono (WhatsApp) *</label>
                    <input
                      type="tel"
                      className={`input ${businessErrors.phone ? "error" : ""}`}
                      value={business.phone}
                      onChange={(e) =>
                        setBusiness({ ...business, phone: e.target.value })
                      }
                      placeholder="18095551234"
                    />
                    {businessErrors.phone && (
                      <div className="error-message">
                        {businessErrors.phone}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">URL del Logo</label>
                    <input
                      type="url"
                      className={`input ${
                        businessErrors.logoUrl ? "error" : ""
                      }`}
                      value={business.logoUrl}
                      onChange={(e) =>
                        setBusiness({ ...business, logoUrl: e.target.value })
                      }
                      placeholder="https://ejemplo.com/logo.jpg"
                    />
                    {businessErrors.logoUrl && (
                      <div className="error-message">
                        {businessErrors.logoUrl}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input
                    type="text"
                    className="input"
                    value={business.description}
                    onChange={(e) =>
                      setBusiness({ ...business, description: e.target.value })
                    }
                    placeholder="Productos artesanales hechos a mano"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Guardar Configuración
                  </button>
                  <a
                    href={`/catalog/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    Ver Catálogo Público
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <div className="admin-header">
              <h1>Gestión de Categorías</h1>
              <p>Organiza tus productos en categorías</p>
            </div>

            <div className="admin-card">
              <h2>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <form onSubmit={handleCategorySubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="input"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        })
                      }
                      placeholder="Ropa"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Slug</label>
                    <input
                      type="text"
                      className="input"
                      value={newCategory.slug}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, slug: e.target.value })
                      }
                      placeholder="ropa"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? "Actualizar" : "Crear"} Categoría
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setNewCategory({ name: "", slug: "" });
                        setEditingCategory(null);
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-card">
              <h2>Categorías Existentes</h2>
              {categories.length === 0 ? (
                <p>No hay categorías creadas aún.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Slug</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.slug}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-small btn-outline"
                              onClick={() => handleEditCategory(category)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="admin-header">
              <h1>Gestión de Productos</h1>
              <p>Administra tu catálogo de productos</p>
            </div>

            <div className="admin-card">
              <h2>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
              <form onSubmit={handleProductSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className={`input ${productErrors.name ? "error" : ""}`}
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      placeholder="Camisa de lino"
                    />
                    {productErrors.name && (
                      <div className="error-message">{productErrors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`input ${productErrors.price ? "error" : ""}`}
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      placeholder="1850.00"
                    />
                    {productErrors.price && (
                      <div className="error-message">{productErrors.price}</div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input
                    type="text"
                    className="input"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Camisa fresca 100% lino"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">URL de la imagen</label>
                    <input
                      type="url"
                      className={`input ${
                        productErrors.imageUrl ? "error" : ""
                      }`}
                      value={newProduct.imageUrl}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    {productErrors.imageUrl && (
                      <div className="error-message">
                        {productErrors.imageUrl}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select
                      className={`input ${
                        productErrors.categoryId ? "error" : ""
                      }`}
                      value={newProduct.categoryId}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          categoryId: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {productErrors.categoryId && (
                      <div className="error-message">
                        {productErrors.categoryId}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Orden</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={newProduct.order}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, order: e.target.value })
                      }
                      placeholder="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      className="input"
                      value={newProduct.available}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          available: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">Disponible</option>
                      <option value="false">Agotado</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? "Actualizar" : "Crear"} Producto
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
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
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-card">
              <h2>Productos Existentes</h2>
              {products.length === 0 ? (
                <p>No hay productos creados aún.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Orden</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .sort((a, b) => a.order - b.order)
                      .map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>${product.price.toFixed(2)}</td>
                          <td>{getCategoryName(product.categoryId)}</td>
                          <td>
                            <span
                              className={`product-status ${
                                product.available ? "available" : "unavailable"
                              }`}
                            >
                              {product.available ? "Disponible" : "Agotado"}
                            </span>
                          </td>
                          <td>{product.order}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-small btn-outline"
                                onClick={() => handleEditProduct(product)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
}

export default AdminDashboard;
