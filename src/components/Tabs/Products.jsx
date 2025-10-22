import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputSwitch } from "primereact/inputswitch";

import { BookImage, Trash2, X } from "lucide-react";

import { productActions } from "../../store/product-store/product-slice";
import { GetCategories } from "../../store/categories-store/category-actions";
import { useNotification } from "../UI/NotificationProvider";
import {
  CreateProduct,
  DeleteImage,
  DeleteProduct,
  GetProducts,
  UpdateProduct,
} from "../../store/product-store/product-actions";
import Loading from "../UI/Loading";

import { Image } from "primereact/image";
import DialogModal from "../DialogModal";
import "../../styles/catalog.css";
import { DeleteButton, EditButton, InfoButton } from "../Buttons";
import {
  currencies,
  formatDate,
  formatted,
  getAges,
} from "../../helpers/utils";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";

let once = true;
const Products = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.product.products);
  const product = useSelector((state) => state.product.product);
  const categories = useSelector((state) => state.category.categories);
  const business = useSelector((state) => state.business.business);
  const { showError, showWarning, showSuccess } = useNotification();

  const fileUploadRef = useRef(null);

  const [editingProduct, setEditingProduct] = useState(false);
  const [productErrors, setProductErrors] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState({
    code: "",
    name: "",
  });
  const [selectedStatus, setSelectedStatus] = useState({
    code: "",
    name: "",
  });

  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const [selectedMinAge, setSelectedMinAge] = useState({ code: 0, name: 0 });

  const [expandedRows, setExpandedRows] = useState(null);

  const statuses = useMemo(
    () => [
      { code: "available", name: "Disponible" },
      { code: "unavailable", name: "Agotado" },
    ],
    []
  );

  const getCategoryName = useMemo(
    () => (category_id) => {
      const category = categories.find(
        (cat) => cat.category_id === category_id
      );
      return category ? category.name : "Sin categoría";
    },
    [categories]
  );

  useEffect(() => {
    if (categories.length === 0 && once) {
      dispatch(GetCategories(showError));
    }
  }, [categories, dispatch, showError]);

  useEffect(() => {
    if (products && products.length === 0 && once) {
      dispatch(GetProducts(showError));
      dispatch(productActions.startProduct());
      setIsLoading(true);
      setLoadingMessage("Cargando productos...");
      once = false;
      setTimeout(() => {
        setIsLoading(false);
      }, 4500);
    }
  }, [dispatch, products, showError]);

  useEffect(() => {
    if (
      product &&
      product.product_id &&
      selectedCategory.code === "" &&
      editingProduct === true
    ) {
      setSelectedCategory({
        code: product.category_id,
        name: getCategoryName(product.category_id),
      });
    }
  }, [editingProduct, getCategoryName, product, selectedCategory]);

  useEffect(() => {
    if (
      product &&
      product.product_id &&
      selectedStatus.code === "" &&
      editingProduct === true
    ) {
      let status = statuses.find(
        (status) => status.code === product.is_available
      );
      setSelectedStatus(status || { code: "", name: "" });
    }
    if (
      product &&
      product.product_id &&
      selectedCurrency.code === "" &&
      editingProduct === true
    ) {
      let currency = currencies.find((cur) => cur.symbol === product.currency);
      setSelectedCurrency(currency || { code: "", name: "", symbol: "" });
    }
  }, [
    editingProduct,
    product,
    selectedCurrency.code,
    selectedStatus.code,
    statuses,
  ]);
  useEffect(() => {
    if (
      product &&
      product.product_id &&
      selectedMinAge.code === 0 &&
      editingProduct === true
    ) {
      setSelectedMinAge({
        code: product.min_age,
        name: product.min_age,
      });
    }
  }, [
    editingProduct,
    getCategoryName,
    product,
    selectedCategory,
    selectedMinAge.code,
  ]);


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

  const validateProduct = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "El nombre es requerido";
    if (!data.price || isNaN(data.price) || Number.parseFloat(data.price) < 0) {
      errors.price = "El precio debe ser un número mayor o igual a 0";
    }

    if (!data.category_id) errors.category_id = "La categoría es requerida";
    if (!data.currency) errors.currency = "La moneda es requerida";
    if (!data.is_available || data.is_available === "")
      errors.available = "El estado es requerido";
    if (!data.orden || isNaN(data.orden) || Number.parseInt(data.orden) < 0) {
      errors.orden = "El orden debe ser un número mayor o igual a 0";
    }

    if (
      !editingProduct &&
      (data.image1 === undefined || data.image1 === null)
    ) {
      errors.imageUrl = "Debe seleccionar al menos 1 imagen";
    }
    if (editingProduct) {
      let count = 0;
      if (data.image1) count++;
      if (data.image2) count++;
      if (data.image3) count++;
      if (data.image4) count++;
      if (data.image5) count++;
      count += data.imagesUrl.length;
      if (count > 5) {
        errors.imageUrl = "Debe seleccionar un máximo de 5 imágenes";
      }
    }

    return errors;
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const errors = validateProduct(product);
    setProductErrors(errors);

    if (Object.keys(errors).length === 0) {
      const modifiedProduct = { ...product };
      if (product.is_available === "unavailable" && product.quantity < 1) {
        modifiedProduct.quantity = 0;
      }
      if (product.quantity < 1) {
        modifiedProduct.is_available = "unavailable";
      }
      if (
        modifiedProduct.quantity > 0 &&
        product.is_available === "unavailable"
      ) {
        modifiedProduct.is_available = "available";
      }

      if (modifiedProduct.product_id) {

        setIsLoading(true);
        setLoadingMessage("Actualizando producto...");

        dispatch(
          UpdateProduct(
            modifiedProduct,
            business,
            showError,
            showWarning,
            showSuccess
          )
        );
      } else {
        setIsLoading(true);
        setLoadingMessage("Creando producto...");
        dispatch(
          CreateProduct(
            modifiedProduct,
            business,
            showError,
            showWarning,
            showSuccess
          )
        );
      }
      setTimeout(() => {
        setActiveTab("products");

        dispatch(productActions.startProduct());
        dispatch(GetProducts(showError));
        fileUploadRef.current.clear();
        setSelectedCurrency({
          code: "",
          name: "",
          symbol: "",
        });
        setIsLoading(false);
        setEditingProduct(false);
      }, 4500);
    }
  };

  const handleEditProduct = (product) => {
    dispatch(productActions.setProduct({ product: product }));
    setEditingProduct(true);
    setSelectedCategory({
      code: product.category_id,
      name: getCategoryName(product.category_id),
    });
    let status = statuses.find(
      (status) => status.code === product.is_available
    );

    setSelectedStatus(status || { code: "", name: "" });
    let currency = currencies.find((cur) => cur.symbol === product.currency);
    setSelectedCurrency(currency || { code: "", name: "", symbol: "" });
    fileUploadRef.current.clear();
  };

  const handleDeleteProduct = (rowData) => {
    const children = (
      <div
        style={{
          textAlign: "left",
          padding: "30px",
          overflowX: "hidden",
          maxWidth: "800px",
        }}
      >
        <div style={{ color: "white", fontSize: "20px", textAlign: "center" }}>
          ¿Estás seguro de que deseas eliminar este producto?
        </div>
        <div className="flex justify-content-end mt-3">
          <Button
            className="btn btn-outline"
            label="No"
            onClick={() => setShowDialog(false)}
            style={{ width: "100px", margin: "2px" }}
          />
          <Button
            className="btn btn-primary"
            label="Si"
            style={{ width: "100px", margin: "2px" }}
            onClick={() => {
              setIsLoading(true);
              setLoadingMessage("Eliminando producto...");
              dispatch(
                DeleteProduct(
                  rowData.product_id,
                  showError,
                  showWarning,
                  showSuccess
                )
              );
              setTimeout(() => {
                setActiveTab("products");
                dispatch(GetProducts(showError));
                dispatch(productActions.startProduct());
                fileUploadRef.current.clear();
                setSelectedCurrency({
                  code: "DOP",
                  name: "Peso dominicano",
                  symbol: "RD$",
                });
                setIsLoading(false);
                setShowDialog(false);
                setEditingProduct(false);
              }, 4500);
            }}
          />
        </div>
      </div>
    );
    setDialogContent({ title: "Eliminar Producto", children });
    setShowDialog(true);
  };

  const handleViewProduct = (productInfo) => {
    let available = productInfo.is_available === "available" ? true : false;

    const children = (
      <div
        style={{
          textAlign: "left",
          padding: "30px",
          overflowX: "hidden",
          maxWidth: "800px",
        }}
      >
        <div className="grid flex gap-2">
          <div className="col-12">
            <label className="form-label">
              Nombre:{" "}
              <span style={{ fontWeight: "bold" }}>{productInfo.name}</span>
            </label>
          </div>
          <div className="col-12">
            <label className="form-label">
              Descripción:{" "}
              <span style={{ fontWeight: "bold" }}>
                {productInfo.description}
              </span>
            </label>
          </div>
          <div className="col-3">
            <label className="form-label">Solo uno</label>
            <InputSwitch
              checked={productInfo.just_one}
              disabled
              onChange={(e) => {
                dispatch(
                  productActions.modifyPropertyValue({
                    id: "just_one",
                    value: e.value,
                  })
                );
              }}
            />
          </div>
          <div className="col-3">
            <label className="form-label">Mostrar cantidad</label>
            <InputSwitch
              checked={productInfo.show_quantity}
              disabled
              onChange={(e) => {
                dispatch(
                  productActions.modifyPropertyValue({
                    id: "show_quantity",
                    value: e.value,
                  })
                );
              }}
            />
          </div>
          <div className="col-3">
            <label className="form-label">Edad mínima</label>
            <InputSwitch
              checked={productInfo.min_age_allow}
              disabled
              onChange={(e) => {
                dispatch(
                  productActions.modifyPropertyValue({
                    id: "min_age_allow",
                    value: e.value,
                  })
                );
              }}
            />
          </div>
          {productInfo.min_age_allow && (
            <div className="col-2">
              <label className="form-label">
                <span style={{ fontWeight: "bold" }}>
                  {productInfo.min_age} años
                </span>
              </label>
            </div>
          )}
          <div className="col-3">
            <label className="form-label">Requiere Fecha de entrega</label>
            <InputSwitch
              checked={productInfo.required_delivery_day}
              disabled
              onChange={(e) => {
                dispatch(
                  productActions.modifyPropertyValue({
                    id: "required_delivery_day",
                    value: e.value,
                  })
                );
              }}
            />
          </div>
          {productInfo.required_delivery_day && (
            <div className="col-2">
              <label className="form-label">Fecha de entrega mínima</label>
              <label className="form-label">
                <span style={{ fontWeight: "bold" }}>
                  {formatDate(productInfo.delivery_start_day)}
                </span>
              </label>
            </div>
          )}
          <div className="col-4">
            <label className="form-label">
              Precio:{" "}
              <span style={{ fontWeight: "bold" }}>
                {" "}
                {productInfo.currency}
                {formatted(productInfo.price)}
              </span>
            </label>
          </div>
          <div className="col">
            <label className="form-label">
              Categoría:{" "}
              <span style={{ fontWeight: "bold" }}>
                {getCategoryName(productInfo.category_id)}
              </span>
            </label>
          </div>
          <div className="col">
            <label className="form-label">
              Orden:{" "}
              <span style={{ fontWeight: "bold" }}>{productInfo.orden}</span>
            </label>
          </div>
          <div className="col">
            <label className="form-label">
              Cantidad:{" "}
              <span style={{ fontWeight: "bold" }}>{productInfo.quantity}</span>
            </label>
          </div>

          <div className="col">
            <label className="form-label">
              Estado:{" "}
              <span
                className={`product-status  product-status_${
                  available ? "available" : "unavailable"
                }`}
              >
                {" "}
                {available ? "Disponible" : "Agotado"}
              </span>
            </label>
          </div>
          <div className="col">
            <label className="form-label">
              Moneda:{" "}
              <span style={{ fontWeight: "bold" }}>{productInfo.currency}</span>
            </label>
          </div>
          <div className="col-12">
            <label className="form-label">
              Términos y condiciones:{" "}
              <p style={{ fontWeight: "bold", color: "white" }}>
                {productInfo.terms ? productInfo.terms : "N/A"}
              </p>
            </label>
          </div>
        </div>
      </div>
    );
    setDialogContent({ title: "Detalles del Producto", children });
    setShowDialog(true);
  };

  const isMobile = window.innerWidth <= 760;

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

  const rowExpansionTemplate = (data) => {
    return (
      <div>
        <DataTable
          value={data.imagesUrl}
          dataKey={data.image}
          showGridlines
          stripedRows
        >
          <Column
            header="Imagenes"
            style={{ minWidth: "15rem", padding: "1rem" }}
            body={(rowData) => {
              return (
                <Image
                  src={rowData.image}
                  alt="Image"
                  width="100"
                  height="100"
                  preview
                />
              );
            }}
          ></Column>

          <Column
            header="Acciones"
            style={{ minWidth: "5rem", padding: "1rem" }}
            body={(rowData) => {
              return (
                <div className="flex justify-content-center">
                  <DeleteButton
                    onClick={() => {
                      const children = (
                        <div
                          style={{
                            textAlign: "left",
                            padding: "5px",
                            overflowX: "hidden",
                            maxWidth: "800px",
                          }}
                        >
                          <div
                            style={{
                              color: "white",
                              fontSize: "20px",
                              textAlign: "center",
                            }}
                          >
                            ¿Estás seguro de que deseas eliminar esta imagen?
                          </div>
                          <div className="flex justify-content-end">
                            <Button
                              className="btn btn-outline"
                              label="No"
                              onClick={() => setShowDialog(false)}
                              style={{ width: "100px", margin: "2px" }}
                            />
                            <Button
                              className="btn btn-primary"
                              label="Si"
                              style={{
                                width: "100px",
                                margin: "2px",
                                border: "none",
                              }}
                              onClick={() => {
                                setIsLoading(true);
                                setLoadingMessage("Eliminando imagen...");
                                dispatch(
                                  DeleteImage(
                                    data.product_id,
                                    rowData.image,
                                    showError,
                                    showWarning,
                                    showSuccess
                                  )
                                );
                                setTimeout(() => {
                                  setActiveTab("products");
                                  dispatch(GetProducts(showError));
                                  dispatch(productActions.startProduct());
                                  fileUploadRef.current.clear();
                                  setSelectedCurrency({
                                    code: "DOP",
                                    name: "Peso dominicano",
                                    symbol: "RD$",
                                  });
                                  setIsLoading(false);
                                  setShowDialog(false);
                                  setEditingProduct(false);
                                }, 4500);
                              }}
                            />
                          </div>
                        </div>
                      );
                      setDialogContent({ title: "Eliminar Imagen", children });
                      setShowDialog(true);
                    }}
                  />
                </div>
              );
            }}
          ></Column>
        </DataTable>
      </div>
    );
  };
  const setDefaultDate = (dateString) => {
    if (dateString) {
      const date = dateString.split("/");
      return new Date(date[2], date[1] - 1, date[0]);
    }

    return null;
  };

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
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
                <InputNumber
                  value={product.price}
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "price",
                        value: e.value,
                      })
                    );
                  }}
                  min={1}
                  minFractionDigits={2}
                  maxFractionDigits={2}
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
                        files.length <=
                          import.meta.env.VITE_APP_MAX_FILE_QUANTITY
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

                  {productErrors.imageUrl && (
                    <div className="error-message">
                      {productErrors.imageUrl}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <Dropdown
                  value={selectedCategory}
                  className={`input ${
                    productErrors.category_id ? "error" : ""
                  }`}
                  onChange={(e) => {
                    setSelectedCategory(e.value);
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "category_id",
                        value: e.value.code,
                      })
                    );
                  }}
                  options={categories.map((cat) => ({
                    code: cat.category_id,
                    name: cat.name,
                  }))}
                  optionLabel="name"
                  placeholder="Seleccionar categoría"
                />
                {productErrors.category_id && (
                  <div className="error-message">
                    {productErrors.category_id}
                  </div>
                )}
                <label className="form-label">Estado</label>
                <Dropdown
                  value={selectedStatus}
                  className={`input ${productErrors.available ? "error" : ""}`}
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "is_available",
                        value: e.value.code,
                      })
                    );
                    setSelectedStatus(e.value);
                  }}
                  options={statuses}
                  optionLabel="name"
                  placeholder="Seleccionar estado"
                />
                {productErrors.available && (
                  <div className="error-message">{productErrors.available}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Orden</label>
                <InputNumber
                  className="input"
                  value={product.orden}
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "orden",
                        value: e.value,
                      })
                    );
                  }}
                  min={0}
                />
                {productErrors.orden && (
                  <div className="error-message">{productErrors.orden}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <InputNumber
                  className="input"
                  value={product.quantity}
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "quantity",
                        value: e.value,
                      })
                    );
                  }}
                  min={0}
                />
                {productErrors.quantity && (
                  <div className="error-message">{productErrors.quantity}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mostrar cantidad</label>
                <InputSwitch
                  checked={
                    product.show_quantity === "true" ||
                    product.show_quantity === true
                      ? true
                      : false
                  }
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "show_quantity",
                        value: e.value,
                      })
                    );
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Solo uno</label>
                <InputSwitch
                  checked={
                    product.just_one === "true" || product.just_one === true
                      ? true
                      : false
                  }
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "just_one",
                        value: e.value,
                      })
                    );
                  }}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Edad mínima</label>
                <InputSwitch
                  checked={
                    product.min_age_allow === "true" ||
                    product.min_age_allow === true
                      ? true
                      : false
                  }
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "min_age_allow",
                        value: e.value,
                      })
                    );
                  }}
                />
              </div>
              {product.min_age_allow && (
                <div className="form-group">
                  <label className="form-label">Edad</label>
                  <Dropdown
                    value={selectedMinAge}
                    className="input"
                    onChange={(e) => {
                      setSelectedMinAge(e.value);
                      dispatch(
                        productActions.modifyPropertyValue({
                          id: "min_age",
                          value: e.value.code,
                        })
                      );
                    }}
                    options={getAges()}
                    optionLabel="name"
                    placeholder="Seleccionar edad mínima"
                  />
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Requiere Fecha de entrega</label>
                <InputSwitch
                  checked={
                    product.required_delivery_day === "true" ||
                    product.required_delivery_day === true
                      ? true
                      : false
                  }
                  onChange={(e) => {
                    dispatch(
                      productActions.modifyPropertyValue({
                        id: "required_delivery_day",
                        value: e.value,
                      })
                    );
                  }}
                />
              </div>
              {product.required_delivery_day && (
                <div className="form-group">
                  <label className="form-label">A partir de</label>
                  <Calendar
                    value={setDefaultDate(product.delivery_start_day)}
                    dateFormat="mm/dd/yy"
                    onChange={(e) => {
                      dispatch(
                        productActions.modifyPropertyValue({
                          id: "delivery_start_day",
                          value: formatDate(e.value),
                        })
                      );
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="form-label">
                Términos y condiciones (optional)
              </label>
              <InputTextarea
                value={product.terms}
                onChange={(e) => {
                  dispatch(
                    productActions.modifyPropertyValue({
                      id: "terms",
                      value: e.target.value,
                    })
                  );
                }}
                rows={5}
                cols={30}
                className="input"
                placeholder="Escribe los términos y condiciones del producto"
                autoResize
              />
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
                    dispatch(productActions.startProduct());
                    setProductErrors({});
                    setSelectedCategory({ code: "", name: "" });
                    setSelectedStatus({ code: "", name: "" });
                    setSelectedCurrency({ code: "", name: "", symbol: "" });
                    setEditingProduct(false);
                    fileUploadRef.current.clear();
                  }}
                />
              )}
            </div>
          </form>
        </div>

        <div>
          <h2>Productos Existentes</h2>
          <>
            <DialogModal
              title={dialogContent?.title || "Confirmación"}
              visible={showDialog}
              onHide={() => setShowDialog(false)}
            >
              <p>
                {dialogContent?.children ||
                  "¿Estás seguro de que deseas eliminar este producto?"}
              </p>
            </DialogModal>
            {!isMobile && (
              <div>
                <DataTable
                  value={products}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="product_id"
                  showGridlines
                  stripedRows
                >
                  <Column
                    field="name"
                    header="Nombre"
                    style={{ minWidth: "15rem", padding: "1rem" }}
                  ></Column>
                  <Column
                    header="Precio"
                    style={{ minWidth: "10rem", padding: "1rem" }}
                    body={(rowData) => {
                      return (
                        <>
                          {rowData.currency}
                          {formatted(rowData.price)}
                        </>
                      );
                    }}
                  ></Column>
                  <Column
                    header="Estado"
                    style={{ minWidth: "5rem", padding: "1rem" }}
                    body={(rowData) => {
                      let available =
                        rowData.is_available === "available" ? true : false;
                      return (
                        <span
                          className={`product-status  product-status_${
                            available ? "available" : "unavailable"
                          }`}
                        >
                          {available ? "Disponible" : "Agotado"}
                        </span>
                      );
                    }}
                  ></Column>

                  <Column
                    header="Acciones"
                    style={{ minWidth: "15rem", padding: "1rem" }}
                    body={(rowData) => {
                      return (
                        <div className="table-actions">
                          <EditButton
                            onClick={() => handleEditProduct(rowData)}
                          />
                          <DeleteButton
                            onClick={() => handleDeleteProduct(rowData)}
                          />
                          <InfoButton
                            onClick={() => handleViewProduct(rowData)}
                          />
                        </div>
                      );
                    }}
                  ></Column>
                  <Column expander style={{ width: "3em" }} />
                </DataTable>
              </div>
            )}
            {isMobile && (
              <div>
                <DataTable
                  value={products}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="product_id"
                  showGridlines
                  stripedRows
                >
                  <Column
                    header="Nombre"
                    style={{ minWidth: "10rem", padding: "1rem" }}
                    body={(rowData) => {
                      return (
                        <>
                          <Card
                            style={{
                              border: " none",
                              background: "transparent",
                              boxShadow: "none",
                              padding: "0",
                            }}
                          >
                            <div style={{ padding: "1rem" }}>
                              <span
                                style={{
                                  fontWeight: "800",
                                  fontSize: "1.1rem",
                                }}
                              >
                                {rowData.name}
                              </span>
                            </div>
                            <div>
                              <div className="grid">
                                <div className="col m-auto">
                                  <EditButton
                                    onClick={() => handleEditProduct(rowData)}
                                  />
                                </div>
                                <div className="col m-auto">
                                  <DeleteButton
                                    onClick={() => handleDeleteProduct(rowData)}
                                  />
                                </div>
                                <div className="col m-auto">
                                  <InfoButton
                                    onClick={() => handleViewProduct(rowData)}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </>
                      );
                    }}
                  ></Column>

                  <Column expander style={{ width: "3em" }} />
                </DataTable>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default Products;
