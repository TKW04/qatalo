import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPen, FaTrashCan, FaArrowsRotate } from "react-icons/fa6";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import { fetchBusinessData } from "../../../services/businessApi";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/categoryApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Categories.module.css";

const Categories = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showWarning, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  // Reutiliza el negocio ya cargado para obtener el business_id
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["categories", tenantId],
    queryFn: fetchCategories,
    enabled: !!tenantId,
    retry: false,
  });

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      payload.category_id ? updateCategory(payload) : createCategory(payload),
    onSuccess: () => {
      showSuccess("¡Éxito!", editingId ? "Categoría actualizada" : "Categoría creada");
      queryClient.invalidateQueries({ queryKey: ["categories", tenantId] });
      resetForm();
    },
    onError: (error) => showWarning("Revisa la información", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      showSuccess("Eliminada", "Categoría eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["categories", tenantId] });
      setToDelete(null);
    },
    onError: (error) => showError("Error", error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return showWarning("Valida tu información", "El nombre de la categoría es obligatorio");
    }
    saveMutation.mutate({
      category_id: editingId || undefined,
      name: name.trim(),
      business_id: business?.business_id,
    });
  };

  const handleEdit = (cat) => {
    setEditingId(cat.category_id);
    setName(cat.name);
  };

  if (isLoading) return <Loading message="Cargando categorías..." />;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Gestión de Categorías</h1>
        <p>Organiza tus productos en categorías</p>
      </div>

      {/* Formulario */}
      <div className={styles.card}>
        <h2>{editingId ? "Editar Categoría" : "Nueva Categoría"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nombre *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Ropa"
            />
          </div>
          <div className={styles.formActions}>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Guardando..."
                : editingId
                ? "Actualizar categoría"
                : "Crear categoría"}
            </PrimaryButton>
            {editingId && (
              <button type="button" className={styles.btnOutline} onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className={styles.listHeader}>
        <h2>Categorías existentes</h2>
        <button className={styles.refreshBtn} onClick={() => refetch()}>
          <FaArrowsRotate /> Actualizar
        </button>
      </div>

      {categories.length === 0 ? (
        <div className={styles.empty}>Aún no tienes categorías. Crea la primera arriba.</div>
      ) : (
        <div className={styles.list}>
          {categories.map((cat) => (
            <div key={cat.category_id} className={styles.row}>
              <span className={styles.rowName}>{cat.name}</span>
              <div className={styles.rowActions}>
                <button
                  className={styles.iconBtn}
                  onClick={() => handleEdit(cat)}
                  aria-label={`Editar ${cat.name}`}
                >
                  <FaPen />
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.danger}`}
                  onClick={() => setToDelete(cat)}
                  aria-label={`Eliminar ${cat.name}`}
                >
                  <FaTrashCan />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {toDelete && (
        <div className={styles.modalOverlay} onClick={() => setToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar categoría</h3>
            <p>
              ¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>? Esta acción no se
              puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setToDelete(null)}>
                Cancelar
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => deleteMutation.mutate(toDelete.category_id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;