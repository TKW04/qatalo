import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: import.meta.env.VITE_APP_USER_POOL_MERCHANTS_ID,
  ClientId: import.meta.env.VITE_APP_CLIENT_MERCHANTS_ID,
};

export default new CognitoUserPool(poolData);