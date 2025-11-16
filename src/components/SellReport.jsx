import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";
import { formatTextDateShort } from "../helpers/utils";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
// import * as XLSX from "xlsx-js-style";
// import { saveAs } from "file-saver";

const SellReport = ({
  customers,
  getCurrencySymbol,
  formatted,
  getStatusStyle,
}) => {
  const [customersData, setCustomersData] = useState([]);
  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    full_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    product_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    delivery_day: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    const createObjects = () => {
      const data = [];
      customers.forEach((customer) => {
        customer.transactions.forEach((transaction) => {
          data.push({
            full_name: customer.full_name,
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
                : transaction.status === "Entregada"
                ? "Orden Entregada"
                : "Cancelada",
          });
        });
      });
      setCustomersData(data);
    };
    if (customersData.length === 0) createObjects();
  }, [customers, customersData]);

  const getTotal = () => {
    let total = 0;
    let currency = "";
    for (let customer of customersData) {
      total += customer.total;
      currency = customer.currency;
    }

    return getCurrencySymbol(currency) + " " + formatted(total);
  };
  const getTotalReceived = () => {
    let total = 0;
    let currency = "";
    for (let customer of customersData) {
      if (
        customer.status === "Pago Completado" ||
        customer.status === "Orden Entregada"
      ) {
        total += customer.total;
        currency = customer.currency;
      }
    }

    return getCurrencySymbol(currency) + " " + formatted(total);
  };

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={4}
          footerStyle={{ textAlign: "right", paddingRight: "15px" }}
        />
        <Column style={{ textAlign: "center" }} footer={getTotal} />

        <Column
          colSpan={2}
          style={{ textAlign: "center", color: "green" }}
          footer={"Recibido: " + getTotalReceived()}
        />
      </Row>
    </ColumnGroup>
  );
  let isAscending = true; // variable global o externa para recordar el estado

  const toggleSortByDate = (rows) => {
    const sorted = [...rows.data].sort((a, b) => {
      const [dayA, monthA, yearA] = a.delivery_day.split("/").map(Number);
      const [dayB, monthB, yearB] = b.delivery_day.split("/").map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return isAscending ? dateA - dateB : dateB - dateA;
    });

    // Alternar el estado para la próxima llamada
    isAscending = !isAscending;

    return sorted;
  };
  const totalByProduct = () => {
    let totals = [];
    customersData.forEach((item) => {
      const productExist = totals.find(
        (prod) => prod.product_name === item.product_name
      );
      if (!productExist) {
        console.log("Adding new product:", item.quantity);
        totals.push({
          product_name: item.product_name,
          total: item.total,
          quantity: parseInt(item.quantity),
        });
      } else {
        console.log("Updating product:", item.quantity);
        productExist.total += item.total;
        productExist.quantity += parseInt(item.quantity);
      }
    });

    return totals;
  };
  const showTotalsByProduct = () => {
    const totals = totalByProduct();
    console.log(totals);
    return (
      <div style={{ marginBottom: "20px" }}>
        <h3>Totales por Producto:</h3>
        {totals.map((product) => (
          <div key={product.product_name} style={{ fontWeight: "bold" }}>
            {product.product_name}:{" "}
            <span>
              {" "}
              Cantidad:{" "}
              <span style={{ fontWeight: "normal" }}>
                {product.quantity}
              </span>,{" "}
            </span>
            Total:{" "}
            <span style={{ fontWeight: "normal" }}>
              {getCurrencySymbol(customersData[0]?.currency || "")}{" "}
              {formatted(product.total)}
            </span>
          </div>
        ))}
      </div>
    );
    // return <span style={{ whiteSpace: "pre-line" }}>{message}</span>;
  };

  return (
    <div>
      {showTotalsByProduct()}
      <DataTable
        value={customersData}
        tableStyle={{ minWidth: "50rem" }}
        stripedRows
        filters={filters}
        filterDisplay="row"
        footerColumnGroup={footerGroup}
        paginator
        rows={25}
        rowsPerPageOptions={[25, 50, 75, 100]}
        
      >
        <Column
          header={<span style={{ margin: "10px"}}>Cliente </span>}
          style={{ padding: "10px", width: "280px" }}
          sortable
          filter
          filterPlaceholder="Buscar por nombre"
          field="full_name"
        />
        <Column
          header={<span style={{ margin: "10px" }}>Producto </span>}
          style={{ padding: "10px", width: "20%" }}
          field="product_name"
          sortable
          filter
          filterPlaceholder="Buscar producto"
        />
        <Column
          field="quantity"
          header={<span style={{ margin: "10px" }}>Cant </span>}
          sortable
          style={{
            textAlign: "center",
            width: "80px",
          }}
        />
        <Column
          header={<span style={{ margin: "10px" }}>Precio </span>}
          field="price"
          sortable
          style={{ width: "10%" }}
          body={(rowData) => {
            return (
              <span>
                {getCurrencySymbol(rowData.currency)} {formatted(rowData.price)}
              </span>
            );
          }}
        />
        <Column
          header={<span style={{ margin: "10px" }}>Total </span>}
          sortable
          field="total"
          style={{ width: "15%", textAlign: "center" }}
          body={(rowData) => {
            return (
              <span>
                {getCurrencySymbol(rowData.currency)} {formatted(rowData.total)}
              </span>
            );
          }}
        />
        <Column
          field="delivery_day"
          sortable
          sortFunction={(rows) => {
            return toggleSortByDate(rows);
          }}
          filter
          filterPlaceholder="Buscar fecha"
          style={{ width: "15%" }}
          header={<span style={{ margin: "10px" }}>Fecha de entrega</span>}
        />
        <Column
          header={<span style={{ margin: "10px" }}>Estado </span>}
          style={{ width: "15%" }}
          sortable
          field="status"
          filter
          filterPlaceholder="Buscar estado"
          body={(rowData) => {
            return (
              <span style={getStatusStyle(rowData.status)}>
                {rowData.status}
              </span>
            );
          }}
        />
      </DataTable>
    </div>
  );
};
export default SellReport;
