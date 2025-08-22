import { getToken } from "../../helpers/token";
import { businessActions } from "./business-slice";

export const CreateBusiness = (
  business,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const RegisterBusinessInfo = async () => {
      const businessForm = new FormData();
      businessForm.append("name", business.name);
      businessForm.append("slug", business.slug);
      businessForm.append("phone", business.phone);
      businessForm.append("description", business.description);
      businessForm.append("logoUrl", business.logoUrl);
      businessForm.append("logo", business.logo);

      return await fetch(`${import.meta.env.VITE_APP_API_URL}businesses`, {
        method: "POST",
        body: businessForm,
        headers: {
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await RegisterBusinessInfo();
      if (response.status === 200) {
        showSuccess("Negocio guardado", "Negocio guardado con éxito");
      } else {
        showWarning(
          "No se pudo crear el usuario",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
export const GetBusiness = (user_id, showError) => {
  return async (dispatch) => {
    const FetchBusinessInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}businesses/${user_id}`,
        {
          method: "GET",
          headers: {
            Authorization: getToken(),
          },
        }
      );
    };

    try {
      const response = await FetchBusinessInfo();
      if (response.status === 200) {
        const data = await response.json();
        dispatch(businessActions.setBusiness({ business: data }));
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los negocios");
    }
  };
};

export const UpdateBusiness = (
  business,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const UpdateUserInfo = async () => {
      const businessForm = new FormData();
      businessForm.append("name", business.name);
      businessForm.append("slug", business.slug);
      businessForm.append("phone", business.phone);
      businessForm.append("description", business.description);
      businessForm.append("logoUrl", business.logoUrl);
      businessForm.append("logo", business.logo);
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}businesses/${business.business_id}`,
        {
          method: "PUT",
          body: businessForm,
          headers: {
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await UpdateUserInfo();
      if (response.status === 200) {
        showSuccess("Negocio actualizado", "Negocio actualizado con éxito");
      } else {
        showWarning(
          "No se pudo actualizar el negocio",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
export const ActivateUser = (userId, showError, showWarning, showSuccess) => {
  return async () => {
    const UpdateUserInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}users/active/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await UpdateUserInfo();
      if (response.status === 200) {
        showSuccess("Usuario activado", "Usuario activado con éxito");
        setTimeout(() => {
          window.location.reload();
        }, 4500);
      } else {
        showWarning(
          "No se pudo actualizar el usuario",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
export const InactivateUser = (userId, showError, showWarning, showSuccess) => {
  return async () => {
    const UpdateUserInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}users/inactive/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await UpdateUserInfo();
      if (response.status === 200) {
        showSuccess("Usuario inactivado", "Usuario inactivado con éxito");
        setTimeout(() => {
          window.location.reload();
        }, 4500);
      } else {
        showWarning(
          "No se pudo actualizar el usuario",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
