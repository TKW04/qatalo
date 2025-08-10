import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { PencilIcon, Trash2 } from "lucide-react";

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
}) => {
  const isMobile = window.innerWidth <= 480;  
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
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
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
                onChange={(e) =>
                  setNewCategory({ ...newCategory, slug: e.target.value })
                }
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
                  setNewCategory({ name: "", slug: "" });
                  setEditingCategory(null);
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
