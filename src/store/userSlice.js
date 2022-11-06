import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    roles: []
  },
  reducers: {
    setUser: (state, action) => {
      Object.assign(state, action.payload);
    },
    removeUser: () => {
      return {roles: []};
    }
  }
});

export const { setUser, removeUser } = userSlice.actions

export default userSlice.reducer;