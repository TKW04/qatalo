import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import userpool from "./userpool";
import { removeToken } from "../helpers/token";

export const authenticate = (Email, Password) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: Email,
      Pool: userpool,
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
        console.log("Authentication failed:", err);

        reject(err);
      },
    });
  });
};

export const logout = () => {
  const user = userpool.getCurrentUser();
  if (user) {
    user.signOut();
    removeToken();
    window.location.href = "/login";
  }
};

export const getCurrentSession = () => {
  return new Promise((resolve, reject) => {
    const user = userpool.getCurrentUser();

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

