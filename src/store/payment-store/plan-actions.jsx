import { getToken } from "../../helpers/token";
import { planActions } from "./plan-slice";

export const GetPlans = (showError) => {
  return async (dispatch) => {
    const RegisterUserInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}paddle/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    };

    try {
      const response = await RegisterUserInfo();
     
      
      if (response.status === 200) {
        const data = await response.json();
        dispatch(
          planActions.setPlans({
            plans: data,
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
export const GetSubscription = (subscriptionId, showError) => {
  return async (dispatch) => {
    const RegisterUserInfo = async () => {
      return await fetch(
        `${
          import.meta.env.VITE_APP_API_URL
        }paddle/subscription/${subscriptionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };

    try {
      const response = await RegisterUserInfo();
      if (response.status === 200) {
        const data = await response.json();
        dispatch(
          planActions.setSubscription({
            subscription: data,
          })
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
