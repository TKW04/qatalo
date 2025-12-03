import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useCallback, useEffect, useState } from "react";
import { formatDate, formatTextDateShort } from "../helpers/utils";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";

const SellReport = ({
  customers,
  getCurrencySymbol,
  formatted,
  getStatusStyle,
}) => {
  const [customersData, setCustomersData] = useState([]);
  const [showTotalsByProductFlag, setShowTotalsByProductFlag] = useState(false);
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState([]);
  const [showMonthsFilter, setShowMonthsFilter] = useState(false);

  const [filters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    full_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    product_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    delivery_day: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const isMobile = window.innerWidth <= 480;
  const getCustomerData = useCallback(() => {
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
          created_at: transaction.create_date ? transaction.create_date : "",
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
  }, [customers]);

  useEffect(() => {
    if (customersData.length > 0) return;
    if (customersData.length === 0) getCustomerData();
  }, [customersData.length, getCustomerData]);

  useEffect(() => {
    if (customersData.length > 0) {
      customersData.forEach((customer) => {
        const year = customer.delivery_day.split("/")[2];
        const listYears = [...years];
        if (!listYears.includes(year)) {
          listYears.push(year);
          setYears(listYears);
        }
        const month = customer.delivery_day.split("/")[1];
        const listMonths = [...months];
        if (!listMonths.includes(month)) {
          listMonths.push(month);
          setMonths(listMonths);
        }
      });
    }
  }, [customersData, months, years]);

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
    //sort customersData by created_at date ascending
    const transactions = [...customersData].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateA - dateB;
    });

    transactions.forEach((item) => {
      const productExist = totals.find(
        (prod) => prod.product_name === item.product_name
      );

      if (!productExist) {
        totals.push({
          product_name: item.product_name,
          total: item.total,
          quantity: parseInt(item.quantity),
          lastSell: item.created_at,
        });
      } else {
        productExist.total += item.total;
        productExist.quantity += parseInt(item.quantity);
        productExist.lastSell = item.created_at;
      }
    });

    return totals;
  };
  const showTotalsByProduct = () => {
    const totals = totalByProduct();
    return (
      <div
        style={{
          marginBottom: "20px",
          border: "1px solid var(--color-navy)",
          borderRadius: "8px",
          padding: "30px",
          backgroundColor: "var(--color-navy)",
          color: "white",
        }}
      >
        <div className="grid">
          <div
            className="col-12"
            style={{
              textAlign: "center",
              color: "var(--color-yellow)",
              fontSize: "22px",
              fontWeight: "bold",
            }}
          >
            <h2>Totales por Producto:</h2>
          </div>
          <DataTable
            value={totals}
            tableStyle={{ width: isMobile ? "100%" : "80vw" }}
            paginator
            stripedRows
            filters={filters}
            filterDisplay="row"
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{
              border: "1px solid var(--color-yellow)",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <Column
              header="Producto"
              className="align-items-center"
              filter
              style={{
                padding: "10px",
                width: "25%",
              }}
              field="product_name"
            />
            <Column
              header="Vendido"
              style={{
                padding: "10px",
                width: "5%",
                paddingLeft: "50px",
                paddingRight: "auto",
                textAlign: "left",
              }}
              field="quantity"
              body={(rowData) => {
                return (
                  <div className="grid">
                    <div className="col-4"></div>
                    <div className="col-4">{rowData.quantity}</div>
                    <div className="col-4"></div>
                  </div>
                );
              }}
            />
            <Column
              header="Total Vendido"
              style={{ padding: "10px", width: "10%" }}
              body={(rowData) => {
                return (
                  <span>
                    {getCurrencySymbol(customersData[0]?.currency || "")}{" "}
                    {formatted(rowData.total)}
                  </span>
                );
              }}
            />
            <Column
              header="Ultima Venta"
              style={{ padding: "10px", width: "25%" }}
              field="lastSell"
              body={(rowData) => {
                return <span>{formatDate(rowData.lastSell)}</span>;
              }}
            />
          </DataTable>
        </div>
      </div>
    );
  };
  const showMonths = (month) => {
    return (
      <div className="col">
        <Button
          onClick={() => {
            const filtered = customersData.filter((customer) => {
              return (
                customer.delivery_day.split("/")[1] === month &&
                customer.delivery_day.split("/")[2] === selectedYear
              );
            });
            setCustomersData(filtered);
          }}
          style={{
            padding: "10px",
            margin: "10px",
            borderColor: "var(--color-sea)",
            backgroundColor: "#ffffff",
            color: "var(--color-sea)",
            fontWeight: "bold",
          }}
        >
          {getMonthName(month)}
        </Button>
      </div>
    );
  };
  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);

    const weekday = date.toLocaleString("es-ES", { month: "long" });
    const capitalizedWeekday = weekday[0].toUpperCase() + weekday.slice(1);
    return capitalizedWeekday;
  };

  return (
    <div>
      <Button
        onClick={() => setShowTotalsByProductFlag(!showTotalsByProductFlag)}
        style={{
          padding: "10px",
          margin: "10px",
          borderColor: "var(--color-navy)",
          backgroundColor: "var(--color-sea)",
          color: "white",
          fontWeight: "bold",
        }}
      >
        {showTotalsByProductFlag
          ? "Ocultar Totales por Producto"
          : "Mostrar Totales por Producto"}
      </Button>
      {years.map((year) => {
        return (
          <Button
            onClick={() => {
              setShowMonthsFilter(!showMonthsFilter);
              setSelectedYear(year);
            }}
            style={{
              padding: "10px",
              margin: "10px",
              borderColor: "var(--color-sea)",
              backgroundColor: "var(--color-navy)",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {year}
          </Button>
        );
      })}
      {showMonthsFilter && (
        <div className="grid">
          <div className="col">
            <Button
              onClick={() => {
                getCustomerData();
              }}
              style={{
                padding: "10px",
                margin: "10px",
                borderColor: "var(--color-sea)",
                backgroundColor: "var(--color-navy)",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Todos los meses
            </Button>
          </div>
          {months.sort().map((month) => {
            return showMonths(month);
          })}
        </div>
      )}
      {showTotalsByProductFlag && showTotalsByProduct()}

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
          header={<span style={{ margin: "10px" }}>Cliente </span>}
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
          style={{ width: "15%"}}
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
