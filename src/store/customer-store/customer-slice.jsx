import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  customers: [],
  customer: {
    business_id: "",
    customer_id: "",
    user_id: "",
    email: "",
    given_name: "",
    family_name: "",
    transaction_quantity: 1,
    age: 0,

    transaction: {
      product_id: "",
      product_name: "",
      quantity: 1,
      price: 0,
      status: "pending",
      accept_terms: false,
      delivery_day: "",
      payment_method: {
        payment_method_id: "",
        payment_type: "",
        currency: "",
      },
    },
    transactions: [],
  },
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    restartState(state) {
      state.customer = {};
      state.customers = [];
    },
    startCustomer(state) {
      state.customer = {
        business_id: "",
        customer_id: "",
        email: "",
        given_name: "",
        family_name: "",
        transaction_quantity: 1,
        age: 0,
        transaction: {
          product_id: "",
          product_name: "",
          quantity: 1,
          price: 0,
          status: "pending",
          accept_terms: false,
          delivery_day: "",
          payment_method: {
            payment_method_id: "",
            payment_type: "",
            currency: "",
          },
        },
        transactions: [],
      };
    },
    setCustomers(state, actions) {
      state.customers = actions.payload.customers;
    },
    setCustomer(state, actions) {
      state.customer = actions.payload.customer;
    },
    modifyPropertyValue(state, actions) {
      state.customer[actions.payload.id] = actions.payload.value;
    },
  },
});

export const customerActions = customerSlice.actions;
export default customerSlice;
