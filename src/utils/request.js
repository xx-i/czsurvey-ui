import axios from "axios";
import { getToken } from "@/utils/token-util";
import qs from 'qs'
import { isMobile } from "@/utils/validate";

let logoutHandler;

export const injectLogoutHandler = (_logoutHandler) => {
  if (!logoutHandler) {
    logoutHandler = _logoutHandler;
  }
}

export const BASE_RUL = process.env.REACT_APP_API_BASE_URL;

const service = axios.create({
  baseURL: `${BASE_RUL}`
})

service.interceptors.request.use(
  (config) => {
    // 添加 token 到 header
    const token = getToken();
    if (token && config.headers) {
      config.headers.common['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.defaults.paramsSerializer = (params) => {
  return qs.stringify(params);
}

service.interceptors.response.use(
  rsp => rsp,
  (error) => {
    if (error.response.status === 401) {
      const currentPath = window.location.pathname;
      const searchParams = window.location.search;
      // new URLSearchParams(window.location.search).get('id')
      if (currentPath === '/mobile/login' || currentPath === '/s/login') {
        searchParams ? logoutHandler(`${currentPath}${searchParams}`) : logoutHandler(currentPath);
      } else if (currentPath === '/s') {
        if (isMobile()) {
          searchParams ? logoutHandler(`/mobile/login${searchParams}`) : logoutHandler('/mobile/login');
        } else {
          searchParams ? logoutHandler(`/s/login${searchParams}`) : logoutHandler('/s/login');
        }
      } else {
        logoutHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default service;