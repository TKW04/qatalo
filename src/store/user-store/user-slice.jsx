import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  user: {
    id: "",
    email: "",
    given_name: "",
    family_name: "",
    password: "",
    repassword: "",
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    restartState(state) {
      state.user = {};
      state.users = [];
    },
    startUser(state) {
      state.user = {
        id: "",
        given_name: "",
        email: "",
        family_name: "",
        password: "",
        repassword: "",
        role: "",
      };
    },
    setusers(state, actions) {
      state.users = actions.payload.users;
    },
    setuser(state, actions) {
      state.user = actions.payload.user;
    },
    modifyPropertyValue(state, actions) {
      state.user[actions.payload.id] = actions.payload.value;
    },
  },
});

export const userActions = userSlice.actions;
export default userSlice;
