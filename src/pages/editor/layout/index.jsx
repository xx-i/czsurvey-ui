import styles from './style/index.module.less'
import { Avatar, Button, Divider, Dropdown, Menu, Switch } from "@arco-design/web-react";
import {
  IconArrowRight,
  IconDown, IconEdit,
  IconFullscreen,
  IconImport,
  IconMenu,
  IconPoweroff, IconShareAlt,
  IconUser
} from "@arco-design/web-react/icon";
import logo from "./assets/logo.png"
import { useAuth } from "@/utils/auth";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { Scrollbar } from 'react-scrollbars-custom';

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(1px)',
};

function EditorLayout() {

  const { onLogout } = useAuth();
  const { nickname } = useSelector(state => state.user)

  const userDropList = (
    <Menu>
      <Menu.Item key='1'><IconUser style={iconStyle} />个人中心</Menu.Item>
      <Menu.Item key='2' onClick={() => onLogout()}><IconPoweroff style={iconStyle} />退出登录</Menu.Item>
    </Menu>
  );

  return (
    <div>
      <div className={`${styles['editor-nav']} ${styles['nav-top']}`}>
        <div className={styles['nav-left-container']}>
          <a href='/' className={styles['nav-logo']}>
            <img src={logo} alt="logo" />
          </a>
          <Button type='text' icon={<IconImport />}>退出编辑</Button>
        </div>
        <div className={styles['nav-center-container']}>
          个人空间 / 问卷标题
        </div>
        <div className={styles['nav-right-container']}>
          <Dropdown droplist={userDropList} trigger="click" position="bottom">
            <div className={styles['user-info-container']}>
              <Avatar style={{ backgroundColor: '#3370ff', marginRight: '8px' }} size={32}>
                <IconUser />
              </Avatar>
              <div className={styles['nickname']}>
                <span>{nickname}</span>
              </div>
              <IconDown/>
            </div>
          </Dropdown>
          <Dropdown droplist={userDropList} trigger="click">
            <div className={styles['icon-drop-btn']}>
              <IconMenu />
            </div>
          </Dropdown>
        </div>
      </div>
      <div className={`${styles['editor-nav']} ${styles['nav-second']}`}>
        <div className={styles['nav-left-container']}>
          <IconFullscreen style={{fontSize: '24px'}} />
        </div>
        <div className={styles['nav-center-container']}>
          <div className={styles['next']}>编辑</div>
          <div className={styles['next']}><IconArrowRight /></div>
          <div className={styles['next']}>设置</div>
          <div className={styles['next']}><IconArrowRight /></div>
          <div className={styles['next']}>分享</div>
          <div className={styles['next']}><IconArrowRight /></div>
          <div className={styles['next']}>统计</div>
        </div>
        <div className={styles['nav-right-container']}>
          <Switch checkedText='允许提交' uncheckedText='禁止提交' defaultChecked />
          <Divider type='vertical' />
          <Button type='outline' style={{marginRight: '8px'}} icon={<IconEdit />}>试答问卷</Button>
          <Button type='primary' icon={<IconShareAlt />}>分享问卷</Button>
        </div>
      </div>
      <div className={styles['editor-main']}>
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
          <div className={styles['editor-main-container']}>
            <Outlet/>
          </div>
        </Scrollbar>
      </div>
    </div>
  );
}

export default EditorLayout;