import { useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { BookImage, PencilIcon, Trash2, Upload } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { productActions } from "../../store/product-store/product-slice";

const Products = ({
  editingProduct,
  setEditingProduct,
  handleProductSubmit,
  handleEditProduct,
  handleDeleteProduct,
  setNewProduct,
  productErrors,
}) => {
  const products = useSelector((state) => state.product.products);
  const product = useSelector((state) => state.product.product);
  const categories = useSelector((state) => state.category.categories);

  const fileUploadRef = useRef(null);
  const dispatch = useDispatch();

  const headerTemplate = (options) => {
    const { className, chooseButton } = options;

    return (
      <div
        className={className}
        style={{
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
        }}
      >
        {chooseButton}
      </div>
    );
  };
  const onTemplateRemove = (file, callback) => {
    callback();
  };

  const itemTemplate = (file, props) => {
    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: "40%" }}>
          <img
            alt={file.name}
            role="presentation"
            src={file.objectURL}
            width={100}
          />
          <span className="flex flex-column text-left ml-3">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <Button
          type="button"
          icon={<Trash2 style={{ color: "red" }} />}
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={() => onTemplateRemove(file, props.onRemove)}
          style={{ border: "none", background: "transparent" }}
        />
      </div>
    );
  };

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column">
        <i
          className="pi pi-image mt-3 p-5"
          style={{
            fontSize: "5em",
            borderRadius: "50%",
            backgroundColor: "var(--surface-b)",
            color: "var(--surface-d)",
          }}
        ></i>
        <span
          style={{ fontSize: "1.2em", color: "var(--text-color-secondary)" }}
          className="my-5"
        >
          Arrastra las imágenes aquí
        </span>
      </div>
    );
  };

  const chooseOptions = {
    icon: <BookImage />,
    iconOnly: true,
    className: "btn_image",
  };

  const [selectedCategory, setSelectedCategory] = useState({
    code: "",
    name: "",
  });
  const [selectedStatus, setSelectedStatus] = useState({
    code: "",
    name: "",
  });
  const statuses = [
    { code: "available", name: "Disponible" },
    { code: "unavailable", name: "Agotado" },
  ];
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const currencies = [
    { code: "USD", name: "Dólar estadounidense", symbol: "$" },
    { code: "DOP", name: "Peso dominicano", symbol: "RD$" },
  ];
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Sin categoría";
  };
  const isMobile = window.innerWidth <= 480;
  const onSubmit = (e) => {
    e.preventDefault();
    handleProductSubmit(e);
    setSelectedCategory({
      code: "",
      name: "",
    });
    setSelectedStatus({
      code: "",
      name: "",
    });
    setSelectedCurrency({
      code: "",
      name: "",
      symbol: "",
    });
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Gestión de Productos</h1>
        <p>Administra tu catálogo de productos</p>
      </div>

      <div className="admin-card">
        <h2>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <InputText
              type="text"
              className={`input ${productErrors.name ? "error" : ""}`}
              value={product.name}
              onChange={(e) => {
                dispatch(
                  productActions.modifyPropertyValue({
                    id: "name",
                    value: e.target.value,
                  })
                );
              }}
              placeholder="Camisa de lino"
            />
            {productErrors.name && (
              <div className="error-message">{productErrors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <InputText
              type="text"
              className="input"
              value={product.description}
              onChange={(e) => {
                dispatch(
                  productActions.modifyPropertyValue({
                    id: "description",
                    value: e.target.value,
                  })
                );
              }}
              placeholder="Camisa fresca 100% lino"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Moneda*</label>
              <Dropdown
                value={selectedCurrency}
                className={`input ${productErrors.currency ? "error" : ""}`}
                onChange={(e) => {
                  setSelectedCurrency(e.value);
                  dispatch(
                    productActions.modifyPropertyValue({
                      id: "currency",
                      value: e.value.symbol,
                    })
                  );
                }}
                options={currencies}
                optionLabel="name"
                placeholder="Seleccionar moneda"
              />
              {productErrors.currency && (
                <div className="error-message">{productErrors.currency}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Precio * {selectedCurrency?.symbol || ""}
              </label>
              <InputText
                className={`input ${productErrors.price ? "error" : ""}`}
                value={product.price}
                onChange={(e) => {
                  if (!isNaN(e.target.value)) {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "price",
                        value: e.target.value,
                      })
                    );
                  }
                }}
                placeholder="1850.00"
              />
              {productErrors.price && (
                <div className="error-message">{productErrors.price}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Seleccionar imágenes</label>
              <div>
                <FileUpload
                  ref={fileUploadRef}
                  name="demo[]"
                  url="/api/upload"
                  multiple
                  accept="image/*"
                  maxFileSize={import.meta.env.VITE_MAX_IMAGE_SIZE || 1000000}
                  headerTemplate={headerTemplate}
                  itemTemplate={itemTemplate}
                  emptyTemplate={emptyTemplate}
                  chooseOptions={chooseOptions}
                  onSelect={(e) => {
                    const files = Array.from(e.files);
                    if (
                      files.length >= 1 &&
                      files.length <= import.meta.env.VITE_APP_MAX_FILE_QUANTITY
                    ) {
                      files.forEach((file, index) => {
                        dispatch(
                          productActions.modifyPropertyValue({
                            id: `image${index + 1}`,
                            value: file,
                          })
                        );
                      });
                    } else {
                      fileUploadRef.current.clear();
                      alert(
                        `Debes seleccionar entre 1 y ${
                          import.meta.env.VITE_APP_MAX_FILE_QUANTITY
                        } imágenes.`
                      );
                    }
                  }}
                  style={{
                    border: "1px dashed #ccc",
                    padding: "10px",
                    textAlign: "center",
                  }}
                />
              </div>
              {productErrors.imageUrl && (
                <div className="error-message">{productErrors.imageUrl}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <Dropdown
                value={selectedCategory}
                className={`input ${productErrors.category_id ? "error" : ""}`}
                onChange={(e) => {
                  setSelectedCategory(e.value);
                  dispatch(
                    productActions.modifyPropertyValue({
                      id: "category_id",
                      value: e.value.code,
                    })
                  );
                }}
                options={categories}
                optionLabel="name"
                placeholder="Seleccionar categoría"
              />
              {productErrors.category_id && (
                <div className="error-message">{productErrors.category_id}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Orden</label>
              <InputText
                className="input"
                value={product.order}
                onChange={(e) => {
                  if (!isNaN(e.target.value) && !e.target.value.includes(".")) {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "order",
                        value: e.target.value,
                      })
                    );
                  }
                }}
                placeholder="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado</label>
              <Dropdown
                value={selectedStatus}
                className={`input ${productErrors.available ? "error" : ""}`}
                onChange={(e) => {
                  dispatch(
                    productActions.modifyPropertyValue({
                      id: "available",
                      value: e.value.code,
                    })
                  );
                }}
                options={statuses}
                optionLabel="name"
                placeholder="Seleccionar estado"
              />
            </div>
          </div>

          <div className="form-actions">
            <Button type="submit" className="btn btn-primary">
              {editingProduct ? "Actualizar" : "Crear"} Producto
            </Button>
            {editingProduct && (
              <Button
                type="button"
                label="Cancelar Edición"
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
                  setSelectedCategory({
                    code: "",
                    name: "",
                  });
                  setSelectedStatus({
                    code: "",
                    name: "",
                  });
                  setSelectedCurrency({
                    code: "",
                    name: "",
                    symbol: "",
                  });
                }}
              />
            )}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>Productos Existentes</h2>
        {products.length === 0 ? (
          <p>No hay productos creados aún.</p>
        ) : (
          <>
            {!isMobile && (
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
                        <td>
                          {" "}
                          {product.currency}
                          {product.price.toFixed(2)}
                        </td>
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
            {isMobile &&
              products
                .sort((a, b) => a.order - b.order)
                .map((product) => (
                  <Card
                    key={product.id}
                    style={{
                      marginBottom: "1rem",
                      padding: "1rem",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <p style={{ marginBottom: "0.5rem", fontSize: "18px" }}>
                      <strong style={{ marginRight: "0.5rem" }}>
                        Producto:
                      </strong>{" "}
                      {product.name}
                    </p>
                    <p style={{ marginBottom: "0.5rem", fontSize: "18px" }}>
                      <strong style={{ marginRight: "0.5rem" }}>Precio:</strong>{" "}
                      {product.currency}
                      {product.price.toFixed(2)}
                    </p>
                    <p style={{ marginBottom: "0.5rem", fontSize: "18px" }}>
                      <strong style={{ marginRight: "0.5rem" }}>
                        Categoría:
                      </strong>{" "}
                      {getCategoryName(product.categoryId)}
                    </p>
                    <p>
                      <strong
                        style={{ marginRight: "0.5rem", fontSize: "18px" }}
                      >
                        Estado:
                      </strong>{" "}
                      <span
                        className={`product-status ${
                          product.available ? "available" : "unavailable"
                        }`}
                      >
                        {product.available ? "Disponible" : "Agotado"}
                      </span>
                    </p>
                    <p
                      style={{
                        marginRight: "0.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "18px",
                      }}
                    >
                      Orden: {product.order}
                    </p>
                    <div className="table-actions">
                      <Button
                        icon={<PencilIcon />}
                        label={isMobile ? "" : "Editar"}
                        tooltip="Editar producto"
                        className="btn btn-small btn-outline"
                        onClick={() => {
                          handleEditProduct(product);
                        }}
                      />
                      <Button
                        icon={<Trash2 />}
                        label={isMobile ? "" : "Eliminar"}
                        tooltip="Eliminar producto"
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteProduct(product.id)}
                      />
                    </div>
                  </Card>
                ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
