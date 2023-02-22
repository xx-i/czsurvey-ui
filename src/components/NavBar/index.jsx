import styles from './style/index.module.less'
import logo from './assets/logo.png'
import { Avatar, Dropdown, Menu } from "@arco-design/web-react";
import { IconDown, IconMenu, IconPoweroff, IconUser } from "@arco-design/web-react/icon";
import { useAuth } from "@/utils/auth";
import { useSelector } from "react-redux";

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(1px)',
};

function NavBar({ children }) {

  const { onLogout } = useAuth();
  const { nickname, avatar } = useSelector(state => state.user)

  const userDropList = (
    <Menu>
      <Menu.Item key='1'><IconUser style={iconStyle} />个人中心</Menu.Item>
      <Menu.Item key='2' onClick={() => onLogout()}><IconPoweroff style={iconStyle} />退出登录</Menu.Item>
    </Menu>
  );

  const otherDropList = (
    <Menu>
      <Menu.Item key='1'><IconUser style={iconStyle} />帮助文档</Menu.Item>
    </Menu>
  );

  return (
    <div className={styles['site-header']}>
      <div className={styles['header-logo']}>
        <div className={styles['logo-inner']}>
          <img src={logo} alt="logo"/>
          <span>CZ SURVEY</span>
        </div>
      </div>
      <div className={styles['enter-layout']}>
        {children}
      </div>
      <div className={styles['nav-right']}>
        <Dropdown droplist={userDropList} trigger="click" position="bottom">
          <div className={styles['user-info-container']}>
            <Avatar className={styles['avatar']} size={32}>
              {avatar ? (<img alt="avatar" src={avatar}/>) : <IconUser />}
            </Avatar>
            <div className={styles['nickname']}>
              <span>{nickname}</span>
            </div>
            <IconDown/>
          </div>
        </Dropdown>
        <Dropdown droplist={otherDropList} trigger="click">
          <div className={styles['icon-drop-btn']}>
            <IconMenu />
          </div>
        </Dropdown>
      </div>
    </div>
  );
}

function Link({children, onClick, active}) {

  const handleClick = e => {
    onClick(e);
    e.preventDefault();
  }

  return (
    <a onClick={handleClick} className={`${styles['link-item']} ${active ? styles['line-item-active'] : ''}`} href="/">{children}</a>
  );
}

NavBar.Link = Link;

export default NavBar;