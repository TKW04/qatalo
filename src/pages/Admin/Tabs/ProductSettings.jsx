import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import { saveBusinessData } from "../../../services/businessApi";
import PrimaryButton from "../../../components/PrimaryButton";
import Select from "../../../components/Select";
import { OUT_OF_STOCK_OPTIONS } from "../../../helpers/productSettings";
import styles from "./Products.module.css";

// Configuración general de productos (por negocio).
// Recibe `business` (del query compartido ["business", tenantId]) para no perder
// otros campos al guardar: se manda el negocio COMPLETO con product_settings actualizado.
const ProductSettings = ({ business }) => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showSuccess, showError } = useNotification();
  const qc = useQueryClient();

  const [outOfStock, setOutOfStock] = useState(
    business?.product_settings?.out_of_stock || "normal"
  );

  // Si el negocio carga después, sincroniza el valor inicial.
  useEffect(() => {
    setOutOfStock(business?.product_settings?.out_of_stock || "normal");
  }, [business?.product_settings?.out_of_stock]);

  const saveM = useMutation({
    mutationFn: () =>
      saveBusinessData(tenantId, {
        ...business, // negocio completo → no se borran otros campos
        product_settings: { ...(business?.product_settings || {}), out_of_stock: outOfStock },
      }),
    onSuccess: () => {
      showSuccess("Guardado", "Configuración de productos actualizada.");
      qc.invalidateQueries({ queryKey: ["business", tenantId] });
    },
    onError: (e) => showError("Error", e.message),
  });

  if (!business?.business_id) {
    return (
      <div className={styles.card}>
        <p style={{ color: "#667085" }}>
          Primero crea tu negocio en Configuración para ajustar estas opciones.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2>Configuración general de productos</h2>
      <p className={styles.requiredNote}>
        Estas opciones aplican a todo tu catálogo público.
      </p>

      <div className={styles.formGroup}>
        <label>Productos agotados</label>
        <Select
          value={outOfStock}
          onChange={setOutOfStock}
          options={OUT_OF_STOCK_OPTIONS}
          searchable={false}
        />
        <span style={{ fontSize: ".8rem", color: "#667085", marginTop: ".35rem", display: "block", lineHeight: 1.5 }}>
          {outOfStock === "normal"
            ? "Los productos agotados se muestran como cualquier otro, según su orden."
            : outOfStock === "end"
              ? "Los productos disponibles aparecen primero; los agotados se muestran al final."
              : "Los productos agotados no se mostrarán en tu catálogo hasta que vuelvan a tener stock."}
        </span>
      </div>

      <div className={styles.formActions}>
        <PrimaryButton type="button" disabled={saveM.isPending} onClick={() => saveM.mutate()}>
          {saveM.isPending ? "Guardando..." : "Guardar configuración"}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default ProductSettings;