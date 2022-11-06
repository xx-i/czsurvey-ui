import axios from "axios";
import { getToken } from "@/utils/token-util";

let logoutHandler;

export const injectLogoutHandler = (_logoutHandler) => {
  if (!logoutHandler) {
    logoutHandler = _logoutHandler;
  }
}

const service = axios.create({
  baseURL: 'http://192.168.43.210:7666/api'
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

service.interceptors.response.use(
  rsp => rsp,
  (error) => {
    if (error.response.status === 401) {
      logoutHandler();
    }
    return Promise.reject(error);
  }
);

export default service;