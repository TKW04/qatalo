import { getToken } from "../../helpers/token";


export const CreateAccount = (user, navigate, showError, showWarning, showSuccess) => {
  return async () => {
    const RegisterUserInfo = async () => {

      return await fetch(`${import.meta.env.VITE_APP_API_URL}users`, {
        method: "POST",
        body: JSON.stringify({
          given_name: user.given_name,
          family_name: user.family_name,
          email: user.email,
          password: user.password,
        }),
        headers: {
          "Content-Type": "application/json",
          // Authorization: getToken(),
        },
      });
    };

    try {
      const response = await RegisterUserInfo();
      if (response.status === 200) {
        showSuccess("Usuario creado", "Usuario creado con éxito");
        setTimeout(() => {
          navigate("/login");
        }, 4500);
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

export const UpdateUser = (user, navigate, showError, showWarning, showSuccess) => {
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
          navigate(0);
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

export const Forgot_Password = (email, showError, showWarning, showSuccess) => {
  return async () => {
    const ForgotPasswordRequest = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}users/forgot-password/${email}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    };
    try {
      const response = await ForgotPasswordRequest();
      if (response.status === 200) {
        showSuccess(
          "Enlace enviado",
          "Se ha enviado un enlace de recuperación a su correo electrónico"
        );
      } else {
        showWarning(
          "No se pudo enviar el enlace",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
}

export const Reset_Password = (token, password, showError, showWarning, showSuccess) => {
  return async () => {
    const ResetPasswordRequest = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: token,
            password: password,
          }),
        }
      );
    };
    try {
      const response = await ResetPasswordRequest();
      if (response.status === 200) {
        showSuccess(
          "Contraseña restablecida",
          "Su contraseña ha sido restablecida con éxito"
        );
      } else {
        showWarning(
          "No se pudo restablecer la contraseña",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};


export const ActivateUser = (userId, navigate, showError, showWarning, showSuccess) => {
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
          navigate(0);
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

export const InactivateUser = (userId, navigate, showError, showWarning, showSuccess) => {
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
          navigate(0);
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
