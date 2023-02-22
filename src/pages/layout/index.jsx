import { Button, Dropdown, Input, Layout, Menu, Modal } from "@arco-design/web-react";
import NavBar from "@/components/NavBar";
import styles from './style/index.module.less'
import {
  IconClockCircle, IconDelete, IconDriveFile, IconFolder,
  IconLeft,
  IconPlus, IconRight,
  IconUser
} from "@arco-design/web-react/icon";
import { createContext, useEffect, useState } from "react";
import request from "@/utils/request";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setBreadCrumb } from "@/store/breadCrumbSlice";
import { useLoading } from "@/components/Loading";
import { Set } from 'immutable'
import qs from 'qs';

export const LayoutContext = createContext(null);

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const menus = {
  workbench: [
    // {
    //   key: 'recent',
    //   name: '最近',
    //   icon: <IconClockCircle/>
    // },
    {
      key: 'mine',
      name: '我创建的',
      icon: <IconUser/>,
      defaultOpen: true
    },
    {
      key: 'recycle',
      name: '回收站',
      icon: <IconDelete/>,
      leafNode: true
    }
  ],
  templateLib: [
    {
      key: 'templateAdd',
      name: '模板概览',
      icon: <IconClockCircle/>,
      defaultOpen: true
    },
    {
      key: 'templateRemove',
      name: '最近使用',
      icon: <IconDelete/>
    }
  ]
}

const leafNodeMenuKey = Set(['recycle']);

const renderMenus = (key, data = []) => {
  return menus[key].map(router => {
    if (!router.children?.length && (router.key !== 'mine' || data.length === 0)) {
      return (
        <MenuItem key={router.key}>{router.icon}{router.name}</MenuItem>
      );
    } else {
      return (
        <SubMenu
          className="arco-sub-menu"
          key={router.key}
          selectable={router.key === 'mine'}
          title={<>{router.icon}{router.name}</>}
        >
          {
            router.key === 'mine' ? data.map(folder => <MenuItem key={`mine.${folder.id}`}><IconFolder />{folder.name}</MenuItem>)
              : router.children.map(children => <MenuItem key={children.key}>{children.icon}{children.name}</MenuItem>)
          }
        </SubMenu>
      )
    }
  })
}

const getMenuKey = path => {
  let splitPath = path.startsWith('/') ? path.slice(1) : path;
  return splitPath.replace('/', '.') || 'mine';
}

// 获取顶部导航菜单名称
const getTopMenu = path => {
  const menuKey = getMenuKey(path);
  const topMenus = Object.keys(menus);
  for (let index in topMenus) {
    if (menus[topMenus[index]].findIndex(m => m.key === menuKey) !== -1) {
      return topMenus[index];
    }
  }
  return 'workbench';
}

function PageLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [createFolderParam, setCreateFolderParam] = useState("新建文件夹");
  const [folder, setFolder] = useState([]);
  const [deletedFolder, setDeletedFolder] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [topMenu, setTopMenu] = useState(getTopMenu(location.pathname));
  const [selectKeys, setSelectKeys] = useState([getMenuKey(location.pathname)]);
  const [createdFolderSuccessFlag, setCreatedFolderSuccessFlag] = useState(false);
  const {setLoading} = useLoading();
  let dispatch = useDispatch();

  const createFolder = () => {
    setConfirmLoading(true);
    request
      .post('/project/folder', {folderName: createFolderParam})
      .then(res => {
        handleModalClose();
        setCreatedFolderSuccessFlag(!createdFolderSuccessFlag);
        fetchMyFolder();
      })
      .finally(() => {
        handleModalClose();
      });
  };

  const fetchMyFolder = () => {
    request
      .get('/project/myAllFolder')
      .then(res => {
        setFolder(res.data.filter(folder => !folder.deleted));
        setDeletedFolder(res.data.filter(folder => folder.deleted));
        if (res.data.length > 0) {
          setOpenKeys(['mine']);
        }
      });
  }

  const handleModalClose = () => {
    setVisible(false);
    setConfirmLoading(false);
    setCreateFolderParam('新建文件夹');
  }

  const changeBreadCrumb = (key) => {
    let keys = key.split('.');
    let menu;
    for (let mk in menus) {
      menu = menus[mk].find(e => e.key === keys[0]);
      if (menu) break;
    }
    let breadCrumb = [{path: '/' + menu.key, name: menu.name}];
    if (keys.length > 1) {
      if (menu.key === 'mine') {
        let currentFolder = folder.find(e => e.id === keys[1]);
        if (currentFolder) {
          breadCrumb.push({path: `/mine/${currentFolder.id}`, name: currentFolder.name});
        }
      } else if (menu.key === 'recycle') {
        let currentFolder = deletedFolder.find(e => e.id === keys[1]);
        if (currentFolder) {
          breadCrumb.push({path: `/mine/${currentFolder.id}`, name: currentFolder.name});
        }
      } else {
        let subMenu = menu.children.find(e => e.key === key);
        breadCrumb.push({path: '/' + key.replace('.', '/'), name: subMenu.name});
      }
    }
    dispatch(setBreadCrumb(breadCrumb));
  };

  const handleClickMenuItem = (key) => {
    changeBreadCrumb(key);
    navigate('/' + key.replace('.', '/'));
  }

  useEffect(() => {
    if (topMenu === 'workbench') {
      fetchMyFolder();
    }
  }, [topMenu]);

  const onTopMenuLinkClick = (topMenu) => {
    let defaultOpenMenu = menus[topMenu].find(e => e.defaultOpen === true)
    if (defaultOpenMenu) {
      navigate('/' + defaultOpenMenu.key.replace('.', '/'));
    } else {
      navigate('/' + menus[topMenu][0].key.replace('.', '/'));
    }
  };

  useEffect(() => {
    setTopMenu(getTopMenu(location.pathname));
    changeBreadCrumb(getMenuKey(location.pathname));
    let key = getMenuKey(location.pathname);
    let splitKeys = key.split('.');
    if (leafNodeMenuKey.contains(splitKeys[0])) {
      setSelectKeys([splitKeys[0]]);
    } else {
      setSelectKeys([key]);
    }
    if (splitKeys.length > 1 && splitKeys[0] === 'mine') {
      setOpenKeys(['mine']);
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  const createSurvey = () => {
    setLoading(true);
    const menuKey = getMenuKey(location.pathname);
    const splitKeys = menuKey.split('.');
    let folderId = 0;
    if (splitKeys.length > 1 && splitKeys[0] === 'mine') {
      folderId = splitKeys[1];
    }
    request
      .post('/survey', {folderId})
      .then(res => {
        const {data: {id}} = res;
        navigate(`/design?${qs.stringify({id})}`);
      })
      .catch(() => setLoading(false));
  }

  const createDropList = (
    <Menu className={styles['btn-menu']}>
      <Menu.Item key='1' onClick={() => createSurvey()}><IconDriveFile />空白问卷</Menu.Item>
      <Menu.Item
        key='2'
        disabled={selectKeys.length === 0 || selectKeys[selectKeys.length - 1] !== 'mine'}
        onClick={() => setVisible(true)}
      >
        <IconFolder />
        新建文件夹
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ height: '100%' }}>
      <Layout.Header>
        <NavBar>
          <NavBar.Link
            onClick={() => onTopMenuLinkClick('workbench')}
            active={topMenu === 'workbench'}
          >
            工作台
          </NavBar.Link>
          <NavBar.Link
            onClick={() => onTopMenuLinkClick('templateLib')}
            active={topMenu === 'templateLib'}
          >
            模板库
          </NavBar.Link>
        </NavBar>
      </Layout.Header>
      <Layout>
        <Layout.Sider
          collapsible={true}
          collapsed={collapsed}
          collapsedWidth={72}
          className={styles['side-bar']}
          width={240}
          trigger={null}
        >
          <Button className={styles['collapse-btn']} icon={collapsed ? <IconRight/> : <IconLeft/>} onClick={() => setCollapsed(!collapsed)}></Button>
          {
            topMenu === 'workbench' && (
              <div className={styles['create-btn']}>
                <Dropdown droplist={createDropList} trigger='click' position="bottom">
                  <Button type='primary'>
                    {!collapsed && <span className={styles['create-text']}>新建</span>}
                    <span><IconPlus/></span>
                  </Button>
                </Dropdown>
              </div>
            )
          }
          <Menu
            className={styles['side-menu']}
            collapse={collapsed}
            selectedKeys={selectKeys}
            onClickMenuItem={handleClickMenuItem}
            openKeys={openKeys}
            onClickSubMenu={(_, openKeys) => {setOpenKeys(openKeys)}}
          >
            {renderMenus(topMenu, folder)}
          </Menu>
        </Layout.Sider>
        <LayoutContext.Provider value={{createdFolderSuccessFlag, fetchMyFolder, folder}}>
          <Layout.Content className={styles['layout-content']}>
            <Outlet/>
          </Layout.Content>
        </LayoutContext.Provider>
      </Layout>
      <Modal
        style={{width: '420px'}}
        title='创建文件夹'
        visible={visible}
        confirmLoading={confirmLoading}
        onOk={createFolder}
        onCancel={handleModalClose}
        autoFocus={false}
        focusLock={true}
      >
        <Input size="large" value={createFolderParam} onChange={v => {setCreateFolderParam(v)}}/>
      </Modal>
    </Layout>
  )
}

export default PageLayout;