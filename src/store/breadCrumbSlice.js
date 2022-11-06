import { createSlice } from "@reduxjs/toolkit";

export const breadCrumbSlice = createSlice({
  name: 'breadCrumb',
  initialState: {
    current: []
  },
  reducers: {
    setBreadCrumb(state, action) {
      Object.assign(state, {current: action.payload});
    }
  }
});

export const { setBreadCrumb } = breadCrumbSlice.actions;

export default breadCrumbSlice.reducer;