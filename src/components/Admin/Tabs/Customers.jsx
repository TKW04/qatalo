import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";

import { CiReceipt, CiSearch, CiUser } from "react-icons/ci";
import { MdCancel } from "react-icons/md";
import { FaRegFileExcel, FaWhatsapp } from "react-icons/fa";
import { GoPlus } from "react-icons/go";
import { FiMinus } from "react-icons/fi";

import { saveAs } from "file-saver";

import { customerActions } from "../../../store/customer-store/customer-slice";

import {
  AddTransaction,
  ApproveTransaction,
  CancelTransactionAdmin,
  CreateCustomerWithoutTransaction,
  DeleteCustomer,
  DeleteTransaction,
  DeliveredTransaction,
  GetCustomers,
  UpdateCustomer,
  UpdateTransaction,
} from "../../../store/customer-store/customer-actions";
import { useNotification } from "../../UI/NotificationProvider";
import Loading from "../../UI/Loading";
import DialogModal from "../../DialogModal";
import {
  currencies,
  formatDate,
  formatted,
  formatTextDate,
  formatTextDateShort,
  getStatusStyle,
} from "../../../helpers/utils";
import "../../../styles/catalog.css";

import {
  AddTransactionButton,
  DeleteButton,
  EditButton,
  InfoButton,
  RefreshButton,
  SentOrderButton,
  ValidatePaymentButton,
  YesNoButton,
} from "../../Buttons";

import SellReport from "../../SellReport";
import adminStyles from "../Admin.module.css";
import { GetProductsDropDown } from "../../../store/product-store/product-actions";
import { GetPaymentMethodsByBusinessId } from "../../../store/paymentMethod-store/paymentMethod-actions";

