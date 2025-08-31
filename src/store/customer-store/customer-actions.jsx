import { getToken } from "../../helpers/token";

export const CreateCustomer = (
  customer,
  showWarning,
  showSuccess
) => {
  return async () => {
    const RegisterUserInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}customers`, {
        method: "POST",
        body: JSON.stringify({
          business_id: customer.business_id,
          customer_id: customer.customer_id,
          phone: customer.phone,
          email: customer.email,
          given_name: customer.given_name,
          family_name: customer.family_name,
          transaction: customer.transaction,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    };

    try {
      const response = await RegisterUserInfo();
      if (response.status === 200) {
        showSuccess("Transacción", "Su transacción se ha procesado con éxito");
      } else {
        showWarning(
          "No se pudo crear la transacción",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
    }
  };
};
export const UpdateUser = (user, showError, showWarning, showSuccess) => {
  return async () => {
    const UpdateUserInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
          body: JSON.stringify({
            given_name: user.given_name,
            family_name: user.family_name,
            role: user.role,
            password: user.password,
          }),
        }
      );
    };
    try {
      const response = await UpdateUserInfo();
      if (response.status === 200) {
        showSuccess("Usuario actualizado", "Usuario actualizado con éxito");
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
