import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  product: {
    product_id: "",
    business_id: "",
    name: "",
    description: "",
    terms: "",
    currency: "RD$",
    category_id: "",
    delivery_start_day: "",

    min_age: 0,
    order: 0,
    price: 0.0,
    quantity: 0,
    orden: 0,

    is_available: true,
    min_age_allow: false,
    just_one: false,
    show_quantity: false,
    required_delivery_day: false,

    imagesUrl: [],

    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
  },
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    restartState(state) {
      state.product = {};
      state.products = [];
    },
    startProduct(state) {
      state.product = {
        product_id: "",
        business_id: "",
        name: "",
        description: "",
        terms: "",
        currency: "RD$",
        category_id: "",
        delivery_start_day: "",

        min_age: 0,
        order: 0,
        price: 0.0,
        quantity: 0,
        orden: 0,

        is_available: true,
        min_age_allow: false,
        just_one: false,
        show_quantity: false,
        required_delivery_day: false,

        imagesUrl: [],

        image1: null,
        image2: null,
        image3: null,
        image4: null,
        image5: null,
      };
    },
    setProducts(state, actions) {
      state.products = actions.payload.products;
    },
    setProduct(state, actions) {
      state.product = actions.payload.product;
    },
    modifyPropertyValue(state, actions) {
      state.product[actions.payload.id] = actions.payload.value;
    },
  },
});

export const productActions = productSlice.actions;
export default productSlice;
