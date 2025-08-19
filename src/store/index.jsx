import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./user-store/user-slice";
import planSlice from "./payment-store/plan-slice";

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    plan: planSlice.reducer,
  },
});
export default store;
