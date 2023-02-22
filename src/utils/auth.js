import { getToken, removeToken, setToken } from "@/utils/token-util";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeUser, setUser } from "@/store/userSlice";
import request from "@/utils/request";
import { useCallback, useEffect } from "react";

export function authenticated(component) {
  return <Authenticated component={component}/>;
}

export function Authenticated({component}) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user || {})

  useEffect(() => {
    if (!user.id) {
      request
        .get('/user/userinfo')
        .then(res => {
          dispatch(setUser(res.data));
        })
        .catch(err => console.error(err));
    }
  }, [dispatch, user]);

  if (!getToken()) {
    return <Navigate to="/login"/>;
  }
  return component;
}

export function useAuthenticated() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user || {});
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) {
       navigate('/login');
    }
    if (!user.id) {
      request
        .get('/user/userinfo')
        .then(res => {
          dispatch(setUser(res.data));
        })
        .catch(err => console.error(err));
    }
    // eslint-disable-next-line
  }, [dispatch, user]);

  return user;
}

export function useAuth() {
  let navigate = useNavigate();
  let dispatch = useDispatch();

  const authToken = getToken();

  const onLogin = useCallback((token, to = '/') => {
    setToken(token);
    navigate(to);
    // eslint-disable-next-line
  }, [navigate]);

  const onLogout = useCallback((to = '/login') => {
    removeToken();
    dispatch(removeUser());
    navigate(to);
    // eslint-disable-next-line
  }, [dispatch, navigate]);

  return {authToken, onLogin, onLogout};
}