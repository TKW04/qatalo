import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./user-store/user-slice";
import planSlice from "./payment-store/plan-slice";
import businessSlice from "./business-store/business-slice";
import categorySlice from "./categories-store/category-slice";
import productSlice from "./product-store/product-slice";
import paymentMethodSlice from "./paymentMethod-store/paymentMethod-slice";

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    plan: planSlice.reducer,
    business: businessSlice.reducer,
    category: categorySlice.reducer,
    product: productSlice.reducer,
    paymentMethod: paymentMethodSlice.reducer,
  },
});
export default store;
