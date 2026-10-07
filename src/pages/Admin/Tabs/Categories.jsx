import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, RefreshCw, FolderOpen, Plus } from "lucide-react";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import {
  PageHeader,
  Button,
  IconButton,
  Modal,
  EmptyState,
  Field,
  SkeletonList,
} from "../../../components/admin";
import { fetchBusinessData } from "../../../services/businessApi";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/categoryApi";
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

  const nameInputId = "category-name";

  const focusForm = () => {
    document.getElementById(nameInputId)?.focus();
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Categorías" description="Organiza tus productos en categorías" />
        <SkeletonList rows={4} media={false} label="Cargando categorías..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Categorías" description="Organiza tus productos en categorías" />

      {/* Formulario */}
      <section className={styles.card} aria-labelledby="category-form-title">
        <h2 id="category-form-title">{editingId ? "Editar categoría" : "Nueva categoría"}</h2>
        <form onSubmit={handleSubmit}>
          <Field label="Nombre" required>
            <input
              id={nameInputId}
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Ropa"
            />
          </Field>
          <div className={styles.formActions}>
            <Button type="submit" loading={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Guardando..."
                : editingId
                ? "Actualizar categoría"
                : "Crear categoría"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Listado */}
      <div className={styles.listHeader}>
        <h2>Categorías existentes</h2>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => refetch()}>
          Actualizar
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aún no tienes categorías"
          description="Las categorías agrupan tus productos en el catálogo. Crea la primera para empezar."
          action={<Button icon={Plus} onClick={focusForm}>Crear categoría</Button>}
        />
      ) : (
        <ul className={styles.list}>
          {categories.map((cat) => (
            <li key={cat.category_id} className={styles.row}>
              <span className={styles.rowName}>{cat.name}</span>
              <div className={styles.rowActions}>
                <IconButton
                  icon={Pencil}
                  variant="outline"
                  label={`Editar ${cat.name}`}
                  onClick={() => handleEdit(cat)}
                />
                <IconButton
                  icon={Trash2}
                  variant="danger"
                  label={`Eliminar ${cat.name}`}
                  onClick={() => setToDelete(cat)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de confirmación */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar categoría"
        size="sm"
        dismissible={!deleteMutation.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(toDelete.category_id)}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>
          ¿Seguro que deseas eliminar <strong>{toDelete?.name}</strong>? Esta acción no se
          puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

export default Categories;