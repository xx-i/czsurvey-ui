import React from 'react';
import ReactDOM from 'react-dom/client';
import "@arco-design/web-react/dist/css/arco.css";
import { Provider } from "react-redux";
import store from "@/store/store";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "@/pages/login";
import { authenticated, useAuth } from "@/utils/auth";
import PageLayout from "@/pages/layout";
import { injectLogoutHandler } from "@/utils/request";

import MyProject from "@/pages/project/mine";
import EditorLayout from "@/pages/editor/layout";
import Editor from "@/pages/editor/form-design";
import Designer from "@/pages/editor/form-design/designer";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <NavigateFunctionComponent/>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={authenticated(<PageLayout/>)}>
          <Route index element={<MyProject/>} />
          <Route path="mine" element={<MyProject/>} />
          <Route path="recent" element={<MyProject/>} />
          <Route path="recycle" element={<MyProject/>} />
          <Route path="mine/:folderId" element={<MyProject/>} />
          <Route path="test" element={<MyProject/>} />
          <Route path="templateAdd" element={<MyProject/>} />
          <Route path="templateRemove" element={<MyProject/>} />
        </Route>
        <Route path="/editor" element={authenticated(<EditorLayout/>)}>
          <Route path="design" element={<Editor/>}>
            <Route index element={<Designer/>}/>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </Provider>
);

function NavigateFunctionComponent() {
  const { onLogout } = useAuth()
  injectLogoutHandler(onLogout);
  return <></>;
}
