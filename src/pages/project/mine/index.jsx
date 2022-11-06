import styles from './style/index.module.less'
import {
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Input,
  Link,
  Menu,
  Select,
  Space,
  Spin
} from "@arco-design/web-react";
import {
  IconClockCircle,
  IconEdit,
  IconMore,
  IconPauseCircle,
  IconRight
} from "@arco-design/web-react/icon";
import { Scrollbars } from 'react-custom-scrollbars';
import { useNavigate, useParams } from "react-router-dom";
import request from "@/utils/request";
import { useEffect, useRef, useState } from "react";

import ProjectCard from "@/components/ProjectCard";
import FolderCard from "@/components/FolderCard";
import { formatTime } from "@/utils/time";
import { useSelector } from "react-redux";

const dropList = (
  <Menu>
    <Menu.Item key='1'>重命名</Menu.Item>
    <Menu.Item key='2'>移动到回收站</Menu.Item>
  </Menu>
);

function MyProject() {

  const { folderId } = useParams();
  let breadCrumb = useSelector(state => state.breadCrumb.current);
  let navigate = useNavigate();
  const refDrawerWrapper = useRef(null);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [projectQueryParam, setProjectQueryParam] = useState({
    status: '',
    name: '',
    order: 'updateTime,desc',
    page: 0,
    pageSize: 10,
  });

  const fetchMyProjects = (showLoading = false) => {
    showLoading && setLoading(true);
    request
      .get('/project/page/mine', {params: {...projectQueryParam, folderId}})
      .then(res => {
        showLoading && setLoading(false);
        setMyProjects(res.data);
      }).finally(() => {
      showLoading && setLoading(false);
    })
  };

  useEffect(() => {
    fetchMyProjects(true);
    // eslint-disable-next-line
  }, [projectQueryParam, folderId]);

  const handleScrollFrame = (e) => {
    if (e.top > 0.8) {

    }
  }

  const handleInputEnterDown = (event) => {
    if (event.keyCode === 13) {
      setProjectQueryParam({...projectQueryParam, name: event.target.value});
    }
  }

  const handleClearParam = (restParam, restPage = false) => {
    let queryParam = {...projectQueryParam, ...restParam};
    if (restPage) {
      queryParam = {...queryParam, page: 0, pageSize: 10};
    }
    setProjectQueryParam(queryParam);
  }

  const renderBreadCrumb = () => {
    if (breadCrumb.length === 1) {
      return (<span>{breadCrumb[0].name}</span>);
    } else if (breadCrumb.length === 2) {
      return (
        <>
          <span style={{color: '#0F6BFF', cursor: 'pointer'}} onClick={() => navigate(breadCrumb[0].path)}>{breadCrumb[0].name}</span>
          <IconRight style={{color: '#CDCDCD', margin: '0 5px'}} />
          <span>{breadCrumb[1].name}</span>
        </>
      );
    }
  }

  return (
    <div ref={refDrawerWrapper}>
      <div className={styles['title-nav']}>
        <span className={styles['header-title']}>
          {renderBreadCrumb()}
        </span>
        <div className={styles['nav-right']}>
          <Space>
            <Input
              style={{width: '180px'}}
              allowClear placeholder="项目搜索"
              onClear={() => handleClearParam({name: ''}, true)}
              onKeyDown={handleInputEnterDown}
            />
            <Select
              placeholder="项目状态"
              style={{width: '120px'}}
              allowClear
              onClear={() => handleClearParam({status: ''}, true)}
              onChange={(value) => setProjectQueryParam({...projectQueryParam, status: value})}
            >
              <Select.Option value="CLOSE">未发布</Select.Option>
              <Select.Option value="PUBLISH">收集中</Select.Option>
            </Select>
            <Select
              style={{width: '160px'}}
              defaultValue="updateTime,desc"
              onChange={(value) => setProjectQueryParam({...projectQueryParam, sort: value})}
            >
              <Select.Option value="updateTime,desc">按修改时间排序</Select.Option>
              <Select.Option value="createTime,asc">按创建时间排序</Select.Option>
            </Select>
          </Space>
        </div>
      </div>
      <Spin loading={loading} style={{width: '100%'}}>
        {
          myProjects.length ? (
            <Scrollbars style={{height: 'calc(100vh - 80px)', width: '100%'}} onScrollFrame={handleScrollFrame}>
              <div className={styles['project-content']}>
                {
                  myProjects.map(data => {
                    let { project, status, quantityCollected } = data;
                    let createTime = formatTime(new Date(project.createTime), '{y}年{m}月{d}日');
                    if (project.ownerType === 'FOLDER') {
                      return (
                        <div key={project.id} className={styles['content-wrapper']}>
                          <FolderCard onClick={() => navigate(`/mine/${project.id}`)} name={project.name} createTime={createTime}>
                            <Dropdown droplist={dropList} trigger='click' position='bl'>
                              <Link href='#' onClick={e => e.stopPropagation()} icon={<IconMore />}/>
                            </Dropdown>
                          </FolderCard>
                        </div>
                      );
                    } else if (project.ownerType === 'SURVEY') {
                      return (
                        <div key={project.id} className={styles['content-wrapper']}>
                          <ProjectCard
                            onClick={() => setDrawerVisible(true)}
                            name={project.name}
                            status={status}
                            createTime={createTime}
                            quantityCollected={quantityCollected}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                              <Link href='#' icon={<IconPauseCircle />}>停止</Link>
                              <Link href='#' icon={<IconEdit />}>编辑</Link>
                              <Link href='#' icon={<IconClockCircle />}>统计</Link>
                              <Link href='#' icon={<IconMore />}/>
                            </div>
                          </ProjectCard>
                        </div>
                      )
                    } else {
                      return <></>
                    }
                  })
                }
              </div>
            </Scrollbars>
          ) : (
            <div className={styles['exception-content']}>
              <div>
                <div className={styles['exception-img']}></div>
                <div className={styles['exception-text']}>
                  <span>
                    {
                      projectQueryParam.name !== '' ? '没有找到你要的东西，换个关键词试试…'
                        : projectQueryParam.status !== '' ? '暂未找到对应的项目，请查看全部项目'
                        : '暂无项目，点击左上角「新建项目」'
                    }
                  </span>
                </div>
              </div>
            </div>
          )
        }
      </Spin>
      <Drawer
        className={styles['project-drawer']}
        width={400}
        title='问卷标题'
        visible={drawerVisible}
        mask={false}
        getPopupContainer={() => refDrawerWrapper && refDrawerWrapper.current}
        footer={null}
        onOk={() => {setDrawerVisible(false);}}
        onCancel={() => {setDrawerVisible(false);}}
      >
        <div className={styles['drawer-content']}>
          <div className={styles['general-chart']}>
            <div className={styles['general-chart-header']}>
              近30天回收概况
              <span>总回收量:2</span>
            </div>
          </div>
          <Descriptions
            colon=''
            column={1}
            labelStyle={{ width: 100 }}
            valueStyle={{textAlign: 'right'}}
            data={[
              {
                label: '基本信息',
                value: '共10题',
              },
              {
                label: '问卷状态',
                value: '已暂停',
              },
              {
                label: '修改时间',
                value: '2022-09-12',
              },
              {
                label: '创建时间',
                value: '2022-09-14',
              },
            ]}
          />
          <Divider style={{margin: '2px 0'}} />
          <div className={styles['drawer-button-group']}>
            <div className={styles['bottom-button']}>
              <IconPauseCircle />
              <div className={styles['button-text']}>停止</div>
            </div>
            <div className={styles['bottom-button']}>
              <IconEdit />
              <div className={styles['button-text']}>编辑</div>
            </div>
            <div className={styles['bottom-button']}>
              <IconClockCircle />
              <div className={styles['button-text']}>统计</div>
            </div>
            <div className={styles['bottom-button']}>
              <IconMore />
              <div className={styles['button-text']}>更多</div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default MyProject;