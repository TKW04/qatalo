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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 80, height: 60 });
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
          style={{ width: imageSize.width === 80 ? "400px" : "100%" }}
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
              onClick={() => {
                setImageSize({ width: 800, height: 300 });
              }}
            />
          </div>
        </Dialog>
        <div className="p-3">
          <DataTable value={data.transactions} showGridlines>
            <Column header="Producto" field="product_name"></Column>
            <Column header="Cantidad" field="quantity"></Column>
            <Column
              header="Precio unitario"
              body={(rowData) => {
                return (
                  <span>
                    {rowData.payment_method.currency} {formatted(rowData.price)}
                  </span>
                );
              }}
            ></Column>
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
            <Column
              header="Fecha"
              body={(rowData) => {
                return <span>{formatDate(rowData.create_date)}</span>;
              }}
            ></Column>
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
                      icon={<FileImage />}
                      style={{ border: "none" }}
                      outlined
                      disabled={!rowData.receipt_url}
                      tooltip="Ver recibo"
                      onClick={() => {
                        setTransaction(rowData);
                        setShowImageDialog(true);
                        setImageSize({ width: 80, height: 60 });
                      }}
                    />
                    {rowData.status !== "Cancelada" &&
                      rowData.status !== "Aprobada" && (
                        <>
                          <Button
                            icon={<Check />}
                            style={{ color: "green", border: "none" }}
                            outlined
                            tooltip="Aprobar pago"
                            disabled={!rowData.receipt_url}
                            onClick={() => {
                              dispatch(
                                ApproveTransaction(
                                  data.customer_id,
                                  rowData.transaction_id,
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
                          <Button
                            icon={<X />}
                            style={{ color: "red", border: "none" }}
                            outlined
                            tooltip="Cancelar"
                            onClick={() => {
                              dispatch(
                                CancelTransactionAdmin(
                                  data.customer_id,
                                  rowData.transaction_id,
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
                        </>
                      )}
                  </div>
                );
              }}
            ></Column>
          </DataTable>
        </div>
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
