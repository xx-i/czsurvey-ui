import { getToken, removeToken, setToken } from "@/utils/token-util";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeUser, setUser } from "@/store/userSlice";
import request from "@/utils/request";
import { useCallback } from "react";

export function authenticated(component) {
  return <Authenticated component={component}/>;
}

export function Authenticated({component}) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user || {})

  if (!getToken()) {
    return <Navigate to="/login"/>;
  }

  if (!user.id) {
    request
      .get('/user/userinfo')
      .then(res => {
        dispatch(setUser(res.data));
      })
      .catch(() => {});
  }
  return component;
}

export function useAuth() {
  let navigate = useNavigate();
  let dispatch = useDispatch();

  const authToken = getToken();

  const onLogin = useCallback((token) => {
    setToken(token);
    navigate('/');
  }, [navigate]);

  const onLogout = useCallback(() => {
    removeToken();
    dispatch(removeUser());
    navigate('/login');
  }, [dispatch, navigate]);

  return {authToken, onLogin, onLogout};
}