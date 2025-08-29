import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { PencilIcon, Trash2, X } from "lucide-react";
import { categoryActions } from "../../store/categories-store/category-slice";

import {
  CreateCategory,
  DeleteCategory,
  GetCategories,
  UpdateCategory,
} from "../../store/categories-store/category-actions";
import { useNotification } from "../UI/NotificationProvider";
import Loading from "../UI/Loading";
import DialogModal from "../DialogModal";
import "../../styles/catalog.css";

let once = true;
const Categories = ({ setActiveTab }) => {
  const isMobile = window.innerWidth <= 480;
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();

  const categories = useSelector((state) => state.category.categories);
  const category = useSelector((state) => state.category.category);
  const business = useSelector((state) => state.business.business);

  const [editingCategory, setEditingCategory] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (categories.length === 0 && once) {
      setIsLoading(true);
      setLoadingMessage("Cargando categorías...");
      dispatch(GetCategories(showError));
      dispatch(categoryActions.startCategory());
      once = false;
      dispatch(
        categoryActions.modifyPropertyValue({
          id: "business_id",
          value: business.business_id,
        })
      );
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [business.business_id, categories, dispatch, showError]);

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (category.name.trim() === "") {
      showWarning("Valide su información", "El nombre de la categoría es obligatorio");
      setIsLoading(false);
      return;
    }
    if (category.category_id) {
      setLoadingMessage("Actualizando categoría...");
      dispatch(UpdateCategory(category, showError, showWarning, showSuccess));
    } else {
      setLoadingMessage("Creando categoría...");
      dispatch(CreateCategory(category, showError, showWarning, showSuccess));
    }
    setTimeout(() => {
      setActiveTab("categories");
      dispatch(GetCategories(showError));
      dispatch(categoryActions.startCategory());
      setEditingCategory(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleEditCategory = (category) => {
    dispatch(categoryActions.setCategory({ category: category }));
    setEditingCategory(true);
  };

  const handleDeleteCategory = (showDialog, category) => {
    setShowDeleteDialog(showDialog);
    dispatch(categoryActions.setCategory({ category: category }));
  };
  const footerContent = (
    <div>
      <Button
        className="btn btn-secondary"
        label="No"
        icon={<X />}
        onClick={() => setShowDeleteDialog(false)}
        style={{ width: "100px", margin: "2px" }}
      />
      <Button
        className="btn btn-danger"
        label="Si"
        icon={<Trash2 />}
        onClick={() => {
          setIsLoading(true);
          setLoadingMessage("Eliminando categoría...");
          dispatch(
            DeleteCategory(
              category.category_id,
              showError,
              showWarning,
              showSuccess
            )
          );

          setTimeout(() => {
            setActiveTab("categories");
            dispatch(GetCategories(showError));
            dispatch(categoryActions.startCategory());
            setIsLoading(false);
            setShowDeleteDialog(false);
          }, 1500);
        }}
        style={{ width: "100px", margin: "2px" }}
      />
    </div>
  );

  return (
    <>
      <DialogModal
        title="Eliminar Categoría"
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        footer={footerContent}
      >
        <p>¿Estás seguro de que deseas eliminar esta categoría?</p>
      </DialogModal>
      <Loading message={loadingMessage} visible={isLoading} />
      <div>
        <div className="admin-header">
          <h1>Gestión de Categorías</h1>
          <p>Organiza tus productos en categorías</p>
        </div>

        <div className="admin-card">
          <h2>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h2>
          <form onSubmit={handleCategorySubmit}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <InputText
                type="text"
                className="input"
                value={category.name}
                onChange={(e) => {
                  dispatch(
                    categoryActions.modifyPropertyValue({
                      id: "name",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="Ropa"
                required
              />
            </div>

            <div className="form-actions">
              <Button type="submit" className="btn btn-primary">
                {editingCategory ? "Actualizar" : "Crear"} Categoría
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    dispatch(categoryActions.startCategory(false));
                    setEditingCategory(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h2>Categorías Existentes</h2>
          {categories.length === 0 ? (
            <p>No hay categorías creadas aún.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.category_id}>
                    <td>{category.name}</td>
                    <td>
                      <div className="table-actions">
                        <Button
                          className="btn btn-small btn-outline"
                          onClick={() => {
                            handleEditCategory(category);
                          }}
                          icon={<PencilIcon />}

                        />
                        <Button
                          className="btn btn-small btn-danger"
                          onClick={() => {
                            handleDeleteCategory(true, category);
                          }}
                          icon={<Trash2 />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};
export default Categories;
