import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  businesses: [],
  business: {
    business_id: "",
    name: "",
    slug: "",
    phone: "",
    description: "",
    logoUrl: "",
    logo: null,
  },
};

const businessSlice = createSlice({
  name: "business",
  initialState,
  reducers: {
    restartState(state) {
      state.business = {};
      state.businesses = [];
    },
    startUser(state) {
      state.business = {
        business_id: "",
        name: "",
        slug: "",
        phone: "",
        description: "",
        logoUrl: "",
        logo: null,
      };
    },
    setbusinesses(state, actions) {
      state.businesses = actions.payload.businesses;
    },
    setbusiness(state, actions) {
      state.business = actions.payload.business;
    },
    modifyPropertyValue(state, actions) {
      state.business[actions.payload.id] = actions.payload.value;
    },
  },
});

export const businessActions = businessSlice.actions;
export default businessSlice;
