import { useEffect, useState } from "react";
import { IconMenuFold, IconMenuUnfold, IconSettings } from "@arco-design/web-react/icon";
import SideNav from "@/components/SideNav";
import QuestionTypeTab from "@/pages/editor/form-design/QuestionTypeTab";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import FdContextProvider from "@/pages/editor/form-design/FdContextProvider";
import styles from './style/index.module.less'
import OutlineTab from "@/pages/editor/form-design/OutlineTab";
import { IconDataTableBlock, IconDocument, IconHierarchy, IconNatGateway } from "@arco-iconbox/react-cz-icon";
import QuestionBankTab from "@/pages/editor/form-design/QuestionBankTab";

const PATH_TO_TAB_MAP = {
  '': 'QUES_TYPES',
  '/logic': 'LOGIC',
  '/setting': 'SETTING'
}

function Editor() {
  const [collapse, setCollapse] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = location.pathname.slice('/design'.length);
  const surveyId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState(PATH_TO_TAB_MAP[path]);
  const openTab = searchParams.get('openTab');

  useEffect(() => {
    openTab ? setActiveTab(openTab) : setActiveTab(PATH_TO_TAB_MAP[path]);
  }, [path, openTab]);

  const navigateToHome = (openTab) => {
    if (path !== '') {
      if (openTab) {
        navigate(`/design?id=${surveyId}&openTab=${openTab}`);
      } else {
        navigate(`/design?id=${surveyId}`);
      }
    }
  }
  // PATH_TO_TAB_MAP[path]
  return (
    <div className={styles['designer-container']}>
      <FdContextProvider>
        <SideNav active={activeTab} collapse={collapse} setCollapse={setCollapse}>
          <SideNav.Menu
            activable
            uniqueKey="OUTLINE"
            icon={<IconDocument />}
            label="大纲"
            onClick={() => navigateToHome('OUTLINE')}
          />
          <SideNav.Menu
            activable
            uniqueKey="QUES_TYPES"
            icon={<IconNatGateway />}
            label="题型"
            onClick={() => navigateToHome()}
          />
          <SideNav.Menu
            activable
            uniqueKey="QUES_BANK"
            icon={<IconDataTableBlock />}
            label="题库"
            onClick={() => navigateToHome('QUES_BANK')}
          />
          <SideNav.Menu
            activable
            uniqueKey="LOGIC"
            icon={<IconHierarchy />}
            label="逻辑"
            onClick={() => navigate(`/design/logic?id=${surveyId}`)}
          />
          <SideNav.Menu
            activable
            uniqueKey="SETTING"
            icon={<IconSettings />}
            label="设置"
            onClick={() => navigate(`/design/setting?id=${surveyId}`)}
          />
          {
            path === '' && <SideNav.Menu icon={collapse ? <IconMenuUnfold /> : <IconMenuFold />} position="bottom" onClick={() => setCollapse(!collapse)}/>
          }
          <SideNav.Tab matchKey="OUTLINE">
            <OutlineTab/>
          </SideNav.Tab>
          <SideNav.Tab matchKey="QUES_TYPES">
            <QuestionTypeTab/>
          </SideNav.Tab>
          <SideNav.Tab matchKey="QUES_BANK">
            <QuestionBankTab/>
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