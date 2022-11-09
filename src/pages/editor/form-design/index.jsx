import { useState } from "react";
import { IconShake } from "@arco-design/web-react/icon";
import SideNav from "@/components/SideNav";
import QuesTypeTab from "@/pages/editor/form-design/QuesTypeTab";
import { Outlet } from "react-router-dom";
import FdContextProvider from "@/pages/editor/form-design/FdContextProvider";
import styles from './style/index.module.less'
import OutlineTab from "@/pages/editor/form-design/OutlineTab";

function Editor() {
  const [collapse, setCollapse] = useState(false);

  return (
    <div className={styles['designer-container']}>
      <FdContextProvider>
        <SideNav collapse={collapse} setCollapse={setCollapse}>
          <SideNav.Menu activable uniqueKey={"key1"} icon={<IconShake/>} label="大纲"/>
          <SideNav.Menu activable uniqueKey={"key2"} icon={<IconShake/>} label="题型"/>
          <SideNav.Menu icon={<IconShake/>} label="题库"/>
          <SideNav.Menu icon={<IconShake/>} label="逻辑"/>
          <SideNav.Menu icon={<IconShake/>} label="设置"/>
          <SideNav.Menu icon={<IconShake/>} position="bottom"/>
          <SideNav.Menu icon={<IconShake/>} position="bottom" onClick={() => setCollapse(!collapse)}/>
          <SideNav.Tab matchKey={"key1"}>
            <OutlineTab/>
          </SideNav.Tab>
          <SideNav.Tab matchKey={"key2"}>
            <QuesTypeTab/>
          </SideNav.Tab>
        </SideNav>
        <div>
          {<Outlet/>}
        </div>
      </FdContextProvider>
    </div>
  );
}

export default Editor;