let once = true;
const Customers = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();

  const customers = useSelector((state) => state.customer.customers);
  const customer = useSelector((state) => state.customer.customer);
  const business = useSelector((state) => state.business.business);
  const products = useSelector((state) => state.product.products);
  const paymentMethods = useSelector(
    (state) => state.paymentMethod.paymentMethods
  );

  const [customerErrors, setCustomerErrors] = useState({});
  const [dialogContent, setDialogContent] = useState(null);

  const [productInfo, setProductInfo] = useState({});
  const [transactionInfo, setTransactionInfo] = useState({
    delivery_day: "",
    price: 0,
    quantity: 1,
  });

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDialogCancel, setShowDialogCancel] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const [imageSize, setImageSize] = useState({ width: 100, height: 200 });
  const isMobile = window.innerWidth <= 480;
  const [expandedRows, setExpandedRows] = useState(null);

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [transaction, setTransaction] = useState(null);
  const [showSellReport, setShowSellReport] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({
    code: "",
    name: "",
    price: 0,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({
    code: "",
    name: "",
  });

  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    full_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

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

  useEffect(() => {
    if (products.length === 0) {
      dispatch(GetProductsDropDown(business.business_id, showError));
    }
  }, [business.business_id, dispatch, products, showError]);

  useEffect(() => {
    if (paymentMethods.length === 0) {
      dispatch(GetPaymentMethodsByBusinessId(business.business_id, showError));
    }
  }, [business.business_id, dispatch, paymentMethods, showError]);

  useEffect(() => {
    if (
      productInfo &&
      productInfo.product_id &&
      selectedProduct.code === "" &&
      editingTransaction === true
    ) {
      const foundProduct = products.find(
        (product) => product.code === productInfo.product_id
      );
      setSelectedProduct({
        code: foundProduct ? foundProduct.code : "",
        name: foundProduct ? foundProduct.name : "",
        price: foundProduct ? foundProduct.price : 0,
      });
    }
  }, [
    editingTransaction,
    productInfo,
    products,
    selectedProduct.code,
    transaction,
  ]);

  useEffect(() => {
    if (
      productInfo &&
      productInfo.product_id &&
      selectedPaymentMethod.code === "" &&
      editingTransaction === true
    ) {
      const paymentMethodId = productInfo.payment_method
        ? productInfo.payment_method.payment_method_id
        : "";

      const foundPaymentMethod = paymentMethods.find(
        (paymentMethod) => paymentMethod.payment_method_id === paymentMethodId
      );
      setSelectedPaymentMethod({
        code: foundPaymentMethod ? foundPaymentMethod.payment_method_id : "",
        name: foundPaymentMethod ? foundPaymentMethod.payment_method_name : "",
      });
    }
  }, [
    editingTransaction,
    paymentMethods,
    productInfo,
    selectedPaymentMethod.code,
  ]);

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

    if (
      customer != undefined &&
      customer.customer_id != undefined &&
      customer.customer_id !== null &&
      customer.customer_id !== ""
    ) {
      setLoadingMessage("Actualizando cliente...");
      setIsLoading(true);
      const updatedCustomer = {
        ...customer,
        given_name: customer.given_name.trim(),
        family_name: customer.family_name.trim(),
        email: customer.email.trim(),
      };
      dispatch(
        UpdateCustomer(updatedCustomer, showError, showWarning, showSuccess)
      );
    } else {
      const newCustomer = {
        given_name: customer.given_name.trim(),
        family_name: customer.family_name.trim(),
        email: customer.email.trim(),
        phone: customer.phone,
        business_id: business.business_id,
      };
      setLoadingMessage("Creando cliente...");
      setIsLoading(true);

      dispatch(
        CreateCustomerWithoutTransaction(newCustomer, showWarning, showSuccess)
      );
    }

    setTimeout(() => {
      setActiveTab("customers");
      dispatch(GetCustomers(showError));
      dispatch(customerActions.startCustomer());
      setEditingCustomer(false);
      setIsLoading(false);
    }, 4500);
  };
  const handleUpdateTransaction = (e) => {
    e.preventDefault();

    const transaction = {
      transaction_id: productInfo.transaction_id,
      product_id: selectedProduct.code,
      product_name: selectedProduct.name,
      customer_id: customer.customer_id,
      delivery_day: transactionInfo.delivery_day
        ? transactionInfo.delivery_day
        : productInfo.delivery_day,
      price: transactionInfo.price ? transactionInfo.price : productInfo.price,
      quantity: transactionInfo.quantity
        ? transactionInfo.quantity
        : productInfo.quantity,
      payment_method: paymentMethods.find(
        (pm) => pm.payment_method_id === selectedPaymentMethod.code
      ),
    };

    dispatch(
      UpdateTransaction(
        customer.customer_id,
        transaction,
        showError,
        showWarning,
        showSuccess
      )
    );
    setIsLoading(true);
    setTimeout(() => {
      setActiveTab("customers");
      dispatch(GetCustomers(showError));
      dispatch(customerActions.startCustomer());
      setEditingCustomer(false);
      setEditingTransaction(false);
      setShowTransactionForm(false);
      setShowCustomerForm(false);
      setIsLoading(false);
    }, 4500);
  };
  const handleAddTransaction = (e) => {
    e.preventDefault();

    const transaction = {
      product_id: selectedProduct.code,
      product_name: selectedProduct.name,
      customer_id: customer.customer_id,
      delivery_day: transactionInfo.delivery_day,
      price: transactionInfo.price,
      quantity: transactionInfo.quantity,
      payment_method: paymentMethods.find(
        (pm) => pm.payment_method_id === selectedPaymentMethod.code
      ),
    };

    dispatch(
      AddTransaction(
        customer.customer_id,
        transaction,
        showError,
        showWarning,
        showSuccess
      )
    );
    setIsLoading(true);
    setTimeout(() => {
      setActiveTab("customers");
      dispatch(GetCustomers(showError));
      dispatch(customerActions.startCustomer());
      setEditingCustomer(false);
      setEditingTransaction(false);
      setShowTransactionForm(false);
      setShowCustomerForm(false);
      setIsLoading(false);
    }, 4500);
  };

  const handleEditCustomer = (customer) => {
    dispatch(customerActions.setCustomer({ customer: customer }));
    setEditingCustomer(true);
    setEditingTransaction(false);
    setShowCustomerForm(true);
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

  const rowExpansionButtons = (data, rowData) => {
    return (
      <>
        {rowData.status !== "Aprobada" && rowData.status !== "Entregada" && (
          <EditButton
            onClick={() => {
              setEditingTransaction(true);
              setShowTransactionForm(true);
              setSelectedProduct({ code: "", name: "" });
              setSelectedPaymentMethod({ code: "", name: "" });
              setShowCustomerForm(false);
              dispatch(customerActions.setCustomer({ customer: data }));
              setProductInfo(rowData);
            }}
          />
        )}

        {rowData.status !== "Aprobada" &&
          rowData.status !== "Pendiente de pago" && (
            <InfoButton
              onClick={() => {
                setProductInfo(rowData);
                setShowProductDialog(true);
              }}
            />
          )}
        {rowData.status === "Pendiente de pago" && (
          <ValidatePaymentButton
            onClick={() => {
              setProductInfo(rowData);
              setShowProductDialog(true);
            }}
          />
        )}
        {rowData.status === "Aprobada" && (
          <SentOrderButton
            onClick={() => {
              setProductInfo(rowData);
              setShowProductDialog(true);
            }}
          />
        )}
        {rowData.status === "Pendiente de pago" && (
          <DeleteButton
            onClick={() => {
              const title = "Confirmar eliminación";
              const children = (
                <div className="admin-card">
                  <p style={{ color: "#ffffff" }}>
                    ¿Estás seguro de que deseas eliminar esta transacción?
                  </p>
                  <div className="flex justify-content-end mt-3">
                    <YesNoButton
                      label="No"
                      onClick={() => setShowDialog(false)}
                    />
                    <YesNoButton
                      label="Sí"
                      onClick={() => {
                        setLoadingMessage("Eliminando transacción...");
                        setIsLoading(true);
                        setShowDialog(false);
                        dispatch(
                          DeleteTransaction(
                            data.customer_id,
                            rowData.transaction_id,
                            showError,
                            showWarning,
                            showSuccess
                          )
                        );
                        setTimeout(() => {
                          setActiveTab("customers");
                          dispatch(GetCustomers(showError));
                          dispatch(customerActions.startCustomer());
                          setEditingCustomer(false);
                          setEditingTransaction(false);
                          setShowTransactionForm(false);
                          setShowCustomerForm(false);
                          setIsLoading(false);
                        }, 4500);
                      }}
                    />
                  </div>
                </div>
              );
              setDialogContent({ title, children });
              setShowDialog(true);
            }}
          />
        )}
      </>
    );
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
          <div className={adminStyles.adminModalContent}>
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
              indicatorIcon={<CiSearch />}
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
          <div className={adminStyles.adminModalContent}>
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
                productInfo.status !== "Aprobada" &&
                productInfo.status !== "Entregada" && (
                  <>
                    <div className="grid flex justify-content-center">
                      <div className={`${isMobile ? "col-12" : "col-6"}`}>
                        <Button
                          icon={<CiReceipt />}
                          raised
                          label="Recibo de pago"
                          onClick={() => {
                            if (!productInfo.receipt_url) {
                              showWarning(
                                "El cliente no ha subido un recibo aún."
                              );
                              return;
                            }
                            setTransaction(productInfo);
                            setShowImageDialog(true);
                            setImageSize({ width: "400px", height: "400px" });
                          }}
                          style={{ padding: "10px", borderColor: "white" }}
                        />
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-6"}`}>
                        <ValidatePaymentButton
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
                      <div className={`${isMobile ? "col-12" : "col-6"}`}>
                        <Button
                          icon={<MdCancel />}
                          raised
                          label="Cancelar orden"
                          style={{
                            padding: "10px",
                            backgroundColor: "red",
                            borderColor: "white",
                            color: "white",
                            width: "100%",
                          }}
                          onClick={() => {
                            setShowDialogCancel(true);
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              {productInfo.status === "Aprobada" && (
                <div className={`${isMobile ? "col-12" : "col-6"}`}>
                  <SentOrderButton
                    onClick={() => {
                      dispatch(
                        DeliveredTransaction(
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
              filters={filters}
              filterDisplay="row"
              style={{
                borderBottom: " 2px solid var(--color-navy)",
                paddingBottom: "1rem",
              }}
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
                    Entrega
                  </span>
                }
                body={(rowData) => {
                  return <span>{rowData.delivery_day}</span>;
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
                      {rowData.status === "Entregada"
                        ? "Orden Entregada"
                        : rowData.status === "Aprobada"
                        ? "Pago Completado"
                        : rowData.status}
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
                      {rowExpansionButtons(data, rowData)}
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
                body={(rowData) => {
                  return (
                    <>
                      <Card>
                        <div className="grid p-3">
                          <div className="col-12">
                            <span
                              style={{
                                fontWeight: "800",
                                fontSize: "1.14rem",
                              }}
                            >
                              {rowData.product_name}
                            </span>
                          </div>
                          <div className="col-12 p-1">
                            Estado:{" "}
                            <span style={getStatusStyle(rowData.status)}>
                              <span style={getStatusStyle(rowData.status)}>
                                {rowData.status === "Entregada"
                                  ? "Orden Entregada"
                                  : rowData.status === "Aprobada"
                                  ? "Pago Completado"
                                  : rowData.status}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="table-actions">
                          <div className="table-actions p-2">
                            {rowExpansionButtons(data, rowData)}
                          </div>
                        </div>
                      </Card>
                    </>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        )}
      </>
    );
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    //Lista de ventas
    const customersData = [];
    customers.forEach((customer) => {
      customer.transactions.forEach((transaction) => {
        customersData.push({
          full_name: `${customer.given_name} ${customer.family_name}`,
          product_name: transaction.product_name,
          quantity: transaction.quantity,
          price: transaction.price,
          total: transaction.price * transaction.quantity,
          currency: transaction.payment_method.currency,
          delivery_day: transaction.delivery_day
            ? formatTextDateShort(transaction.delivery_day)
            : "",
          status:
            transaction.status === "Aprobada"
              ? "Pago Completado"
              : transaction.status === "Pendiente de pago"
              ? "Pendiente de pago"
              : transaction.status === "Pendiente de validación"
              ? "Pendiente de validación"
              :transaction.status === "Entregada" 
              ? "Orden Entregada"
              : "Cancelada",
        });
      });
    });

    // 1️⃣ Crear la hoja
    const header = [
      "Nombre completo",
      "Producto",
      "Cantidad",
      "Precio",
      "Total",
      "Fecha de entrega",
      "Estado",
    ];
    const wsData = [
      header,
      ...customersData.map((item) => [
        item.full_name,
        item.product_name,
        item.quantity,
        item.price,
        item.total,
        item.delivery_day,
        item.status,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 2️⃣ Aplicar estilos de cabecera
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "213448" } }, // azul oscuro (#213448)
      border: {
        top: { style: "thin", color: { rgb: "FFFFFF" } },
        bottom: { style: "thin", color: { rgb: "FFFFFF" } },
      },
    };

    // 3️⃣ Aplicar bordes a las filas de datos
    const dataStyle = {
      font: { bold: true, sz: 12 },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "999999" } },
        bottom: { style: "thin", color: { rgb: "999999" } },
      },
    };

    customersData.forEach((row, rIdx) => {
      header.forEach((_, cIdx) => {
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: cIdx })];
        if (headerCell) headerCell.s = headerStyle;
        const cell = ws[XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx })];
        if (cell) cell.s = dataStyle;
      });
    });

    // 4️⃣ Crear libro y exportar
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "Ventas.xlsx");
  };
  const setDefaultDate = (dateString) => {
    if (dateString) {
      const date = dateString.split("/");
      return new Date(date[2], date[1] - 1, date[0]);
    }
    return null;
  };

  const columnsNonMobile = [
    { field: "full_name", header: "Cliente", filter: true },
    { field: "email", header: "Email" },
    {
      field: "phone",
      header: "Teléfono",
      body: (rowData) => {
        const message = `Hola, ${rowData.full_name}
                        }, te escribo de "${business.name}".`;
        const whatsappUrl = `https://wa.me/${
          rowData.phone
        }?text=${encodeURIComponent(message)}`;

        return (
          <a href={whatsappUrl}>
            {rowData.phone} <FaWhatsapp color="#25D366" />
          </a>
        );
      },
    },
    {
      header: "",
      body: (rowData) => {
        return (
          <div
            className="table-actions"
            style={{
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <EditButton onClick={() => handleEditCustomer(rowData)} />
            <InfoButton onClick={() => handleViewCustomer(rowData)} />
            <DeleteButton
              onClick={() => {
                setShowDialog(true);
                const title = "Confirmar eliminación";
                const children = (
                  <div className={adminStyles.adminModalContent}>
                    <h2>¿Estás seguro de que deseas eliminar al cliente </h2>
                    <strong style={{ color: "var(--color-yellow)" }}>
                      {rowData.given_name} {rowData.family_name}
                    </strong>
                    ?
                    <p
                      style={{
                        textAlign: "justify",
                        border: "1px dashed var(--color-yellow)",
                        padding: "10px",
                      }}
                    >
                      Esta acción no se puede deshacer y se eliminarán todas las
                      transacciones asociadas a este cliente.
                    </p>
                    <div className="flex justify-content-end mt-3">
                      <YesNoButton
                        label="No"
                        onClick={() => setShowDialog(false)}
                      />
                      <YesNoButton
                        label="Sí"
                        onClick={() => {
                          setIsLoading(true);
                          setLoadingMessage("Eliminando cliente...");
                          setShowDialog(false);
                          dispatch(
                            DeleteCustomer(
                              rowData.customer_id,
                              showError,
                              showWarning,
                              showSuccess
                            )
                          );
                          setTimeout(() => {
                            setActiveTab("customers");
                            dispatch(GetCustomers(showError));
                            dispatch(customerActions.startCustomer());

                            setIsLoading(false);

                            setEditingCustomer(false);
                            setEditingTransaction(false);
                          }, 4500);
                        }}
                      />
                    </div>
                  </div>
                );
                setDialogContent({ title, children });
              }}
            />
            <AddTransactionButton
              onClick={() => {
                dispatch(customerActions.setCustomer({ customer: rowData }));
                setShowTransactionForm(true);
                setShowCustomerForm(false);
                setSelectedProduct({ code: "", name: "" });
                setSelectedPaymentMethod({ code: "", name: "" });
                setProductInfo({
                  product_id: "",
                  product_name: "",
                  quantity: "",
                  price: "",
                  payment_method: { currency: "" },
                });
                setTransactionInfo({
                  transaction_id: "",
                  payment_method: {
                    currency: "",
                  },
                });
              }}
            />
          </div>
        );
      },
    },
  ];
  const columnsMobile = [
    {
      header: "Cliente",
      filter: true,
      field: "full_name",
      body: (rowData) => {
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
                <span style={{ display: "block" }}>{rowData.email}</span>
              </div>
              <div className="table-actions">
                <div className="grid ">
                  <div className="col-4 m-2">
                    <EditButton onClick={() => handleEditCustomer(rowData)} />
                  </div>
                  <div className="col-4 m-2">
                    <InfoButton onClick={() => handleViewCustomer(rowData)} />
                  </div>
                  <div className="col-4 m-2">
                    <DeleteButton
                      onClick={() => {
                        setShowDialog(true);
                        const title = "Confirmar eliminación";
                        const children = (
                          <div className={adminStyles.adminModalContent}>
                            <h2>
                              ¿Estás seguro de que deseas eliminar al cliente{" "}
                            </h2>
                            <strong style={{ color: "var(--color-yellow)" }}>
                              {rowData.given_name} {rowData.family_name}
                            </strong>
                            ?
                            <p
                              style={{
                                textAlign: "justify",
                                border: "1px dashed var(--color-yellow)",
                                padding: "10px",
                              }}
                            >
                              Esta acción no se puede deshacer y se eliminarán
                              todas las transacciones asociadas a este cliente.
                            </p>
                            <div className="flex justify-content-end mt-3">
                              <YesNoButton
                                label="No"
                                onClick={() => setShowDialog(false)}
                              />
                              <YesNoButton
                                label="Sí"
                                onClick={() => {
                                  setIsLoading(true);
                                  setLoadingMessage("Eliminando cliente...");
                                  dispatch(
                                    DeleteCustomer(
                                      rowData.customer_id,
                                      showError,
                                      showWarning,
                                      showSuccess
                                    )
                                  );
                                  setTimeout(() => {
                                    setActiveTab("customers");
                                    dispatch(GetCustomers(showError));
                                    dispatch(customerActions.startCustomer());

                                    setIsLoading(false);
                                    setShowDialog(false);
                                    setEditingCustomer(false);
                                    setEditingTransaction(false);
                                  }, 4500);
                                }}
                              />
                            </div>
                          </div>
                        );
                        setDialogContent({ title, children });
                      }}
                    />
                  </div>
                  <div className="col-4 m-2">
                    <AddTransactionButton
                      onClick={() => {
                        dispatch(
                          customerActions.setCustomer({ customer: rowData })
                        );
                        setShowTransactionForm(true);
                        setShowCustomerForm(false);
                        setSelectedProduct({ code: "", name: "" });
                        setSelectedPaymentMethod({ code: "", name: "" });
                        setProductInfo({
                          product_id: "",
                          product_name: "",
                          quantity: "",
                          price: "",
                          payment_method: { currency: "" },
                        });
                        setTransactionInfo({
                          transaction_id: "",
                          payment_method: {
                            currency: "",
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </>
        );
      },
    },
  ];

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
      <div>
        <div className={adminStyles.adminHeader}>
          <h1>Gestión de Clientes</h1>
        </div>
        <Button
          label="Formulario Cliente"
          icon={<CiUser />}
          style={{
            padding: "4px",
            margin: "4px",
            color: "#ffffff",
            backgroundColor: "var(--color-navy)",
          }}
          onClick={() => {
            setShowCustomerForm(!showCustomerForm);
          }}
        />
        {showCustomerForm && (
          <div>
            <div className={adminStyles.adminCard}>
              <h2>{editingCustomer ? "Editar Cliente" : "Crear Cliente"}</h2>
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
                    {editingCustomer ? "Actualizar" : "Crear"} Cliente
                  </Button>
                  {editingCustomer && (
                    <Button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        dispatch(customerActions.startCustomer(false));
                        setEditingCustomer(false);
                        setShowCustomerForm(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
        {showTransactionForm && (
          <div className={adminStyles.adminCard}>
            <h2>
              {editingTransaction ? "Editar Transaccion" : "Nueva Transaccion"}
            </h2>
            <form
              onSubmit={
                editingTransaction
                  ? handleUpdateTransaction
                  : handleAddTransaction
              }
              className="grid"
            >
              <div className="col-12">
                <label className="form-label">
                  ID de Transacción:{" "}
                  <span style={{ color: "white" }}>
                    {productInfo.transaction_id}
                  </span>
                </label>
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <label className="form-label">
                  Producto:{" "}
                  <Dropdown
                    value={selectedProduct}
                    style={{ color: "black" }}
                    className="input"
                    onChange={(e) => {
                      setSelectedProduct(e.value);
                      let transaction = { ...transactionInfo };
                      transaction.transaction_id = productInfo.transaction_id;
                      setTransactionInfo(transaction);

                      if (e.value.price !== transactionInfo.price) {
                        const children = (
                          <div style={{ color: "#ffffff" }}>
                            El precio del producto ha cambiado a{" "}
                            <span style={{ color: "var(--color-yellow)" }}>
                              {getCurrencySymbol(
                                productInfo.payment_method.currency
                              )}{" "}
                              {formatted(e.value.price)}
                            </span>
                            . ¿Deseas actualizar el precio de la transacción?
                            <div className="flex justify-content-end mt-3">
                              <YesNoButton
                                label="No"
                                onClick={() => setShowDialog(false)}
                              />
                              <YesNoButton
                                label="Sí"
                                onClick={() => {
                                  transaction.price = e.value.price;
                                  setTransactionInfo(transaction);
                                  setShowDialog(false);
                                }}
                              />
                            </div>
                          </div>
                        );
                        const title = "Actualizar precio del producto";
                        setDialogContent({ title, children });
                        setShowDialog(true);
                      }
                    }}
                    options={products}
                    optionLabel="name"
                    placeholder="Selecciona un producto"
                  />
                </label>
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <label className="form-label">
                  Método de pago:{" "}
                  <Dropdown
                    value={selectedPaymentMethod}
                    className="input"
                    style={{ width: "100%" }}
                    onChange={(e) => {
                      setSelectedPaymentMethod(e.value);
                    }}
                    options={paymentMethods.map((method) => ({
                      name: method.payment_method_name,
                      code: method.payment_method_id,
                    }))}
                    optionLabel="name"
                    placeholder="Método de pago"
                  />
                </label>
              </div>

              <div className={isMobile ? "col-12" : "col-6"}>
                <label className="form-label">Fecha de entrega:</label>
                <Calendar
                  style={{ width: "100%", height: "60px" }}
                  inputStyle={{
                    height: "50px",
                    fontSize: "18px",
                    textAlign: "center",
                    // marginTop: "-10px",
                  }}
                  value={setDefaultDate(
                    transactionInfo.delivery_day !== ""
                      ? transactionInfo.delivery_day
                      : productInfo.delivery_day !== "" ||
                        productInfo.delivery_day != null
                      ? productInfo.delivery_day
                      : ""
                  )}
                  dateFormat="mm/dd/yy"
                  onChange={(e) => {
                    const transaction = { ...transactionInfo };
                    transaction.transaction_id = productInfo.transaction_id;
                    transaction.delivery_day = formatDate(e.value);
                    setTransactionInfo(transaction);
                  }}
                />
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <label className="form-label">
                  Precio *{" "}
                  {getCurrencySymbol(productInfo.payment_method.currency)}{" "}
                </label>
                <InputNumber
                  value={
                    transactionInfo.price
                      ? transactionInfo.price
                      : productInfo.price
                  }
                  onChange={(e) => {
                    const transaction = { ...transactionInfo };
                    transaction.transaction_id = productInfo.transaction_id;
                    transaction.price = e.value;
                    setTransactionInfo(transaction);
                  }}
                  min={1}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  placeholder="1850.00"
                />
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <label className="form-label">Cantidad</label>
                <InputNumber
                  value={productInfo.quantity}
                  onChange={(e) => {
                    const transaction = { ...transactionInfo };
                    transaction.transaction_id = productInfo.transaction_id;
                    transaction.quantity = e.value;
                    setTransactionInfo(transaction);
                  }}
                  min={1}
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  placeholder="1850.00"
                />
              </div>
              <div className={isMobile ? "col-12" : "col-6"}></div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <Button type="submit" className="btn btn-primary">
                  {editingTransaction ? "Actualizar" : "Crear"} Transacción
                </Button>
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <Button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    dispatch(customerActions.startCustomer(false));
                    setEditingCustomer(false);
                    setEditingTransaction(false);
                    setShowCustomerForm(false);
                    setShowTransactionForm(false);
                    setProductInfo({
                      product_id: "",
                      product_name: "",
                      quantity: "",
                      price: "",
                      payment_method: { currency: "" },
                    });
                    setTransactionInfo({
                      transaction_id: "",
                      payment_method: {
                        currency: "",
                      },
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div>
          <h2>
            Clientes Existentes{" "}
            <RefreshButton
              onClick={() => {
                setIsLoading(true);
                setLoadingMessage("Cargando clientes...");
                dispatch(GetCustomers(showError));
                setTimeout(() => {
                  setIsLoading(false);
                }, 2500);
              }}
            />
            {!showSellReport && (
              <Button
                outlined
                type="button"
                label="Reporte de Ventas"
                style={{
                  margin: "5px",
                  padding: "10px",
                  color: "var(--color-blue)",
                }}
                onClick={() => {
                  setShowSellReport(true);
                  setShowCustomerForm(false);
                }}
              />
            )}
            {showSellReport && (
              <>
                <Button
                  outlined
                  type="button"
                  label="Clientes"
                  style={{
                    margin: "5px",
                    padding: "10px",
                    color: "var(--color-blue)",
                  }}
                  onClick={() => {
                    setShowSellReport(false);
                    setShowCustomerForm(true);
                  }}
                />
                <Button
                  outlined
                  type="button"
                  label="Exportar a Excel"
                  icon={<FaRegFileExcel />}
                  style={{
                    margin: "5px",
                    padding: "10px",
                    color: "green",
                  }}
                  onClick={() => {
                    exportToExcel();
                  }}
                />
              </>
            )}
          </h2>
          {!showSellReport && (
            <>
              <DialogModal
                title={dialogContent?.title}
                width={"40vw"}
                visible={showDialog}
                onHide={() => setShowDialog(false)}
              >
                <p>{dialogContent?.children}</p>
              </DialogModal>

              <div>
                <DataTable
                  value={customers}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="customer_id"
                  filters={filters}
                  filterDisplay="row"
                  stripedRows
                  paginator
                  rows={25}
                  rowsPerPageOptions={[25, 50, 75, 100]}
                  expandedRowIcon={<FiMinus />}
                  collapsedRowIcon={<GoPlus />}
                  style={{ minWidth: "6rem" }}
                >
                  {!isMobile &&
                    columnsNonMobile.map((col) => (
                      <Column
                        key={col.field}
                        field={col.field}
                        header={col.header}
                        filter={col.filter || false}
                        style={{
                          minWidth: "10rem",
                          padding: "1rem",
                        }}
                        body={col.body}
                      ></Column>
                    ))}

                  {isMobile &&
                    columnsMobile.map((col) => (
                      <Column
                        key={col.field}
                        field={col.field}
                        header={col.header}
                        filter={col.filter || false}
                        style={{
                          minWidth: "10rem",
                          padding: "1rem",
                        }}
                        body={col.body}
                      ></Column>
                    ))}
                  <Column expander style={{ width: "3em" }} />
                </DataTable>
              </div>
            </>
          )}
          {showSellReport && (
            <SellReport
              customers={customers}
              getCurrencySymbol={getCurrencySymbol}
              formatted={formatted}
              getStatusStyle={getStatusStyle}
            />
          )}
        </div>
      </div>
    </>
  );
};
export default Customers;
