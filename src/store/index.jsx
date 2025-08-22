import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./user-store/user-slice";
import planSlice from "./payment-store/plan-slice";
import businessSlice from "./business-store/business-slice";

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    plan: planSlice.reducer,
    business: businessSlice.reducer,
  },
});
export default store;
