import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Info, PencilIcon, Trash2, X } from "lucide-react";
import { customerActions } from "../../store/customer-store/customer-slice";

import {
  CreateCustomer,
  DeleteCustomer,
  GetCustomers,
  UpdateCustomer,
} from "../../store/customer-store/customer-actions";
import { useNotification } from "../UI/NotificationProvider";
import Loading from "../UI/Loading";
import DialogModal from "../DialogModal";
import "../../styles/catalog.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";

let once = true;
const Customers = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();

  const customers = useSelector((state) => state.customer.customers);
  const customer = useSelector((state) => state.customer.customer);
  const business = useSelector((state) => state.business.business);
  const [customerErrors, setCustomerErrors] = useState({});
  const [dialogContent, setDialogContent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const isMobile = window.innerWidth <= 480;
  const [expandedRows, setExpandedRows] = useState(null);

  const [editingCustomer, setEditingCustomer] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    if (customers.length === 0 && once) {
      setIsLoading(true);
      setLoadingMessage("Cargando clientes...");
      dispatch(GetCustomers(showError));
      dispatch(customerActions.startCustomer());
      once = false;
      dispatch(
        customerActions.modifyPropertyValue({
          id: "business_id",
          value: business.business_id,
        })
      );
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [business.business_id, customers, dispatch, showError]);

  const validateCustomer = (data) => {
    const errors = {};

    if (!data.given_name.trim()) errors.given_name = "El nombre es requerido";
    if (!data.family_name.trim())
      errors.family_name = "El apellido es requerido";
    if (!data.email.trim()) errors.email = "El email es requerido";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email))
        errors.email = "El email no tiene un formato válido";
    }

    return errors;
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    const errors = validateCustomer(customer);
    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) {
      setIsLoading(false);
      return;
    }
    if (customer.customer_id) {
      setLoadingMessage("Actualizando cliente...");
      dispatch(UpdateCustomer(customer, showError, showWarning, showSuccess));
    } else {
      setLoadingMessage("Creando cliente...");
      dispatch(CreateCustomer(customer, showError, showWarning, showSuccess));
    }
    setTimeout(() => {
      setActiveTab("customers");
      dispatch(GetCustomers(showError));
      dispatch(customerActions.startCustomer());
      setEditingCustomer(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleEditCustomer = (customer) => {
    dispatch(customerActions.setCustomer({ customer: customer }));
    setEditingCustomer(true);
  };

  const handleDeleteCustomer = (showDialog, customer) => {
    setShowDialog(showDialog);
    dispatch(customerActions.setCustomer({ customer: customer }));
  };

  const handleViewCustomer = (customerInfo) => {
    const title = "Detalles del Cliente";
    const children = (
      <div className="admin-card" style={{ textAlign: "left" }}>
        <label className="form-label">
          Nombre:{" "}
          <span style={{ fontWeight: "bold" }}>{customerInfo.given_name}</span>
        </label>
        <label className="form-label">
          Apellido:{" "}
          <span style={{ fontWeight: "bold" }}>{customerInfo.family_name}</span>
        </label>
        <label className="form-label">
          Email:{" "}
          <span style={{ fontWeight: "bold" }}>{customerInfo.email}</span>
        </label>
        <label className="form-label">
          Teléfono:{" "}
          <span style={{ fontWeight: "bold" }}>{customerInfo.phone}</span>
        </label>
      </div>
    );
    const footer = null;
    setDialogContent({ title, children, footer });
    setShowDialog(true);
  };
  const formatted = (value) => {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <DataTable value={data.transactions} showGridlines>
          <Column header="Producto" field="product_name"></Column>
          <Column header="Cantidad" field="quantity"></Column>
          <Column header="Precio unitario" body={(rowData) => {
            return (
              <span>
                {rowData.payment_method.currency} {formatted(rowData.price)}
              </span>
            );
          }}></Column>
          <Column
            header="Total"
            body={(rowData) => {
              const total = rowData.price * rowData.quantity;
              return (
                <span>
                  {rowData.payment_method.currency} {formatted(total)}
                </span>
              );
            }}
          ></Column>
          <Column header="Estado" field="status"></Column>
          <Column
            header="Método de Pago"
            body={(rowData) => {
              return rowData.payment_method
                ? `${
                    rowData.payment_method.payment_type === "bank_transfer"
                      ? "Transferencia"
                      : "Tarjeta de Crédito"
                  } (${rowData.payment_method.currency})`
                : "N/A";
            }}
          ></Column>

          {/* <Column
              header="Acciones"
              body={(rowData) => {
                return (
                  <div className="flex justify-content-center">
                    <Button
                      icon={<Trash2 style={{ color: "red" }} />}
                      className="p-button-rounded p-button-danger ml-auto"
                      onClick={() => {
                        const title = "Eliminar Imagen";
                        const children = (
                          <div>
                            ¿Estás seguro de que deseas eliminar esta imagen?
                          </div>
                        );
                        const footer = (
                          <div className="flex justify-content-end">
                            <Button
                              className="btn btn-secondary"
                              label="No"
                              icon={<X />}
                              onClick={() => setShowDialog(false)}
                              style={{ width: "100px", margin: "2px" }}
                            />
                            <Button
                              className="btn btn-danger"
                              label="Si"
                              icon={<Trash2 />}
                              style={{ width: "100px", margin: "2px" }}
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
                                }, 1500);
                              }}
                            />
                          </div>
                        );
                        setDialogContent({ title, children, footer });
                        setShowDialog(true);
                      }}
                    />
                  </div>
                );
              }}
            ></Column> */}
        </DataTable>
      </div>
    );
  };

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
      <div>
        <div className="admin-header">
          <h1>Gestión de Clientes</h1>
        </div>

        <div className="admin-card">
          <h2>{editingCustomer ? "Editar Categoría" : "Nueva Categoría"}</h2>
          <form onSubmit={handleCustomerSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <InputText
                type="text"
                className="input"
                value={customer.name}
                onChange={(e) => {
                  dispatch(
                    customerActions.modifyPropertyValue({
                      id: "name",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="Ropa"
                required
              />
              {customerErrors.given_name && (
                <div className="error-message">{customerErrors.given_name}</div>
              )}
            </div>

            <div className="form-actions">
              <Button type="submit" className="btn btn-primary">
                {editingCustomer ? "Actualizar" : "Crear"} Categoría
              </Button>
              {editingCustomer && (
                <Button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    dispatch(customerActions.startCustomer(false));
                    setEditingCustomer(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h2>Categorías Existentes</h2>
          {customers.length === 0 ? (
            <p>No hay categorías creadas aún.</p>
          ) : (
            <>
              <DialogModal
                title={dialogContent?.title || "Eliminar Producto"}
                visible={showDialog}
                onHide={() => setShowDialog(false)}
                footer={dialogContent?.footer || null}
              >
                <p>
                  {dialogContent?.children ||
                    "¿Estás seguro de que deseas eliminar este producto?"}
                </p>
              </DialogModal>
              {!isMobile && (
                <div className="card">
                  <DataTable
                    value={customers}
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    dataKey="customer_id"
                    tableStyle={{ minWidth: "60rem" }}
                  >
                    <Column field="given_name" header="Nombre"></Column>
                    <Column field="family_name" header="Apellido"></Column>
                    <Column field="email" header="Email"></Column>
                    <Column field="phone" header="Teléfono"></Column>
                    <Column
                      header="Acciones"
                      body={(rowData) => {
                        return (
                          <div
                            className="table-actions"
                            style={{
                              alignContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Button
                              icon={<PencilIcon />}
                              outlined
                              style={{
                                height: "40px",
                                width: "40px",
                                color: "var(--color-blue)",
                                borderColor: "var(--color-blue)",
                              }}
                              onClick={() => handleEditCustomer(rowData)}
                            />
                            <Button
                              icon={<Trash2 />}
                              outlined
                              style={{
                                height: "40px",
                                width: "40px",
                                color: "#e74c3c",
                                borderColor: "#e74c3c",
                              }}
                              onClick={() => handleDeleteCustomer(rowData)}
                            />
                            <Button
                              icon={<Info />}
                              outlined
                              style={{
                                height: "40px",
                                width: "40px",
                                color: "#3498db",
                                borderColor: "#3498db",
                              }}
                              onClick={() => handleViewCustomer(rowData)}
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
                <div className="card">
                  <DataTable
                    value={customers}
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    dataKey="customer_id"
                    tableStyle={{ minWidth: "6rem" }}
                  >
                    <Column
                      header="Nombre"
                      body={(rowData) => {
                        return (
                          <>
                            <Card>
                              <div>
                                <span
                                  style={{
                                    fontWeight: "400",
                                  }}
                                >
                                  {rowData.name}
                                </span>
                              </div>
                              <div className="table-actions">
                                <div className="table-actions">
                                  <Button
                                    icon={<PencilIcon />}
                                    className="btn btn-small btn-outline"
                                    onClick={() => handleEditCustomer(rowData)}
                                  />
                                  <Button
                                    icon={<Trash2 />}
                                    outlined
                                    style={{
                                      height: "40px",
                                      width: "40px",
                                      color: "#e74c3c",
                                      borderColor: "#e74c3c",
                                    }}
                                    onClick={() =>
                                      handleDeleteCustomer(rowData)
                                    }
                                  />
                                  <Button
                                    icon={<Info />}
                                    outlined
                                    style={{
                                      height: "40px",
                                      width: "40px",
                                      color: "#3498db",
                                      borderColor: "#3498db",
                                    }}
                                    onClick={() => handleViewCustomer(rowData)}
                                  />
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
          )}
        </div>
      </div>
    </>
  );
};
export default Customers;
