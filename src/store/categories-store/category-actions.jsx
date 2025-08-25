import { getToken } from "../../helpers/token";
import { categoryActions } from "./category-slice";


export const GetCategories = (showError) => {
  return async (dispatch) => {
    const RegisterCategoryInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await RegisterCategoryInfo();
      if (response.status === 200) {
        const data = await response.json();
        dispatch(
          categoryActions.setCategories({
            categories: data,
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener las categorías");
    }
  };
};
export const GetCategory = (id, showError) => {
  return async (dispatch) => {
    const RegisterCategoryInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}categories/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await RegisterCategoryInfo();
      if (response.status === 200) {
        const data = await response.json();
        dispatch(
          categoryActions.setCategory({
            category: data,
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo obtener la categoría");
    }
  };
};
export const CreateCategory = (category, showError, showWarning, showSuccess) => {
  return async () => {
    const RegisterCategoryInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
        body: JSON.stringify(category),
      });
    };

    try {
      const response = await RegisterCategoryInfo();
      if (response.status === 200) {
        showSuccess("¡Éxito!", "Categoría creada correctamente");
      } else {
        const data = await response.json();
        showWarning("Valide su información", data.message || "No se pudo crear la categoría");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo crear la categoría");
    }
  };
};
export const UpdateCategory = (category, showError, showWarning, showSuccess) => {
  return async () => {
    const RegisterCategoryInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}categories/${category.category_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
        body: JSON.stringify(category),
      });
    };

    try {
      const response = await RegisterCategoryInfo();
      if (response.status === 200) {
        showSuccess("¡Éxito!", "Categoría actualizada correctamente");
      } else {
        const data = await response.json();
        showWarning("Valide su información", data.message || "No se pudo actualizar la categoría");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo actualizar la categoría");
    }
  };
};

export const DeleteCategory = (id, showError, showWarning, showSuccess) => {
  return async () => {
    const RegisterCategoryInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await RegisterCategoryInfo();
      if (response.status === 200) {
        showSuccess("¡Éxito!", "Categoría eliminada correctamente");
      } else {
        const data = await response.json();
        showWarning("Valide su información", data.message || "No se pudo eliminar la categoría");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo eliminar la categoría");
    }
  };
};
