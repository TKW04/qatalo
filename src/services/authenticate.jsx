import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { removeToken } from "../helpers/token"; // Ajusta si la ruta cambió

// 1. Añadimos 'targetPool' como tercer parámetro
export const authenticate = (Email, Password, targetPool) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: Email,
      Pool: targetPool, // Usamos el pool inyectado
    });

    const authDetails = new AuthenticationDetails({
      Username: Email,
      Password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        console.error("Authentication failed:", err);
        reject(err);
      },
    });
  });
};

// 2. Necesitamos saber de qué pool cerrar sesión
export const logout = (redirectUrl = "/login") => {
  // user.signOut();
  removeToken();
  window.location.href = redirectUrl;
};

// 3. Revisamos la sesión en el pool correcto
export const getCurrentSession = (targetPool) => {
  return new Promise((resolve, reject) => {
    const user = targetPool.getCurrentUser();

    if (!user) {
      return reject("No user");
    }

    user.getSession((err, session) => {
      if (err) {
        return reject(err);
      }

      if (!session.isValid()) {
        return reject("Session expired");
      }

      resolve(session);
    });
  });
};