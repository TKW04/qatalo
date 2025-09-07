import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useNotification } from "../UI/NotificationProvider";
import { InputText } from "primereact/inputtext";

import {
  GetPaymentMethods,
  CreatePaymentMethod,
  DeletePaymentMethod,
  UpdatePaymentMethod,
} from "../../store/paymentMethod-store/paymentMethod-actions";
import { paymentMethodActions } from "../../store/paymentMethod-store/paymentMethod-slice";
import Loading from "../UI/Loading";
import DialogModal from "../DialogModal";
import { Button } from "primereact/button";
import { Info, PencilIcon, Trash2, X } from "lucide-react";
import { Dropdown } from "primereact/dropdown";
import { getTokenInfo } from "../../helpers/token";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

let once = true;
const PaymentMethods = ({ setActiveTab }) => {
  const isMobile = window.innerWidth <= 480;
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business);
  const paymentMethod = useSelector(
    (state) => state.paymentMethod.paymentMethod
  );
  const paymentMethods = useSelector(
    (state) => state.paymentMethod.paymentMethods
  );

  const [editingPaymentMethod, setEditingPaymentMethod] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [paymentMethodErrors, setPaymentMethodErrors] = useState({});
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "DOP",
    name: "Peso dominicano",
    symbol: "RD$",
  });

  const [dialogContent, setDialogContent] = useState({
    title: "Eliminar Método de Pago",
    children: null,
    footer: null,
  });

  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();

  const paymentTypes = [
    { name: "Transferencia Bancaria", code: "bank_transfer" },
    { name: "Link de pago", code: "payment_link" },
  ];
  const accountTypeOptions = [
    { name: "Ahorros", code: "savings" },
    { name: "Corriente", code: "current" },
  ];
  const currencies = [
    { code: "USD", name: "Dólar estadounidense", symbol: "$" },
    { code: "DOP", name: "Peso dominicano", symbol: "RD$" },
  ];

  useEffect(() => {
    if (paymentMethods.length === 0 && once) {
      setIsLoading(true);
      setLoadingMessage("Cargando métodos de pago...");
      dispatch(GetPaymentMethods(showError));
      dispatch(paymentMethodActions.startPaymentMethod());
      once = false;

      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [business.business_id, dispatch, showError, paymentMethods, auth.email]);

  useEffect(() => {
    if (
      selectedPaymentType &&
      selectedPaymentType.code !== "" &&
      paymentMethod.payment_type === ""
    ) {
      dispatch(
        paymentMethodActions.modifyPropertyValue({
          id: "payment_type",
          value: selectedPaymentType.code,
        })
      );
    }
  }, [dispatch, paymentMethod, selectedPaymentType]);

  useEffect(() => {
    if (business.business_id && paymentMethod.business_id === "") {
      dispatch(
        paymentMethodActions.modifyPropertyValue({
          id: "business_id",
          value: business.business_id,
        })
      );
    }
  }, [dispatch, paymentMethod, business]);

  useEffect(() => {
    if (auth.email && paymentMethod.owner_email === "") {
      dispatch(
        paymentMethodActions.modifyPropertyValue({
          id: "owner_email",
          value: auth.email,
        })
      );
    }
  }, [dispatch, paymentMethod, auth]);

  const validatePaymentMethod = (data) => {
    const errors = {};

    if (!data.payment_type)
      errors.payment_type = "El tipo de pago es requerido";
    if (data.payment_type === "bank_transfer") {
      if (!data.account_number)
        errors.account_number = "El número de cuenta es requerido";
      if (!data.account_type)
        errors.account_type = "El tipo de cuenta es requerido";
      if (!data.bank_name)
        errors.bank_name = "El nombre del banco es requerido";
      if (!data.owner_name)
        errors.owner_name = "El nombre del propietario es requerido";
      if (!data.owner_document)
        errors.owner_document = "El documento del propietario es requerido";
      if (!data.owner_email)
        errors.owner_email = "El email del propietario es requerido";
      if (!data.currency) errors.currency = "La moneda es requerida";
    } else {
      if (!data.payment_link)
        errors.payment_link = "El enlace de pago es requerido";
    }

    return errors;
  };

  const handlePaymentMethodSubmit = (e) => {
    e.preventDefault();

    const errors = validatePaymentMethod(paymentMethod);
    setPaymentMethodErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      if (paymentMethod.payment_method_id) {
        setLoadingMessage("Actualizando método de pago...");
        dispatch(
          UpdatePaymentMethod(
            paymentMethod,
            showError,
            showWarning,
            showSuccess
          )
        );
      } else {
        setLoadingMessage("Creando método de pago...");
        dispatch(
          CreatePaymentMethod(
            paymentMethod,
            showError,
            showWarning,
            showSuccess
          )
        );
      }
      setTimeout(() => {
        setActiveTab("paymentMethods");
        dispatch(GetPaymentMethods(showError));
        dispatch(paymentMethodActions.startPaymentMethod());
        setEditingPaymentMethod(false);
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleEditPaymentMethod = (paymentMethod) => {
    setSelectedPaymentType({
      code: paymentMethod.payment_type,
      name: getPaymentMethodName(paymentMethod.payment_type),
    });
    setSelectedCurrency({
      code: paymentMethod.currency,
      name: getCurrencyName(paymentMethod.currency),
      symbol: getCurrencySymbol(paymentMethod.currency),
    });
    setSelectedAccountType({
      code: paymentMethod.account_type,
      name: getAccountTypeName(paymentMethod.account_type),
    });

    dispatch(
      paymentMethodActions.setPaymentMethod({ paymentMethod: paymentMethod })
    );
    setEditingPaymentMethod(true);
  };

  const handleDeletePaymentMethod = (paymentMethod) => {
    const title = "Eliminar Método de Pago";
    const children = (
      <div>¿Estás seguro de que deseas eliminar este método de pago?</div>
    );
    const footer = (
      <div>
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
          onClick={() => {
            setIsLoading(true);
            setLoadingMessage("Eliminando método de pago...");
            dispatch(
              DeletePaymentMethod(
                paymentMethod.payment_method_id,
                showError,
                showWarning,
                showSuccess
              )
            );

            setTimeout(() => {
              setActiveTab("paymentMethods");
              dispatch(GetPaymentMethods(showError));
              dispatch(paymentMethodActions.startPaymentMethod());
              setEditingPaymentMethod(false);
              setIsLoading(false);
              setShowDialog(false);
            }, 1500);
          }}
          style={{ width: "100px", margin: "2px" }}
        />
      </div>
    );
    setDialogContent({ title, children, footer });
    setShowDialog(true);
  };

  const handleViewPaymentMethod = (paymentMethodInfo) => {
    const title = "Detalles del Producto";
    const children = (
      <div className="admin-card" style={{ textAlign: "left", width: "100%" }}>
        <label className="form-label">
          Método:{" "}
          <span style={{ fontWeight: "bold" }}>
            {getPaymentMethodName(paymentMethodInfo.payment_type)}
          </span>
        </label>
        {paymentMethodInfo.payment_type === "bank_transfer" && (
          <>
            <label className="form-label">
              Nombre:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.owner_name}
              </span>
            </label>
            <label className="form-label">
              Documento:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.owner_document}
              </span>
            </label>
            <label className="form-label">
              Email:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.owner_email}
              </span>
            </label>
            <label className="form-label">
              Tipo de cuenta:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.account_type === "savings"
                  ? "Ahorros"
                  : "Corriente"}
              </span>
            </label>
            <label className="form-label">
              Moneda:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.currency}
              </span>
            </label>
            <label className="form-label">
              Nombre del banco:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.bank_name}
              </span>
            </label>
            <label className="form-label">
              SWIFT:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.swift}
              </span>
            </label>
            <label className="form-label">
              Cuenta estándar:{" "}
              <span style={{ fontWeight: "bold" }}>
                {paymentMethodInfo.standard_account}
              </span>
            </label>
          </>
        )}
        {paymentMethodInfo.payment_type === "payment_link" && (
          <label className="form-label">
            Enlace de pago:{" "}
            <span style={{ fontWeight: "bold" }}>
              {paymentMethodInfo.payment_link}
            </span>
          </label>
        )}
      </div>
    );
    const footer = null;
    setDialogContent({ title, children, footer });
    setShowDialog(true);
  };

  const getPaymentMethodName = (paymentType) => {
    const paymentMethod = paymentTypes.find((pm) => pm.code === paymentType);
    return paymentMethod ? paymentMethod.name : "";
  };
  const getCurrencyName = (currencyCode) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.name : "";
  };
  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : "";
  };
  const getAccountTypeName = (accountTypeCode) => {
    const accountType = accountTypeOptions.find(
      (at) => at.code === accountTypeCode
    );
    return accountType ? accountType.name : "";
  };

  return (
    <>
      <DialogModal
        title={dialogContent.title}
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        footer={dialogContent.footer}
      >
        <p>{dialogContent.children}</p>
      </DialogModal>
      <Loading message={loadingMessage} visible={isLoading} />
      <div>
        <div className="admin-header">
          <h1>Gestión de Métodos de Pago</h1>
          <p>Crea métodos de pago para tu negocio</p>
        </div>

        <div className="admin-card">
          <h2>
            {editingPaymentMethod
              ? "Editar Método de Pago"
              : "Nuevo Método de Pago"}
          </h2>
          <form onSubmit={handlePaymentMethodSubmit}>
            <div className="form-group">
              <label className="form-label">Método de Pago *</label>
              <Dropdown
                value={selectedPaymentType}
                className={`input ${
                  paymentMethodErrors.payment_type ? "error" : ""
                }`}
                onChange={(e) => {
                  setSelectedPaymentType(e.value);
                  dispatch(
                    paymentMethodActions.modifyPropertyValue({
                      id: "payment_type",
                      value: e.value.code,
                    })
                  );
                }}
                options={paymentTypes}
                optionLabel="name"
                placeholder="Seleccionar método de pago"
              />
              {paymentMethodErrors.payment_type && (
                <div className="error-message">
                  {paymentMethodErrors.payment_type}
                </div>
              )}
            </div>
            {selectedPaymentType &&
              selectedPaymentType.code === "bank_transfer" && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Número de Cuenta *</label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.account_number}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "account_number",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="123456789"
                      />
                      {paymentMethodErrors.account_number && (
                        <div className="error-message">
                          {paymentMethodErrors.account_number}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nombre del Banco *</label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.bank_name}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "bank_name",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="Banco XYZ"
                      />
                      {paymentMethodErrors.bank_name && (
                        <div className="error-message">
                          {paymentMethodErrors.bank_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Nombre del Propietario *
                      </label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.owner_name}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "owner_name",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="Juan Pérez"
                      />
                      {paymentMethodErrors.owner_name && (
                        <div className="error-message">
                          {paymentMethodErrors.owner_name}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Número de Documento *
                      </label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.owner_document}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "owner_document",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="12345678789"
                      />
                      {paymentMethodErrors.owner_document && (
                        <div className="error-message">
                          {paymentMethodErrors.owner_document}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Email del Propietario *
                      </label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.owner_email}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "owner_email",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="juan@example.com"
                      />
                      {paymentMethodErrors.owner_email && (
                        <div className="error-message">
                          {paymentMethodErrors.owner_email}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de Cuenta *</label>
                      <Dropdown
                        value={selectedAccountType}
                        className={`input ${
                          paymentMethodErrors.account_type ? "error" : ""
                        }`}
                        onChange={(e) => {
                          setSelectedAccountType(e.value);
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "account_type",
                              value: e.value.code,
                            })
                          );
                        }}
                        options={accountTypeOptions}
                        optionLabel="name"
                        placeholder="Seleccionar tipo de cuenta"
                      />
                      {paymentMethodErrors.account_type && (
                        <div className="error-message">
                          {paymentMethodErrors.account_type}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Moneda *</label>
                      <Dropdown
                        value={selectedCurrency}
                        className={`input ${
                          paymentMethodErrors.currency ? "error" : ""
                        }`}
                        onChange={(e) => {
                          setSelectedCurrency(e.value);
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "currency",
                              value: e.value.code,
                            })
                          );
                        }}
                        options={currencies}
                        optionLabel="name"
                        placeholder="Seleccionar moneda"
                      />
                      {paymentMethodErrors.currency && (
                        <div className="error-message">
                          {paymentMethodErrors.currency}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Swift</label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.swift}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "swift",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="BCPPDOSDXXX"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cuenta Estandar</label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.standard_account}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "standard_account",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="DO343CPP00000000032323443"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Número de Ruta (Routing Number)
                      </label>
                      <InputText
                        type="text"
                        className="input"
                        value={paymentMethod.routing_number}
                        onChange={(e) => {
                          dispatch(
                            paymentMethodActions.modifyPropertyValue({
                              id: "routing_number",
                              value: e.target.value,
                            })
                          );
                        }}
                        placeholder="DO343CPP00000000032323443"
                      />
                    </div>
                  </div>
                </>
              )}
            {selectedPaymentType &&
              selectedPaymentType.code === "payment_link" && (
                <div className="form-group">
                  <label className="form-label">Link de pago *</label>
                  <InputText
                    type="text"
                    className={`input ${
                      paymentMethodErrors.payment_link ? "error" : ""
                    }`}
                    value={paymentMethod.payment_link}
                    onChange={(e) => {
                      dispatch(
                        paymentMethodActions.modifyPropertyValue({
                          id: "payment_link",
                          value: e.target.value,
                        })
                      );
                    }}
                    placeholder="https://example.com/payment-link"
                  />
                  {paymentMethodErrors.payment_link && (
                    <div className="error-message">
                      {paymentMethodErrors.payment_link}
                    </div>
                  )}
                </div>
              )}

            <div className="form-actions">
              <Button type="submit" className="btn btn-primary">
                {editingPaymentMethod ? "Actualizar" : "Crear"} Método de Pago
              </Button>
              {editingPaymentMethod && (
                <Button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    dispatch(paymentMethodActions.startPaymentMethod());
                    setEditingPaymentMethod(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h2>Métodos de Pago Existentes</h2>
          {paymentMethods.length === 0 ? (
            <p>No hay métodos de pago creados aún.</p>
          ) : (
            <>
              {!isMobile && (
                <div className="card">
                  <DataTable
                    value={paymentMethods}
                    dataKey="payment_method_id"
                    tableStyle={{ minWidth: "60rem" }}
                  >
                    <Column
                      header="Método"
                      body={(rowData) => {
                        return getPaymentMethodName(rowData.payment_type);
                      }}
                    ></Column>
                    <Column
                      header="Link de pago"
                      body={(rowData) => {
                        return (
                          <>
                            {rowData.payment_type === "payment_link"
                              ? rowData.payment_link
                              : "N/A"}
                          </>
                        );
                      }}
                    ></Column>
                    <Column
                      header="Número de cuenta"
                      body={(rowData) => {
                        return (
                          <>
                            {rowData.payment_type === "bank_transfer"
                              ? rowData.account_number
                              : "N/A"}
                          </>
                        );
                      }}
                    ></Column>
                    <Column
                      field="bank_name"
                      header="Nombre del banco"
                    ></Column>

                    <Column
                      header="Acciones"
                      body={(rowData) => {
                        return (
                          <div className="table-actions">
                            <Button
                              icon={<PencilIcon />}
                              outlined
                              style={{
                                height: "40px",
                                width: "40px",
                                color: "var(--color-blue)",
                                borderColor: "var(--color-blue)",
                              }}
                              onClick={() => handleEditPaymentMethod(rowData)}
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
                              onClick={() => handleDeletePaymentMethod(rowData)}
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
                              onClick={() => handleViewPaymentMethod(rowData)}
                            />
                          </div>
                        );
                      }}
                    ></Column>
                  </DataTable>
                </div>
              )}
              {isMobile && (
                <div className="card">
                  <DataTable
                    value={paymentMethods}
                    dataKey="product_id"
                    tableStyle={{ minWidth: "6rem" }}
                  >
                    <Column
                      header="Método"
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
                                  {getPaymentMethodName(rowData)}
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
                                      color: "var(--color-blue)",
                                      borderColor: "var(--color-blue)",
                                    }}
                                    onClick={() =>
                                      handleEditPaymentMethod(rowData)
                                    }
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
                                      handleDeletePaymentMethod(rowData)
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
                                    onClick={() =>
                                      handleViewPaymentMethod(rowData)
                                    }
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

export default PaymentMethods;
