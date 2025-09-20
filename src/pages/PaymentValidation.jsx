import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { CreditCard, Info, Save, Upload, X } from "lucide-react";

import {
  CancelTransaction,
  GetCustomerTransaction,
  UploadTransactionFile,
} from "../store/customer-store/customer-actions";
import { useNotification } from "../components/UI/NotificationProvider";

import { formatted, getStatusStyle } from "../helpers/utils";
import DialogModal from "../components/DialogModal";
import { FileUpload } from "primereact/fileupload";
import Loading from "../components/UI/Loading";
import { InputTextarea } from "primereact/inputtextarea";

const PaymentValidation = () => {
  const customer = useSelector((state) => state.customer.customer);
  const params = useParams();
  const dispatch = useDispatch();
  const { showError, showSuccess, showWarning } = useNotification();
  const fileUploadRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDialogCancel, setShowDialogCancel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const isMobile = window.innerWidth <= 480;

  const customer_id = params.customer_id;

  useEffect(() => {
    if (customer.customer_id !== customer_id) {
      dispatch(GetCustomerTransaction(customer_id, showError));
    }
  }, [customer.customer_id, customer_id, dispatch, showError]);

  const header = (
    <>
      <div
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: "1rem",
          marginTop: "1rem",
          border: "4px var(--color-navy) solid",
          borderRadius: "10px",
          width: "100%",
        }}
      >
        <div
          style={{
            padding: "0rem",
            width: "300px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Image
            src={
              customer.business_logo_url !== ""
                ? customer.business_logo_url
                : "https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
            }
            alt="Card"
            style={{ padding: "0rem" }}
          />
        </div>
      </div>
    </>
  );

  const fileHandler = (e) => {
    setUploadedFile(e.files[0]);
  };
  const chooseOptions = {
    icon: <Upload />,
    label: "Subir archivo",
    className: "custom-choose-btn p-button-rounded p-button-outlined p-2",
  };

  const handleInfo = (rowData) => {
    setTransaction(rowData);
    setShowDialog(true);
  };

  const actionsButtons = (rowData) => {
    return (
      <div className="flex justify-content-center">
        {rowData.status !== "Cancelada" && (
          <>
            <Button
              icon={<Info />}
              outlined
              tooltip="Ver información"
              style={{
                height: "40px",
                width: "40px",
                color: "#2980b9",
                border: "none",
              }}
              onClick={() => {
                handleInfo(rowData);
              }}
            />
            <Button
              icon={<CreditCard />}
              disabled={rowData.payment_method.payment_type === "bank_transfer"}
              visible={rowData.payment_method.payment_type !== "bank_transfer"}
              outlined
              style={{
                height: "40px",
                width: "40px",
                color: "green",
                border: "none",
              }}
              onClick={() => {
                dispatch(
                  CancelTransaction(
                    customer.customer_id,
                    rowData.transaction_id,
                    showError,
                    showWarning,
                    showSuccess
                  )
                );
              }}
            />
            <Button
              icon={<X />}
              outlined
              tooltip="Cancelar transacción"
              style={{
                height: "40px",
                width: "40px",
                color: "#e74c3c",
                border: "none",
              }}
              onClick={() => {
                setTransaction(rowData);
                setShowDialogCancel(true);
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
      <DialogModal
        title={"Información del producto"}
        style={{
          backgroundColor: "var(--color-navy)",
          width: isMobile ? "420px" : "40vw",
        }}
        visible={showDialog}
        onHide={() => setShowDialog(false)}
      >
        <div
          style={{ textAlign: "left", overflowX: "hidden", maxWidth: "800px" }}
        >
          <div
            className=" p-3 "
            style={{
              textAlign: "left",
              backgroundColor: "var(--color-navy)",
              borderRadius: "8px",
              marginTop: "00px",
              width: isMobile ? "400px" : "100%",
            }}
          >
            <div className="grid">
              <div className={isMobile ? "col-12" : "col-6"}>
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Producto:
                </span>{" "}
                <span
                  style={{ fontSize: "1.2rem", color: "var(--color-yellow)" }}
                >
                  {transaction !== null ? transaction.product_name : ""}
                </span>
              </div>

              <div className={isMobile ? "col-12" : "col-6"}>
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Cantidad:
                </span>{" "}
                <span
                  style={{ fontSize: "1.2rem", color: "var(--color-yellow)" }}
                >
                  {transaction !== null ? transaction.quantity : ""}
                </span>
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Precio unitario:
                </span>{" "}
                <span
                  style={{ fontSize: "1.2rem", color: "var(--color-yellow)" }}
                >
                  {transaction !== null
                    ? transaction.payment_method.currency
                    : ""}{" "}
                  {formatted(transaction !== null ? transaction.price : "")}
                </span>
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Total:
                </span>{" "}
                <span
                  style={{ fontSize: "1.2rem", color: "var(--color-yellow)" }}
                >
                  {transaction !== null
                    ? transaction.payment_method.currency
                    : ""}{" "}
                  {formatted(transaction !== null ? transaction.price : "")}
                </span>
              </div>
              <div className={isMobile ? "col-12" : "col-6"}>
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Estado:
                </span>{" "}
                <span
                  style={getStatusStyle(
                    transaction !== null ? transaction.status : ""
                  )}
                >
                  {transaction !== null ? transaction.status : ""}
                </span>
              </div>
              <div className="col-12">
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Método de pago:
                </span>{" "}
                <span
                  style={{ fontSize: "1.2rem", color: "var(--color-yellow)" }}
                >
                  {transaction !== null &&
                    transaction.payment_method.payment_method_name}
                </span>
                {transaction !== null &&
                  transaction.payment_method.payment_type ===
                    "bank_transfer" && (
                    <div
                      className="grid"
                      style={{
                        gap: "1rem",
                        border: "1px solid #ffffff",
                        padding: "1rem",
                        marginTop: "10px",

                        borderRadius: "8px",
                      }}
                    >
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Banco:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.bank_name
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Número de cuenta:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.account_number
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Tipo de cuenta:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.account_type ===
                              "checking"
                              ? "Corriente"
                              : transaction.payment_method.account_type ===
                                "savings"
                              ? "Ahorros"
                              : transaction.payment_method.account_type
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Moneda:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.currency
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Cuenta Estandar:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.standard_account
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Swift:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.swift
                            : ""}
                        </span>
                      </div>
                      <div className={isMobile ? "col-12" : "col"}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Código de ruta:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.routing_number
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Titular de la cuenta:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.owner_name
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Documento del titular:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.owner_document
                            : ""}
                        </span>
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-5"}`}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                          Email del titular:
                        </span>{" "}
                        <span
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--color-yellow)",
                          }}
                        >
                          {transaction !== null
                            ? transaction.payment_method.owner_email
                            : ""}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
              <div className={isMobile ? "col-12" : "col"}>
                <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                  Comprobante de pago:
                </span>{" "}
                <FileUpload
                  ref={fileUploadRef}
                  chooseOptions={chooseOptions}
                  mode="basic"
                  accept="image/*"
                  maxFileSize={1000000}
                  onSelect={(e) => {
                    fileHandler(e);
                  }}
                />
              </div>
              <div className="col-12">
                {uploadedFile && (
                  <Button
                    label="Subir comprobante"
                    icon={<Save />}
                    raised
                    className="btn btn-primary"
                    onClick={() => {
                      setLoadingMessage("Subiendo comprobante...");
                      setIsLoading(true);
                      setShowDialog(false);
                      dispatch(
                        UploadTransactionFile(
                          customer.customer_id,
                          transaction.transaction_id,
                          uploadedFile,
                          showError,
                          showWarning,
                          showSuccess
                        )
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogModal>
      <DialogModal
        visible={showDialogCancel}
        onHide={() => setShowDialogCancel(false)}
      >
        <div style={{ textAlign: "left", padding: "5px", overflowX: "hidden" }}>
          <div className="dialog-title ">
            <div className="grid">
              <div className="col"></div>
              <div className="col-9 text-center">
                <span style={{ color: "var(--color-yellow)" }}>
                  Razón de la cancelación
                </span>
              </div>
              <div className="col justify-content-end align-items-end flex">
                <Button
                  icon={<X />}
                  outlined
                  rounded
                  raised
                  style={{
                    height: "40px",
                    width: "40px",
                    border: "1px solid ",
                    color: "var(--color-sea)",
                  }}
                  onClick={() => setShowDialogCancel(false)}
                />
              </div>
            </div>
          </div>
          <div
            className="flex flex-column gap-2 p-3"
            style={{
              textAlign: "left",
              borderRadius: "8px",
            }}
          >
            <div className="grid flex gap-2">
              <div className={isMobile ? "col-12" : "col"}>
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
                label="cancelar"
                className="btn btn-outline"
                raised
                style={{ width: "100px", height: "40px", margin: "10px" }}
                onClick={() => {
                  setLoadingMessage("Cancelando orden...");
                  setIsLoading(true);
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
                  setLoadingMessage("Cancelando orden...");

                  setIsLoading(true);

                  dispatch(
                    CancelTransaction(
                      customer.customer_id,
                      transaction.transaction_id,
                      cancellationReason,
                      showError,
                      showWarning,
                      showSuccess
                    )
                  );
                  setTimeout(() => {
                    dispatch(GetCustomerTransaction(customer_id, showError));
                    setIsLoading(false);
                    setShowDialogCancel(false);
                    setCancellationReason("");
                  }, 4500);
                }}
              />
            </div>
          </div>
        </div>
      </DialogModal>
      <div className="card flex justify-content-center">
        {!isMobile && (
          <Card
            title="Detalle de sus compras"
            header={header}
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              borderRadius: "10px",
            }}
          >
            <div>
              <>
                <div className="grid">
                  <div className="col-2">
                    <label htmlFor="name" className="block mb-2 font-bold">
                      Cliente:
                    </label>
                  </div>
                  <div className="col-4">
                    {customer.given_name} {customer.family_name}
                  </div>
                  <div className="col-2">
                    <label htmlFor="name" className="block mb-2 font-bold">
                      Correo:
                    </label>
                  </div>
                  <div className="col-4">{customer.email}</div>
                </div>

                <DataTable
                  value={customer.transactions}
                  showGridlines
                  stripedRows
                >
                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "200px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Producto
                      </div>
                    }
                    field="product_name"
                    style={{ padding: "1px", textAlign: "center" }}
                  ></Column>
                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "100px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Cantidad
                      </div>
                    }
                    field="quantity"
                    style={{
                      width: "100px",
                      padding: "1px",
                      textAlign: "center",
                    }}
                  ></Column>
                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "150px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Precio unitario
                      </div>
                    }
                    style={{
                      width: "150px",
                      padding: "1px",
                      textAlign: "center",
                    }}
                    body={(rowData) => {
                      return (
                        <span>
                          {rowData.payment_method.currency}{" "}
                          {formatted(rowData.price)}
                        </span>
                      );
                    }}
                  ></Column>
                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "150px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Total
                      </div>
                    }
                    style={{
                      width: "150px",
                      padding: "1px",
                      textAlign: "center",
                    }}
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
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "200px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Estado
                      </div>
                    }
                    style={{
                      width: "200px",
                      padding: "1px",
                      textAlign: "center",
                    }}
                    body={(rowData) => {
                      return (
                        <span style={getStatusStyle(rowData.status)}>
                          {rowData.status}
                        </span>
                      );
                    }}
                  ></Column>

                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "150px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Acciones
                      </div>
                    }
                    body={(rowData) => {
                      return actionsButtons(rowData);
                    }}
                  ></Column>
                </DataTable>
              </>
            </div>
          </Card>
        )}
        {isMobile && (
          <Card
            title="Detalle de sus compras"
            header={header}
            style={{
              marginTop: "0rem",
              marginBottom: "2rem",
              padding: "1rem",
              borderRadius: "10px",
              width: "96vw",
            }}
          >
            <div>
              <>
                <div className="grid" style={{ marginTop: "1rem" }}>
                  <div className="col-3">
                    <label htmlFor="name" className="block mb-2 font-bold">
                      Cliente:
                    </label>
                  </div>
                  <div className="col-9">
                    {customer.given_name} {customer.family_name}
                  </div>
                  <div className="col-3">
                    <label htmlFor="name" className="block mb-2 font-bold">
                      Correo:
                    </label>
                  </div>
                  <div className="col-9">{customer.email}</div>
                </div>

                <DataTable
                  value={customer.transactions}
                  showGridlines
                  stripedRows
                >
                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "200px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Producto
                      </div>
                    }
                    field="product_name"
                    style={{ padding: "1px", textAlign: "center" }}
                  ></Column>

                  <Column
                    header={
                      <div
                        style={{
                          textAlign: "center",
                          width: "150px",
                          backgroundColor: "var(--color-navy)",
                          color: "white",
                          fontWeight: "bold",
                          padding: "5px",
                        }}
                      >
                        Acciones
                      </div>
                    }
                    body={(rowData) => {
                      return actionsButtons(rowData);
                    }}
                  ></Column>
                </DataTable>
              </>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
export default PaymentValidation;
