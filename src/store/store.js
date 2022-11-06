import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import breadCrumbReducer from './breadCrumbSlice'

export default configureStore({
  reducer: {
    user: userReducer,
    breadCrumb: breadCrumbReducer
  }
});