import React, { createContext, useContext, useState } from "react";
import styles from "./style/index.module.less";
import classNames from "classnames";
import { Scrollbar } from 'react-scrollbars-custom';

const SideNavContext = createContext(null);

function SideNav({defaultActiveTab, collapse = true, setCollapse, children}) {
  const topMenus = [];
  const bottomMenus = [];
  const tabs = [];
  React.Children.forEach(children, child => {
    if (child && child.type) {
      if (child.type.isSideNavMenu) {
        child.props?.position === 'bottom' ? bottomMenus.push(child) : topMenus.push(child);
      }
      if (child.type.isSideNavTab) {
        tabs.push(child);
      }
    }
  });

  let firstActiveTab = topMenus.find(e => {
    const {props: {position, activable}} = e;
    return position !== 'bottom' && activable;
  });

  const [activeKey, setActiveKey] = useState(defaultActiveTab || (firstActiveTab && firstActiveTab.props.uniqueKey));
  const activeTab = tabs.find(e => e.props?.matchKey === activeKey);

  return (
    <SideNavContext.Provider value={{activeKey, setActiveKey, collapse, setCollapse}}>
      <div className={classNames(styles['side-nav'], collapse && styles['collapsed'])}>
        <div className={styles['container-wrapper']}>
          <div className={styles['menu-container']}>
            {topMenus}
          </div>
          <div className={styles['bottom-menu-container']}>
            {bottomMenus}
          </div>
        </div>
        {
          !collapse && activeTab && (
            <div className={styles['nav-tab-container']}>
              <Scrollbar
                style={{height: "100%", width: "100%"}}
                trackYProps={{
                  renderer: (props) => {
                    const { elementRef, ...restProps } = props;
                    return <span {...restProps} ref={elementRef} className={styles['scroll-bar-track']} />;
                  },
                }}
                thumbYProps={{
                  renderer: (props) => {
                    const { elementRef, ...restProps } = props;
                    return <div {...restProps} ref={elementRef} className={styles['scroll-bar-thumb']} />;
                  },
                }}
              >
                <div className={styles['nav-tab']}>
                  {activeTab}
                </div>
              </Scrollbar>
            </div>
          )
        }
      </div>
    </SideNavContext.Provider>
  );
}

function Menu({icon, label, uniqueKey, activable = false, onClick}) {
  
  const { activeKey, setActiveKey, collapse, setCollapse } = useContext(SideNavContext);

  function handleClick(event) {
    if (activable) {
      setActiveKey(uniqueKey);
      setCollapse(false);
    }
    onClick && onClick(event);
  }
  
  return (
    <div className=
      {
        classNames(
          styles['menu-item'],
          (!collapse && activable && uniqueKey === activeKey) && styles['activated-menu']
        )
      }
      role='button'
      onClick={handleClick}
    >
      {icon}
      {label && <span className={styles['menu-text']}>{label}</span>}
    </div>
  );
}

Menu.isSideNavMenu = true;

SideNav.Menu = Menu;

function Tab({matchKey, children}) {
  return <>{children}</>;
}

Tab.isSideNavTab = true;

SideNav.Tab = Tab;

export default SideNav;