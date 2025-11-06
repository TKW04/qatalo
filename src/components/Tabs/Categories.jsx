import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Trash2, X } from "lucide-react";
import { IoMdRefresh } from "react-icons/io";
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
import { DeleteButton, EditButton } from "../Buttons";

let once = true;
const Categories = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();

  const categories = useSelector((state) => state.category.categories);
  const category = useSelector((state) => state.category.category);
  const business = useSelector((state) => state.business.business);

  const [editingCategory, setEditingCategory] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isMobile = window.innerWidth <= 760;

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
      }, 4500);
    }
  }, [business, categories, dispatch, showError]);

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (category.name.trim() === "") {
      showWarning(
        "Valide su información",
        "El nombre de la categoría es obligatorio"
      );
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
    }, 4500);
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
          }, 4500);
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
        <p style={{color:"#ffffff"}}>¿Estás seguro de que deseas eliminar esta categoría?</p>
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
            <div className="grid">
              <div className="col-12 form-group">
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

        <div>
          <h2>
            Categorías Existentes{" "}
            <Button
              outlined
              type="button"
              icon={<IoMdRefresh size={24} color="var(--color-navy)" />}
              value={""}
              style={{
                border: "none",
                margin: "5px",
              }}
              onClick={() => {
                setIsLoading(true);
                setLoadingMessage("Cargando categorías...");
                dispatch(GetCategories(showError));
                setTimeout(() => {
                  setIsLoading(false);
                }, 2500);
              }}
            />
          </h2>
          <div>
            <DataTable
              value={categories}
              dataKey="category_id"
              showGridlines
              stripedRows
            >
              <Column
                field="name"
                header="Name"
                style={{
                  minWidth: isMobile ? "10rem" : "15rem",
                  padding: "1rem",
                }}
              ></Column>

              <Column
                header="Acciones"
                style={{
                  minWidth: isMobile ? "5rem" : "15rem",
                  padding: "1rem",
                }}
                body={(rowData) => (
                  <div>
                    <div className="grid justify-content-center">
                      <div className={isMobile ? "col-12" : "col"}>
                        <EditButton
                          onClick={() => handleEditCategory(rowData)}
                        />
                      </div>
                      <div className={isMobile ? "col-12" : "col"}>
                        <DeleteButton
                          onClick={() => handleDeleteCategory(true, rowData)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              ></Column>
            </DataTable>
          </div>
        </div>
      </div>
    </>
  );
};
export default Categories;
