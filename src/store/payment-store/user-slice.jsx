import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  plans: [],
  plan: {
    product_id: "",
    product_name: "",
    product_description: "",
    price_id: "",
    currency: "",
    repassword: "",
  },
};

const planSlice = createSlice({
  name: "plan",
  initialState,
  reducers: {
    restartState(state) {
      state.plan = {};
      state.plans = [];
    },
    startProduct(state) {
      state.plan = {
        id: "",
        name: "",
        description: "",
        price: 0,
        category: "",
      };
    },
    setplans(state, actions) {
      state.plans = actions.payload.plans;
    },
    setplan(state, actions) {
      state.plan = actions.payload.plan;
    },
    modifyPropertyValue(state, actions) {
      state.plan[actions.payload.id] = actions.payload.value;
    },
  },
});

export const planActions = planSlice.actions;
export default planSlice;
