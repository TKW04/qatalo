import { createSlice } from "@reduxjs/toolkit";
import { Currency } from "lucide-react";


const initialState = {
  paymentMethods: [],
  paymentMethod: {
    payment_method_id: "",
    business_id: "",
    payment_type: "",
    account_number: "",
    account_type: "",
    bank_name: "",
    routing_number: "",
    owner_name: "",
    owner_document: "",
    owner_email: "",
    swift: "",
    standard_account: "",
    payment_link: "",
    currency: ""
  },
};

const paymentMethodSlice = createSlice({
  name: "paymentMethod",
  initialState,
  reducers: {
    restartState(state) {
      state.paymentMethod = {};
      state.paymentMethod = [];
    },
    startPaymentMethod(state) {
      state.paymentMethod = {
        payment_method_id: "",
        business_id: "",
        payment_type: "",
        account_number: "",
        account_type: "",
        bank_name: "",
        routing_number: "",
        owner_name: "",
        owner_document: "",
        owner_email: "",
        swift: "",
        standard_account: "",
        payment_link: "",
        currency: ""
      };
    },
    setPaymentMethods(state, actions) {
      state.paymentMethods = actions.payload.paymentMethods;
    },
    setPaymentMethod(state, actions) {
      state.paymentMethod = actions.payload.paymentMethod;
    },
    modifyPropertyValue(state, actions) {
      state.paymentMethod[actions.payload.id] = actions.payload.value;
    },
  },
});

export const paymentMethodActions = paymentMethodSlice.actions;
export default paymentMethodSlice;
