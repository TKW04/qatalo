import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
  category: {
    category_id: "",
    name: "",
    slug: "",
  },
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    restartState(state) {
      state.category = {};
      state.categories = [];
    },
    startCategory(state) {
      state.category = {
        category_id: "",
        name: "",
        slug: "",
      };
    },
    setCategories(state, actions) {
      state.categories = actions.payload.categories;
    },
    setCategory(state, actions) {
      state.category = actions.payload.category;
    },
    modifyPropertyValue(state, actions) {
      state.category[actions.payload.id] = actions.payload.value;
    },
  },
});

export const categoryActions = categorySlice.actions;
export default categorySlice;
