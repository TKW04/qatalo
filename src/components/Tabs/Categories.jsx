import { useDispatch } from "react-redux";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { PencilIcon, Trash2 } from "lucide-react";
import { categoryActions } from "../../store/categories-store/category-slice";

const Categories = ({
  categories,
  editingCategory,
  setEditingCategory,
  newCategory,
  setNewCategory,
  handleCategorySubmit,
  handleDeleteCategory,
  handleEditCategory,
  generateSlug,
  isDemo,
}) => {
  const isMobile = window.innerWidth <= 480;
  const dispatch = useDispatch();
  
  return (
    <div>
      <div className="admin-header">
        <h1>Gestión de Categorías</h1>
        <p>Organiza tus productos en categorías</p>
      </div>

      <div className="admin-card">
        <h2>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h2>
        <form onSubmit={handleCategorySubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <InputText
                type="text"
                className="input"
                value={newCategory.name}
                onChange={(e) => {
                  if (isDemo) {
                    setNewCategory({
                      ...newCategory,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  } else {
                    
                    dispatch(
                      categoryActions.modifyPropertyValue(
                        {
                          id: "name",
                          value: e.target.value
                        }
                      )
                    );
                    dispatch(
                      categoryActions.modifyPropertyValue(
                        {
                          id: "slug",
                          value: generateSlug(e.target.value)
                        }
                      )
                    );
                  }
                }}
                placeholder="Ropa"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug</label>
              <InputText
                type="text"
                className="input"
                value={newCategory.slug}
                onChange={(e) => {
                  if (isDemo) {
                    setNewCategory({ ...newCategory, slug: e.target.value });
                  } else {
                    dispatch(
                      categoryActions.modifyPropertyValue(
                        {
                          id: "slug",
                          value: generateSlug(e.target.value)
                        }
                      )
                    );
                  }
                }}
                placeholder="ropa"
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
                  if (isDemo === true) {
                    setNewCategory({ name: "", slug: "" });
                    setEditingCategory(null);
                  } else {
                    dispatch(categoryActions.startCategory(false));
                  }
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
                <th>Slug</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>
                    <div className="table-actions">
                      <Button
                        className="btn btn-small btn-outline"
                        onClick={() => handleEditCategory(category)}
                        icon={<PencilIcon />}
                        label={isMobile ? "" : "Editar"}
                        tooltip="Editar categoría"
                      />
                      <Button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteCategory(category.id)}
                        icon={<Trash2 />}
                        label={isMobile ? "" : "Eliminar"}
                        tooltip="Eliminar categoría"
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
  );
};
export default Categories;
