import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { GetCustomerTransaction } from "../store/customer-store/customer-actions";
import { useNotification } from "../components/UI/NotificationProvider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { formatted } from "../helpers/utils";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { Trash2 } from "lucide-react";

const PaymentValidation = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const { showError } = useNotification();
  const customer = useSelector((state) => state.customer.customer);
  const isMobile = window.innerWidth <= 480;

  const customer_id = params.customer_id;

  useEffect(() => {
    if (customer.customer_id !== customer_id) {
      dispatch(GetCustomerTransaction(customer_id, showError));
    }
  }, [customer_id, dispatch, showError]);
  console.log(customer);

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
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
            alt="Card"
            style={{ padding: "0rem" }}
          />
        </div>
      </div>
    </>
  );
  // const footer = (
  //     <>
  //         <Button label="Save" icon="pi pi-check" />
  //         <Button label="Cancel" severity="secondary" icon="pi pi-times" style={{ marginLeft: '0.5em' }} />
  //     </>
  // );

  return (
    <div className="card flex justify-content-center">
      <Card
        title="Detalle de sus compras"
        // footer={footer}
        header={header}
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: "10px",
        }}
      >
        <div>
          {!isMobile && (
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
                style={{ minWidth: "400px" }}
              >
                <Column
                  header={<div style={{ textAlign: "center", width: "200px" }}>Producto</div>}
                  field="product_name"
                  style={{padding: "1px", textAlign: "center" }}
                ></Column>
                <Column
                  header={<div style={{ textAlign: "center", width: "100px" }}>Cantidad</div>}
                  field="quantity"
                  style={{ width: "100px" , padding: "1px", textAlign: "center"}}
                ></Column>
                <Column
                  header={<div style={{ textAlign: "center", width: "150px" }}>Precio unitario</div>}
                  style={{ width: "150px", padding: "1px", textAlign: "center" }}
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
                  header={<div style={{ textAlign: "center", width: "150px" }}>Total</div>}
                  style={{ width: "150px", padding: "1px", textAlign: "center"}}
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
                  header={<div style={{ textAlign: "center", width: "200px" }}>Estado</div>}
                  style={{ width: "200px", padding: "1px", textAlign: "center" }}
                  body={(rowData) => {
                    let style = {};
                    switch (rowData.status) {
                      case "Completado":
                        style = { color: "green" };
                        break;
                      case "Pendiente de pago":
                        style = { color: "orange" };
                        break;
                      case "Rechazado":
                        style = { color: "red" };
                        break;
                      default:
                        style = { color: "black" };
                    }
                    return <span style={style}>{rowData.status}</span>;
                  }}
                ></Column>

                <Column
                  header={<div style={{ textAlign: "center", width: "150px" }}>Acciones</div>}
                  body={(rowData) => {
                    return (
                      <div className="flex justify-content-center">
                        <Button
                          icon={<Trash2 />}
                          outlined
                          style={{
                            height: "40px",
                            width: "40px",
                            color: "#e74c3c",
                            border: "none"
                          }}
                          onClick={() => {
                            console.log(rowData);
                          }}
                        />
                        <Button
                          icon={<Trash2 />}
                          outlined
                          style={{
                            height: "40px",
                            width: "40px",
                            color: "#e74c3c",
                            border: "none"
                          }}
                          onClick={() => {
                            console.log(rowData);
                          }}
                        />
                      </div>
                    );
                  }}
                ></Column>
              </DataTable>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
export default PaymentValidation;
