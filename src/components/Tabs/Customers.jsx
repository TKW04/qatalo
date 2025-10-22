import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Search, BookImage, Check, Trash2 } from "lucide-react";
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
import {
  currencies,
  formatDate,
  formatted,
  formatTextDate,
  getStatusStyle,
} from "../../helpers/utils";
import "../../styles/catalog.css";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { EditButton, InfoButton } from "../Buttons";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";

let once = true;
const Customers = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();

  const customers = useSelector((state) => state.customer.customers);
  const customer = useSelector((state) => state.customer.customer);
  const business = useSelector((state) => state.business.business);
  const [customerErrors, setCustomerErrors] = useState({});
  const [dialogContent, setDialogContent] = useState(null);

  const [productInfo, setProductInfo] = useState({});

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDialogCancel, setShowDialogCancel] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  // const customer_id = customer.customer_id;

  const [imageSize, setImageSize] = useState({ width: 100, height: 200 });
  const isMobile = window.innerWidth <= 760;
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
      }, 4500);
    }
  };

  const handleEditCustomer = (customer) => {
    dispatch(customerActions.setCustomer({ customer: customer }));
    setEditingCustomer(true);
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
        <label className="form-label">
          Edad: <span style={{ fontWeight: "bold" }}>{customerInfo.age}</span>
        </label>
      </div>
    );
    setDialogContent({ title, children });
    setShowDialog(true);
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : "";
  };

  const rowExpansionTemplate = (data) => {
    return (
      <>
        <DialogModal
          title={"Cancelar Transacción"}
          width={"30vw"}
          visible={showDialogCancel}
          onHide={() => setShowDialogCancel(false)}
        >
          <div
            style={{
              textAlign: "left",
              padding: "30px",
              overflowX: "hidden",
              maxWidth: "800px",
            }}
          >
            <div
              className="flex flex-column gap-2 p-3"
              style={{
                textAlign: "left",
                borderRadius: "8px",
              }}
            >
              <div className="grid flex gap-2">
                <div className="col-12">
                  <InputTextarea
                    rows={5}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ingrese la razón de la cancelación"
                    style={{ width: "100%", padding: "10px" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-content-start mt-2">
              <div className="flex gap-2">
                <Button
                  label="Cerrar"
                  className="btn btn-outline"
                  raised
                  style={{ width: "100px", height: "40px", margin: "10px" }}
                  onClick={() => {
                    setShowDialogCancel(false);
                    setCancellationReason("");
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  label="Solicitar"
                  className="btn btn-primary"
                  raised
                  style={{ width: "100px", height: "40px", margin: "10px" }}
                  onClick={() => {
                    dispatch(
                      CancelTransactionAdmin(
                        data.customer_id,
                        productInfo.transaction_id,
                        cancellationReason,
                        showError,
                        showWarning,
                        showSuccess
                      )
                    );
                    setIsLoading(true);
                    setShowDialogCancel(false);
                    setShowProductDialog(false);
                    setLoadingMessage("Cancelado transacción...");

                    setTimeout(() => {
                      setIsLoading(false);
                      dispatch(GetCustomers(showError));
                      dispatch(customerActions.startCustomer());
                      dispatch(
                        customerActions.modifyPropertyValue({
                          id: "business_id",
                          value: business.business_id,
                        })
                      );
                    }, 4500);
                  }}
                />
              </div>
            </div>
          </div>
        </DialogModal>
        <DialogModal
          title={"Imagen del Recibo"}
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
        </DialogModal>
        <DialogModal
          title={"Información del producto"}
          width={"30vw"}
          visible={showProductDialog}
          onHide={() => setShowProductDialog(false)}
        >
          <div
            style={{
              textAlign: "left",
              padding: "30px",
              overflowX: "hidden",
              maxWidth: "800px",
            }}
          >
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
                  ? getCurrencySymbol(productInfo.payment_method.currency)
                  : ""}{" "}
                {formatted(productInfo.price)}
              </span>
            </label>

            <label className="form-label">
              Total:{" "}
              <span style={{ fontWeight: "bold" }}>
                {productInfo.payment_method
                  ? getCurrencySymbol(productInfo.payment_method.currency)
                  : ""}{" "}
                {formatted(productInfo.price * productInfo.quantity)}
              </span>
            </label>
            {productInfo.delivery_day &&
              productInfo.delivery_day !== "" &&
              productInfo.delivery_day !== null && (
                <label className="form-label">
                  Fecha de entrega:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {formatTextDate(productInfo.delivery_day)}
                  </span>
                </label>
              )}
            <label className="form-label">
              Método de Pago:{" "}
              <span style={{ fontWeight: "bold" }}>
                {productInfo.payment_method !== undefined &&
                productInfo.payment_method.payment_type !== undefined &&
                productInfo.payment_method.payment_type === "bank_transfer"
                  ? "Transferencia Bancaria"
                  : "Link de Pago"}
              </span>
            </label>
            <label className="form-label">
              Términos Aceptados:{" "}
              <InputSwitch
                checked={productInfo.accept_terms || false}
                disabled
              />
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
                          icon={<BookImage />}
                          raised
                          disabled={!productInfo.receipt_url}
                          label="Recibo"
                          onClick={() => {
                            setTransaction(productInfo);
                            setShowImageDialog(true);
                            setImageSize({ width: "400px", height: "400px" });
                          }}
                          style={{ padding: "10px" }}
                        />
                      </div>
                      <div className="col-4">
                        <Button
                          icon={<Check />}
                          raised
                          label="Validar"
                          disabled={!productInfo.receipt_url}
                          style={{
                            padding: "10px",
                            backgroundColor: "green",
                            borderColor: "green",
                          }}
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

                            setTimeout(() => {
                              setIsLoading(false);
                              setShowProductDialog(false);
                              dispatch(GetCustomers(showError));
                              dispatch(customerActions.startCustomer());
                              once = false;
                              dispatch(
                                customerActions.modifyPropertyValue({
                                  id: "business_id",
                                  value: business.business_id,
                                })
                              );
                            }, 4500);
                          }}
                        />
                      </div>
                      <div className="col-4">
                        <Button
                          icon={<Trash2 />}
                          raised
                          label="Cancelar"
                          style={{
                            padding: "10px",
                            backgroundColor: "red",
                            borderColor: "red",
                            color: "white",
                          }}
                          onClick={() => {
                            setShowDialogCancel(true);
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </DialogModal>

        {!isMobile && (
          <div>
            <DataTable
              value={data.transactions}
              dataKey="transaction_id"
              showGridlines
              stripedRows
            >
              <Column
                style={{
                  minWidth: "14rem",
                  padding: "1rem",
                }}
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Producto
                  </span>
                }
                field="product_name"
              ></Column>
              <Column
                header={
                  <span style={{ fontWeight: "bold", padding: "10px" }}>
                    Cantidad
                  </span>
                }
                field="quantity"
                style={{
                  minWidth: "4rem",
                  padding: "1rem",
                }}
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
                      {getCurrencySymbol(rowData.payment_method.currency)}{" "}
                      {formatted(rowData.price)}
                    </span>
                  );
                }}
                style={{
                  minWidth: "10rem",
                  padding: "1rem",
                }}
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
                      {getCurrencySymbol(rowData.payment_method.currency)}{" "}
                      {formatted(total)}
                    </span>
                  );
                }}
                style={{
                  minWidth: "10rem",
                  padding: "1rem",
                }}
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
                style={{
                  minWidth: "4rem",
                  padding: "1rem",
                }}
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
                style={{
                  minWidth: "14rem",
                  padding: "1rem",
                }}
              ></Column>

              <Column
                header="Acciones"
                style={{
                  minWidth: "10rem",
                  padding: "1rem",
                }}
                body={(rowData) => {
                  return (
                    <div className="flex justify-content-center">
                      <InfoButton
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
            <DataTable
              value={data.transactions}
              showGridlines
              stripedRows
              style={{ maxWidth: "30rem" }}
            >
              <Column
                style={{
                  minWidth: "8rem",
                  padding: "1rem",
                }}
                header="Producto"
                field="product_name"
              ></Column>
              <Column
                style={{
                  minWidth: "8rem",
                  padding: "1rem",
                }}
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
                style={{
                  minWidth: "3rem",
                  padding: "1rem",
                }}
                header="Acciones"
                body={(rowData) => {
                  return (
                    <div className="flex justify-content-center">
                      <InfoButton
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
        <div>
          <h2>Clientes Existentes</h2>
          <>
            <DialogModal
              title={dialogContent?.title || "Eliminar Producto"}
              width={"20vw"}
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
              <div>
                <DataTable
                  value={customers}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="customer_id"
                >
                  <Column
                    style={{
                      minWidth: "14rem",
                      padding: "1rem",
                    }}
                    header="Nombre Completo"
                    body={(rowData) => {
                      return (
                        <span>
                          {rowData.given_name} {rowData.family_name}
                        </span>
                      );
                    }}
                  ></Column>
                  <Column
                    field="age"
                    style={{
                      minWidth: "3rem",
                      padding: "1rem",
                    }}
                    header="Edad"
                  ></Column>
                  <Column
                    field="email"
                    style={{
                      minWidth: "14rem",
                      padding: "1rem",
                    }}
                    header="Email"
                  ></Column>
                  <Column
                    field="phone"
                    style={{
                      minWidth: "14rem",
                      padding: "1rem",
                    }}
                    header="Teléfono"
                  ></Column>
                  <Column
                    header="Acciones"
                    style={{
                      minWidth: "14rem",
                      padding: "1rem",
                    }}
                    body={(rowData) => {
                      return (
                        <div
                          className="table-actions"
                          style={{
                            alignContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <EditButton
                            onClick={() => handleEditCustomer(rowData)}
                          />
                          <InfoButton
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
                >
                  <Column
                    style={{
                      minWidth: "14rem",
                      padding: "1rem",
                    }}
                    header={
                      <span style={{ fontWeight: "bold", fontSize: "1.2em" }}>
                        Cliente
                      </span>
                    }
                    body={(rowData) => {
                      return (
                        <>
                          <Card>
                            <div className="p-3">
                              <span
                                style={{
                                  fontWeight: "800",
                                  fontSize: "1.14rem",
                                }}
                              >
                                {rowData.given_name} {rowData.family_name}
                              </span>
                              <span style={{ display: "block" }}>
                                {rowData.email}
                              </span>
                            </div>
                            <div className="table-actions">
                              <div className="table-actions p-2">
                                <EditButton
                                  onClick={() => handleEditCustomer(rowData)}
                                />
                                <InfoButton
                                  onClick={() => handleViewCustomer(rowData)}
                                />
                              </div>
                            </div>
                          </Card>
                        </>
                      );
                    }}
                  ></Column>

                  <Column expander style={{ width: "1em" }} />
                </DataTable>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};
export default Customers;
