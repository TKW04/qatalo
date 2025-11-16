import { getToken } from "../../helpers/token";
import { customerActions } from "./customer-slice";

export const GetCustomers = (showError) => {
  return async (dispatch) => {
    const CustomersInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}customers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await CustomersInfo();
      if (response.status === 200) {
        const data = await response.json();

        dispatch(
          customerActions.setCustomers({
            customers: data,
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};
export const GetCustomerTransaction = (customer_id, showError) => {
  return async (dispatch) => {
    const CustomerTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/${customer_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    };

    try {
      const response = await CustomerTransactionInfo();

      if (response.status === 200) {
        const data = await response.json();

        dispatch(
          customerActions.setCustomer({
            customer: data,
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};
export const CreateCustomer = (customer, showWarning, showSuccess) => {
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
          age: customer.age,
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
export const UpdateCustomer = (
  customer,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const UpdateCustomerInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/${customer.customer_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
          body: JSON.stringify({
            given_name: customer.given_name,
            family_name: customer.family_name,
            email: customer.email,
            phone: customer.phone,
          }),
        }
      );
    };
    try {
      const response = await UpdateCustomerInfo();
      if (response.status === 200) {
        showSuccess("Cliente actualizado", "Cliente actualizado con éxito");
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
export const DeleteCustomer = (
  customer_id,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const DeleteCustomerInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/${customer_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await DeleteCustomerInfo();
      if (response.status === 200) {
        showSuccess("Cliente eliminado", "Cliente eliminado con éxito");
      } else {
        showWarning(
          "No se pudo eliminar el cliente",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};

export const UploadTransactionFile = (
  customer_id,
  transaction_id,
  file,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const transactionForm = new FormData();
    transactionForm.append("customer_id", customer_id);
    transactionForm.append("transaction_id", transaction_id);
    transactionForm.append("receipt", file);

    const UpdateTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/transactions`,
        {
          method: "POST",
          body: transactionForm,
        }
      );
    };
    try {
      const response = await UpdateTransactionInfo();
      if (response.status === 200) {
        showSuccess("Archivo subido", "El archivo se ha subido con éxito");
        setTimeout(() => {
          window.location.reload();
        }, 4500);
      } else {
        showWarning(
          "No se pudo subir el archivo",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};

export const CancelTransaction = (
  customer_id,
  transaction_id,
  cancellationReason,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const CancelTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/transactions/cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            customer_id: customer_id,
            transaction_id: transaction_id,
            cancellation_reason: cancellationReason,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    };
    try {
      const response = await CancelTransactionInfo();
      if (response.status === 200) {
        showSuccess("Transacción cancelada", "Transacción cancelada con éxito");
        setTimeout(() => {
          window.location.reload();
        }, 4500);
      } else {
        showWarning(
          "No se pudo cancelar la transacción",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};

export const CancelTransactionAdmin = (
  customer_id,
  transaction_id,
  cancellationReason,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const CancelTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/transactions/cancelAdmin`,
        {
          method: "POST",
          body: JSON.stringify({
            customer_id: customer_id,
            transaction_id: transaction_id,
            cancellation_reason: cancellationReason,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await CancelTransactionInfo();
      if (response.status === 200) {
        showSuccess("Transacción cancelada", "Transacción cancelada con éxito");
      } else {
        showWarning(
          "No se pudo cancelar la transacción",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};

export const ApproveTransaction = (
  customer_id,
  transaction_id,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const ApproveTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/transactions/approve`,
        {
          method: "POST",
          body: JSON.stringify({
            customer_id: customer_id,
            transaction_id: transaction_id,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await ApproveTransactionInfo();
      if (response.status === 200) {
        showSuccess("Transacción aprobada", "Transacción aprobada con éxito");
      } else {
        showWarning(
          "No se pudo aprobar la transacción",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo actualizar la orden");
    }
  };
};

export const DeliveredTransaction = (
  customer_id,
  transaction_id,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const DeliveredTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/transactions/delivered`,
        {
          method: "POST",
          body: JSON.stringify({
            customer_id: customer_id,
            transaction_id: transaction_id,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await DeliveredTransactionInfo();
      if (response.status === 200) {
        showSuccess("Orden entregada", "Orden entregada con éxito");
      } else {
        showWarning(
          "No se pudo actualizar la orden",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudo actualizar la orden");
    }
  };
};


export const UpdateTransaction = (
  customer_id,
  transaction,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const UpdateTransactionInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}customers/transactions/update`,
        {
          method: "PUT",
          body: JSON.stringify({
            customer_id: customer_id,
            transaction_id: transaction.transaction_id,
            delivery_day: transaction.delivery_day,
            price: transaction.price,
            quantity: transaction.quantity,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await UpdateTransactionInfo();
      if (response.status === 200) {
        showSuccess(
          "Transacción actualizada",
          "Transacción actualizada con éxito"
        );
      } else {
        showWarning(
          "No se pudo actualizar la transacción",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los clientes");
    }
  };
};

