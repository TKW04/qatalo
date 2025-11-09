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
      if (customer.status === "Pago Completado") {
        total += customer.total;
        currency = customer.currency;
      }
    }

    return getCurrencySymbol(currency) + " " + formatted(total);
  };

//   const exportToExcel = () => {
//     // 1️⃣ Crear la hoja
//     const header = ["Nombre completo", "Producto", "Cantidad", "Precio", "Total", "Fecha de entrega", "Estado"];
//     const wsData = [header, ...customersData.map(item => [item.full_name, item.product_name, item.quantity, item.price, item.total, item.delivery_day, item.status])];
//     const ws = XLSX.utils.aoa_to_sheet(wsData);

//     // 2️⃣ Aplicar estilos de cabecera
//     const headerStyle = {
//       font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
//       alignment: { horizontal: "center", vertical: "center" },
//       fill: { fgColor: { rgb: "213448" } }, // azul oscuro (#213448)
//       border: {
//         top: { style: "thin", color: { rgb: "FFFFFF" } },
//         bottom: { style: "thin", color: { rgb: "FFFFFF" } },
//       },
//     };

//     header.forEach((_, i) => {
//       const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
//       if (cell) cell.s = headerStyle;
//       const col = String.fromCharCode(65 + i);
//       ws["!cols"] = ws["!cols"] || [];
//       ws["!cols"].push({ wch: 20 });
//     });

//     // 3️⃣ Aplicar bordes a las filas de datos
//     const dataStyle = {
//       alignment: { vertical: "center" },
//       border: {
//         top: { style: "thin", color: { rgb: "999999" } },
//         bottom: { style: "thin", color: { rgb: "999999" } },
//       },
//     };

//     customersData.forEach((row, rIdx) => {
//       header.forEach((_, cIdx) => {
//         const cell = ws[XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx })];
//         if (cell) cell.s = dataStyle;
//       });
//     });

//     // 4️⃣ Crear libro y exportar
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Ventas");

//     const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const blob = new Blob([buffer], { type: "application/octet-stream" });
//     saveAs(blob, "Ventas.xlsx");
//   };

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
  }

  return (
    <div>
      <DataTable
        value={customersData}
        tableStyle={{ minWidth: "50rem" }}
        stripedRows
        filters={filters}
        filterDisplay="row"
        footerColumnGroup={footerGroup}
      >
        <Column
          header={<span style={{ margin: "10px" }}>Cliente </span>}
          style={{ padding: "10px", width: "280px" }}
          sortable
          field="full_name"
          filter
          filterPlaceholder="Buscar por nombre"
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
