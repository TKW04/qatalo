import { getToken } from "../../helpers/token";
import { paymentMethodActions } from "./paymentMethod-slice";


export const GetPaymentMethods = (showError) => {
  return async (dispatch) => {
    const PaymentMethodInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}payment_methods`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await PaymentMethodInfo();
      if (response.status === 200) {
        const data = await response.json();
        
        dispatch(
          paymentMethodActions.setPaymentMethods({
            paymentMethods: data !== null ? data : [],
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los métodos de pago");
    }
  };
};

export const CreatePaymentMethod = (paymentMethod, showError, showWarning, showSuccess) => {
  return async () => {
    const PaymentMethodInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}payment_methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
        body: JSON.stringify(paymentMethod),
      });
    };

    try {
      const response = await PaymentMethodInfo();
      if (response.status === 200) {
        showSuccess("¡Éxito!", "Método de pago creado correctamente");
      } else {
        const data = await response.json();
        showWarning("Valide su información", data.message || "No se pudo crear el método de pago");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo crear el método de pago");
    }
  };
};
export const UpdatePaymentMethod = (paymentMethod, showError, showWarning, showSuccess) => {
  return async () => {
    const PaymentMethodInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}payment_methods/${paymentMethod.paymentMethod_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
        body: JSON.stringify(paymentMethod),
      });
    };

    try {
      const response = await PaymentMethodInfo();
      if (response.status === 200) {
        showSuccess("¡Éxito!", "Método de pago actualizado correctamente");
      } else {
        const data = await response.json();
        showWarning("Valide su información", data.message || "No se pudo actualizar el método de pago");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo actualizar el método de pago");
    }
  };
};

export const DeletePaymentMethod = (id, showError, showWarning, showSuccess) => {
  return async () => {
    const PaymentMethodInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}payment_methods/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await PaymentMethodInfo();
      if (response.status === 200) {
        showSuccess("¡Éxito!", "Método de pago eliminado correctamente");
      } else {
        const data = await response.json();
        showWarning("Valide su información", data.message || "No se pudo eliminar el método de pago");
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo eliminar el método de pago");
    }
  };
};
