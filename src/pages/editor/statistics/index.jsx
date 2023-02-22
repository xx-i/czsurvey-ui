import styles from "@/pages/editor/form-design/style/index.module.less";
import SideNav from "@/components/SideNav";
import { IconDataTableBlock, IconDocument, IconNatGateway } from "@arco-iconbox/react-cz-icon";
import { Outlet } from "react-router-dom";
import { useState } from "react";

function Statistics() {
  const [collapse, setCollapse] = useState(false);
  return (
    <div className={styles['statistics-container']}>
        <SideNav active="QUES_TYPES" collapse={collapse} setCollapse={setCollapse}>
          <SideNav.Menu
            uniqueKey="OUTLINE"
            icon={<IconDocument />}
            label="数据概览"
          />
          <SideNav.Menu
            activable
            uniqueKey="QUES_TYPES"
            icon={<IconNatGateway />}
            label="数据详情"
          />
          <SideNav.Menu
            icon={<IconDataTableBlock />}
            label="统计图表"
          />
        </SideNav>
        <div>
          {<Outlet/>}
        </div>
    </div>
  );
}

export default Statistics;