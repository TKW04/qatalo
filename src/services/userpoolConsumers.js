import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: import.meta.env.VITE_APP_CONSUMERS_USER_POOL_ID,
  ClientId: import.meta.env.VITE_APP_CONSUMERS_CLIENT_ID,
};
const userPoolConsumers = new CognitoUserPool(poolData);
export default userPoolConsumers;
