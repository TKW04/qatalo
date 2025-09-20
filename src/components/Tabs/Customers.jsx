import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  Check,
  FileImage,
  Info,
  InfoIcon,
  PencilIcon,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { customerActions } from "../../store/customer-store/customer-slice";

import {
  ApproveTransaction,
  CancelTransactionAdmin,
  GetCustomers,
  UpdateCustomer,
} from "../../store/customer-store/customer-actions";
import { useNotification } from "../UI/NotificationProvider";
import Loading from "../UI/Loading";
import DialogModal from "../DialogModal";
import { formatDate, formatted, getStatusStyle } from "../../helpers/utils";
import "../../styles/catalog.css";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { Dialog } from "primereact/dialog";

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
  const [productInfo, setProductInfo] = useState({});
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 100, height: 200 });
  const isMobile = window.innerWidth <= 480;
  const [expandedRows, setExpandedRows] = useState(null);

  const [editingCustomer, setEditingCustomer] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [transaction, setTransaction] = useState(null);

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
      }, 4500);
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
      setIsLoading(true);
      setTimeout(() => {
        setActiveTab("customers");
        dispatch(GetCustomers(showError));
        dispatch(customerActions.startCustomer());
        setEditingCustomer(false);
        setIsLoading(false);
      }, 1500);
    }
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

  const rowExpansionTemplate = (data) => {
    return (
      <>
        <Dialog
          header="Recibo de pago"
          visible={showImageDialog}
          style={{
            width: "450px",
            overflow: "hidden",
          }}
          onHide={() => {
            if (!showImageDialog) return;
            setShowImageDialog(false);
          }}
        >
          <div>
            <Image
              alt="Image"
              width={imageSize.width}
              height={imageSize.height}
              indicatorIcon={<Search />}
              src={transaction !== null ? transaction.receipt_url : ""}
              zoomSrc={transaction !== null ? transaction.receipt_url : ""}
              style={{
                padding: "10px",
                cursor: "pointer",
              }}
            />
          </div>
        </Dialog>
        <Dialog
          header="Detalles del producto"
          visible={showProductDialog}
          style={{ width: "100%" }}
          onHide={() => setShowProductDialog(false)}
        >
          <div className="admin-card" style={{ textAlign: "left" }}>
            <label className="form-label">
              Producto:{" "}
              <span style={{ fontWeight: "bold" }}>
                {productInfo.product_name}
              </span>
            </label>
            <label className="form-label">
              Cantidad:{" "}
              <span style={{ fontWeight: "bold" }}>{productInfo.quantity}</span>
            </label>
            <label className="form-label">
              Precio unitario:{" "}
              <span style={{ fontWeight: "bold" }}>
                {" "}
                {productInfo.payment_method
                  ? productInfo.payment_method.currency
                  : ""}{" "}
                {formatted(productInfo.price)}
              </span>
            </label>

            <label className="form-label">
              Total:{" "}
              <span style={{ fontWeight: "bold" }}>
                {productInfo.payment_method
                  ? productInfo.payment_method.currency
                  : ""}{" "}
                {formatted(productInfo.price * productInfo.quantity)}
              </span>
            </label>
            <label className="form-label">
              Estado:{" "}
              <span style={getStatusStyle(productInfo.status)}>
                {productInfo.status}
              </span>
            </label>
            {productInfo.status === "Cancelada" && (
              <label className="form-label">
                Razón:{" "}
                <span style={{ fontWeight: "bold" }}>
                  {productInfo.cancellation_reason}
                </span>
              </label>
            )}
            <div className="">
              {productInfo.status !== "Cancelada" &&
                productInfo.status !== "Aprobada" && (
                  <>
                    <div className="grid flex justify-content-center">
                      <div className="col-4 ">
                        <Button
                          style={{ border: "none" }}
                          outlined
                          disabled={!productInfo.receipt_url}
                          label="Ver recibo"
                          onClick={() => {
                            setTransaction(productInfo);
                            setShowImageDialog(true);
                            setImageSize({ width: "400px", height: "400px" });
                          }}
                        />
                      </div>
                      <div className="col-4">
                        <Button
                          style={{ color: "green", border: "none" }}
                          outlined
                          label="Aprobar pago"
                          disabled={!productInfo.receipt_url}
                          onClick={() => {
                            dispatch(
                              ApproveTransaction(
                                data.customer_id,
                                productInfo.transaction_id,
                                showError,
                                showWarning,
                                showSuccess
                              )
                            );
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
                          }}
                        />
                      </div>
                      <div className="col-4">
                        <Button
                          style={{ color: "red", border: "none" }}
                          outlined
                          label="Cancelar"
                          onClick={() => {
                            dispatch(
                              CancelTransactionAdmin(
                                data.customer_id,
                                productInfo.transaction_id,
                                showError,
                                showWarning,
                                showSuccess
                              )
                            );
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
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </Dialog>

        {!isMobile && (
          <div className="">
            <DataTable
              value={data.transactions}
              showGridlines
              style={{ width: "100%" }}
            >
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Producto
                  </span>
                }
                field="product_name"
                style={{
                  width: "15%",
                  textAlign: "center",
                }}
              ></Column>
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Cantidad
                  </span>
                }
                field="quantity"
                style={{ width: "2%", textAlign: "center" }}
              ></Column>
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Precio
                  </span>
                }
                body={(rowData) => {
                  return (
                    <span>
                      {rowData.payment_method.currency}{" "}
                      {formatted(rowData.price)}
                    </span>
                  );
                }}
                style={{ width: "15%", textAlign: "center" }}
              ></Column>
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Total
                  </span>
                }
                body={(rowData) => {
                  const total = rowData.price * rowData.quantity;
                  return (
                    <span>
                      {rowData.payment_method.currency} {formatted(total)}
                    </span>
                  );
                }}
                style={{ width: "15%", textAlign: "center" }}
              ></Column>
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Fecha
                  </span>
                }
                body={(rowData) => {
                  return <span>{formatDate(rowData.create_date)}</span>;
                }}
                style={{ width: "10%", textAlign: "center" }}
              ></Column>
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Estado
                  </span>
                }
                body={(rowData) => {
                  return (
                    <span style={getStatusStyle(rowData.status)}>
                      {rowData.status}
                    </span>
                  );
                }}
                style={{ width: "10%", textAlign: "center" }}
              ></Column>

              <Column
                header="Acciones"
                body={(rowData) => {
                  return (
                    <div className="flex justify-content-center">
                      <Button
                        style={{ border: "none" }}
                        outlined
                        label="Ver detalles"
                        onClick={() => {
                          setProductInfo(rowData);
                          setShowProductDialog(true);
                        }}
                      />
                    </div>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        )}
        {isMobile && (
          <div>
            <DataTable value={data.transactions} showGridlines>
              <Column header="Producto" field="product_name"></Column>
              <Column
                header="Estado"
                body={(rowData) => {
                  return (
                    <span style={getStatusStyle(rowData.status)}>
                      {rowData.status}
                    </span>
                  );
                }}
              ></Column>
              <Column
                header="Acciones"
                body={(rowData) => {
                  return (
                    <div className="flex justify-content-center">
                      <Button
                        style={{ border: "none" }}
                        outlined
                        label="Ver detalles"
                        onClick={() => {
                          setProductInfo(rowData);
                          setShowProductDialog(true);
                        }}
                      />
                    </div>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
      <div>
        <div className="admin-header">
          <h1>Gestión de Clientes</h1>
        </div>
        {editingCustomer && (
          <div className="admin-card">
            <h2>{"Editar Cliente"}</h2>
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.given_name || ""}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "given_name",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="Juan"
                  required
                />
                {customerErrors.given_name && (
                  <div className="error-message">
                    {customerErrors.given_name}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Apellido *</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.family_name || ""}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "family_name",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="perez"
                  required
                />
                {customerErrors.family_name && (
                  <div className="error-message">
                    {customerErrors.family_name}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.email || ""}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "email",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="juan.perez@ejemplo.com"
                  required
                />
                {customerErrors.email && (
                  <div className="error-message">{customerErrors.email}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono </label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.phone || ""}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "phone",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="18095551212"
                />
              </div>

              <div className="form-actions">
                <Button type="submit" className="btn btn-primary">
                  Actualizar Cliente
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
        )}
        <div className="admin-card">
          <h2>Clientes Existentes</h2>
          {customers.length === 0 ? (
            <p>No hay Clientes creados aún.</p>
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
                                border: "none",
                              }}
                              onClick={() => handleEditCustomer(rowData)}
                            />

                            <Button
                              icon={<Info />}
                              outlined
                              style={{
                                height: "40px",
                                width: "40px",
                                color: "#3498db",
                                border: "none",
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
                <div>
                  <DataTable
                    value={customers}
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    dataKey="customer_id"
                    tableStyle={{ minWidth: "6rem" }}
                  >
                    <Column
                      header={
                        <span style={{ fontWeight: "bold", fontSize: "1.2em" }}>
                          Cliente
                        </span>
                      }
                      body={(rowData) => {
                        return (
                          <>
                            <Card
                              style={{
                                border: "none",
                                boxShadow: "none",
                                marginBottom: "0px",
                                padding: "0px",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight: "800",
                                    padding: "10px",
                                    fontSize: "1.2em",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {rowData.given_name} {rowData.family_name}
                                </div>
                              </div>
                              <div className="table-actions">
                                <div className="table-actions">
                                  <Button
                                    icon={<PencilIcon />}
                                    outlined
                                    style={{
                                      height: "40px",
                                      width: "40px",
                                      color: "var(--color-navy)",
                                      border: "none",
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
                                      border: "none",
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
                                      border: "none",
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
