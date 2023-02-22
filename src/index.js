import React from 'react';
import ReactDOM from 'react-dom/client';
import "@arco-design/web-react/dist/css/arco.css";
import { Provider } from "react-redux";
import store from "@/store/store";
import { BrowserRouter,  Route, Routes } from "react-router-dom";
import Login from "@/pages/login";
import { authenticated, useAuth } from "@/utils/auth";
import PageLayout from "@/pages/layout";
import {  injectLogoutHandler } from "@/utils/request";
import 'draft-js/dist/Draft.css';
import 'animate.css'

import "./style/index.less";
import Designer from "@/pages/editor/form-design/designer";
import Setting from "@/pages/editor/form-design/setting";
import { LoadingProvider } from "@/components/Loading";
import Logic from "@/pages/editor/form-design/logic";
import MobileLogin from "@/pages/mobileLogin";
import Page404 from "@/pages/error/Page404";

const MyProject = React.lazy(() => import('@/pages/project/mine'));
const EditorLayout = React.lazy(() => import('@/pages/editor/layout'));
const Editor = React.lazy(() => import('@/pages/editor/form-design'));
const Survey = React.lazy(() => import('@/pages/survey'));
const WxAuth = React.lazy(() => import('@/pages/wxAuth'));
const SurveyLogin = React.lazy(() => import('@/pages/surveyLogin'));
const Statistics = React.lazy(() => import('@/pages/editor/statistics'));
const DataDetails = React.lazy(() => import('@/pages/editor/statistics/data-details'))

const suspense = (component) =>  (
  <React.Suspense>
    {component}
  </React.Suspense>
);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <LoadingProvider>
      <BrowserRouter>
        <NavigateFunctionComponent/>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/" element={suspense(authenticated(<PageLayout/>))}>
            <Route index element={<MyProject/>} />
            <Route path="mine" element={<MyProject/>} />
            <Route path="recent" element={<MyProject/>} />
            <Route path="recycle" element={<MyProject isTrash />} />
            <Route path="mine/:folderId" element={<MyProject/>} />
            <Route path="recycle/:folderId" element={<MyProject isTrash />} />
            <Route path="test" element={<MyProject/>} />
            <Route path="templateAdd" element={<Page404/>} />
            <Route path="templateRemove" element={<Page404/>} />
          </Route>
          <Route path="/" element={suspense(authenticated(<EditorLayout/>))}
          >
            <Route path="design" element={<Editor/>}>
              <Route index element={<Designer/>} />
              <Route path="setting" element={<Setting/>} />
              <Route path="logic" element={<Logic/>} />
            </Route>
            <Route path="/stat" element={<Statistics/>}>
              <Route index element={<DataDetails/>}/>
            </Route>
          </Route>
          <Route path="/s" element={<Survey/>} />
          <Route path="/s/login" element={<SurveyLogin/>} />
          <Route path="/wx/auth" element={<WxAuth/>}/>
          <Route path="/mobile/login" element={<MobileLogin/>}/>
        </Routes>
      </BrowserRouter>
    </LoadingProvider>
  </Provider>
);

function NavigateFunctionComponent() {
  const { onLogout } = useAuth()
  injectLogoutHandler(onLogout);
  return <></>;
}
