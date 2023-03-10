import styles from './style/index.module.less'
import {
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Input,
  Link,
  Menu, Message, Modal,
  Select,
  Space,
  Spin
} from "@arco-design/web-react";
import {
  IconClockCircle, IconDelete,
  IconEdit, IconFolder,
  IconMore,
  IconPauseCircle, IconPlayCircle,
  IconRight, IconUndo
} from "@arco-design/web-react/icon";
import { useNavigate, useParams } from "react-router-dom";
import request from "@/utils/request";
import { useContext, useEffect, useRef, useState } from "react";

import ProjectCard from "@/components/ProjectCard";
import FolderCard from "@/components/FolderCard";
import { formatTime } from "@/utils/time";
import { useSelector } from "react-redux";
import { LayoutContext } from "@/pages/layout";
import { Scrollbar } from "react-scrollbars-custom";
import { copyToClipboard } from "@/utils/copy";

function MyProject({isTrash = false}) {

  const { folderId } = useParams();
  const { createdFolderSuccessFlag, fetchMyFolder, folder } = useContext(LayoutContext);
  let breadCrumb = useSelector(state => state.breadCrumb.current);
  let navigate = useNavigate();
  const scrollRef = useRef(null);
  const refDrawerWrapper = useRef(null);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [projectQueryParam, setProjectQueryParam] = useState({
    status: '',
    name: '',
    sort: 'updateTime,desc',
    page: 0,
    pageSize: 10,
    trash: isTrash
  });
  const [pagination, setPagination] = useState({page: 0, hasMore: true});
  const [selectedProject, setSelectedProject] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameFolderParam, setRenameFolderParam] = useState(null);
  const [renameSurveyParam, setRenameSurveyParam] = useState(null);
  const [changeProjectStatusVisible, setChangeProjectStatusVisible] = useState(false);
  const [modalConfirmLoading, setModalConfirmLoading] = useState(false);
  const [clearDataModalVisible, setClearDataModalVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [moveProjectModalVisible, setMoveProjectModalVisible] = useState(false);
  const [moveToTrashModalVisible, setMoveToTrashVisible] = useState(false);
  const [reloadProjectsFlag, setReloadProjectsFlag] = useState(false);
  const [selectedDrawerProject, setSelectedDrawerProject] = useState(null);
  const [recoverProjectVisible, setRecoverProjectVisible] = useState(false);
  const [deleteProjectVisible, setDeleteProjectVisible] = useState(false);

  // ??????????????????
  useEffect(() => {
    if (reloadProjectsFlag) {
      setPagination({page: 0, hasMore: true});
      setMyProjects([]);
      setReloadProjectsFlag(false);
      return;
    }
    if (loading) {
      return;
    }
    if (pagination.hasMore && scrollRef) {
      setLoading(true);
      request
        .get('/project/page/mine', {params: {...projectQueryParam, folderId, size: 50, page: pagination.page}})
        .then(res => {
          const projects = res.data;
          if (projects.length === 0) {
            setPagination({...pagination, hasMore: false});
          } else {
            setMyProjects([...myProjects, ...res.data]);
            if (scrollRef.current.scrollHeight <= scrollRef.current.clientHeight + 400) {
              setPagination({...pagination, page: pagination.page + 1});
            }
          }
          setLoading(false);
        }).finally(() => {
          setLoading(false);
        })
    }
    // eslint-disable-next-line
  }, [scrollRef, pagination, reloadProjectsFlag]);

  // ??????????????????
  useEffect(() => {
    setReloadProjectsFlag(true);
  }, [projectQueryParam, folderId, createdFolderSuccessFlag]);

  useEffect(() => {
    const initParam = {
      status: '',
      name: '',
      order: 'updateTime,desc',
      page: 0,
      pageSize: 10
    };
    setProjectQueryParam(isTrash ? {trash: true} : initParam);
  }, [isTrash]);

  // ??????????????????????????????????????????
  const onScrollStop = e => {
    const {scrollTop, contentScrollHeight, clientHeight} = e;
    if (scrollTop + clientHeight >= contentScrollHeight - 200 && !loading && pagination.hasMore) {
      setPagination({...pagination, page: pagination.page + 1});
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

  // ????????????????????????
  const handleOpenRenameModal = (data) => {
    if (!data) {
      return ;
    }
    const {project} = data;
    return () => {
      setRenameModalVisible(true);
      setSelectedProject(project);
      if (project.ownerType === 'FOLDER') {
        setRenameFolderParam({folderName: project.name});
      } else if (project.ownerType === 'SURVEY') {
        setRenameSurveyParam({surveyTitle: project.name});
      }
    }
  }

  const handleRenameModalCancel = () => {
    setRenameModalVisible(false);
    setSelectedProject(null);
    setRenameFolderParam(null);
  }

  // ???????????????
  const handleRenameProject = () => {
    setModalConfirmLoading(true);
    let remoteUrl;
    let payLoad;
    const type = selectedProject?.ownerType;
    if (type === 'FOLDER') {
      remoteUrl = `/project/folder/${selectedProject.id}/name`;
      payLoad = renameFolderParam;
      if (payLoad.folderName === '') {
        Message.error('???????????????????????????');
        setModalConfirmLoading(false);
        return;
      }
    } else {
      remoteUrl = `/survey/${selectedProject.ownerId}/title`;
      payLoad = renameSurveyParam;
      if (payLoad.surveyTitle === '') {
        Message.error('????????????????????????');
        setModalConfirmLoading(false);
        return;
      }
    }
    const name = type === 'FOLDER' ? payLoad.folderName : payLoad.surveyTitle;
    request
      .put(remoteUrl, payLoad)
      .then(() => {
        setModalConfirmLoading(false);
        handleRenameModalCancel();
        const projects = myProjects.map(project => {
          if (project.project.id === selectedProject.id) {
            return {...project, project: {...project.project, name}};
          }
          return project;
        });
        setMyProjects(projects);
        if (selectedDrawerProject && selectedDrawerProject.project.id === selectedProject.id) {
          setSelectedDrawerProject({...selectedDrawerProject, project: {...selectedDrawerProject.project, name}});
        }
        fetchMyFolder();
      })
      .catch(() => {
        Message.error('???????????????');
      })
      .finally(() => {
        setModalConfirmLoading(false);
      })
  }

  // ???????????????????????????
  const handleMoveToTrash = () => {
    setModalConfirmLoading(true);
    request
      .delete(`/project/${selectedProject.id}/moveToTrash`)
      .then(() => {
        setModalConfirmLoading(false);
        setMoveToTrashVisible(false);
        setMyProjects(myProjects.filter(data => data.project.id !== selectedProject.id));
        if (selectedProject.ownerType === 'FOLDER') {
          fetchMyFolder();
        }
        if (
          drawerVisible
          && selectedDrawerProject
          && selectedDrawerProject.project.id === selectedProject.id
        ) {
          setDrawerVisible(false);
        }
        Message.success('????????????????????????');
      })
      .catch(err => {
        setModalConfirmLoading(false);
        setMoveToTrashVisible(false);
        Message.error('????????????????????????');
        console.error(err);
      })
  }

  // ??????????????????????????????
  const clearAllSurveyData = () => {
    setModalConfirmLoading(true);
    request
      .delete('/survey/answer/clearData', {params: {surveyId: selectedProject.ownerId}})
      .then(() => {
        setModalConfirmLoading(false);
        Message.info('?????????????????????????????????');
      })
      .catch(() => {
        setModalConfirmLoading(false);
        Message.error('??????????????????');
      })
      .finally(() => {
        setClearDataModalVisible(false);
      })
  }

  // ????????????????????????
  const createFolderDropList = (project) => {
    if (isTrash) {
      return (
        <Menu onClick={(e) => e.stopPropagation()}>
          <Menu.Item
            key='1'
            onClick={() => {
              setSelectedProject(project.project)
              setRecoverProjectVisible(true);
            }}
          >
            ??????
          </Menu.Item>
          <Menu.Item
            key='2'
            onClick={() => {
              setSelectedProject(project.project);
              setDeleteProjectVisible(true);
            }}
          >
            ????????????
          </Menu.Item>
        </Menu>
      );
    }
    return (
      <Menu onClick={(e) => e.stopPropagation()}>
        <Menu.Item key='1' onClick={handleOpenRenameModal(project)}>?????????</Menu.Item>
        <Menu.Item
          key='2'
          onClick={() => {
            setSelectedProject(project.project);
            setMoveToTrashVisible(true);
          }}
        >
          ??????????????????
        </Menu.Item>
      </Menu>
    );
  };

  // ?????????????????????
  const createSurveyDropList = (project) => {
    const getMoveProject = () => {
      if (folderId) {
        return (
          <Menu.Item
            key='4'
            onClick={() => {
              setSelectedProject(project.project);
              setMoveProjectModalVisible(true);
            }}
          >
            ???????????????
          </Menu.Item>
        );
      } else if (folder.length > 0) {
        return (
          <Menu.SubMenu key='4' title="??????">
            {
              folder.map(folder => {
                return (
                  <Menu.Item
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setSelectedProject(project.project);
                      setMoveProjectModalVisible(true);
                    }}
                  >
                    <IconFolder className={styles['menu-icon']} />
                    {folder.name}
                  </Menu.Item>
                );
              })
            }
          </Menu.SubMenu>
        );
      } else {
        return (
          <Menu.Item key='4' disabled>
            ??????
          </Menu.Item>
        );
      }
    }

    return (
      <Menu onClick={(e) => e.stopPropagation()}>
        <Menu.Item
          key='1'
          onClick={() => {
            const surveyId = project.project.ownerId;
            copyToClipboard(`${process.env.REACT_APP_PROJECT_LOCATION}/s?id=${surveyId}`);
            Message.success('????????????????????????');
          }}
        >
          ??????????????????
        </Menu.Item>
        <Menu.Item key='2' onClick={handleOpenRenameModal(project)}>?????????</Menu.Item>
        <Menu.Item key='3' onClick={() => {
          setSelectedProject(project.project);
          setClearDataModalVisible(true);
        }}>
          ????????????
        </Menu.Item>
        {getMoveProject()}
        <Menu.Item
          key='5'
          onClick={() => {
            setSelectedProject(project.project);
            setMoveToTrashVisible(true);
          }}
        >
          ??????????????????
        </Menu.Item>
      </Menu>
    );
  }

  // ????????????????????????
  const changeSurveyStatus = () => {
    const status = selectedProject?.status === 'CLOSE' ? 'PUBLISH' : 'CLOSE';
    setModalConfirmLoading(true);
    request
      .put('/survey/status', {surveyId: selectedProject?.ownerId, status})
      .then(() => {
        const projects = myProjects.map(data => {
          if (data.project.id === selectedProject.id) {
            return {...data, status};
          }
          return data;
        });
        if (selectedDrawerProject && selectedDrawerProject.project.id === selectedProject.id) {
          setSelectedDrawerProject({...selectedDrawerProject, status});
        }
        setModalConfirmLoading(false);
        setMyProjects(projects);
      })
      .catch(err => {
        setModalConfirmLoading(false);
        Message.error('????????????');
        console.error(err);
      })
  }

  // ????????????????????????
  const moveProject = () => {
    setModalConfirmLoading(true);
    const to = selectedProject.id ? 0 : selectedFolder.id;
    request
      .put('/project/move', {projectId: selectedProject.id, to})
      .then(() => {
        setMyProjects(myProjects.filter(data => data.project.id !== selectedProject.id));
        setModalConfirmLoading(false);
        setMoveProjectModalVisible(false);
        Message.success('??????????????????');
        if (
          drawerVisible
          && selectedDrawerProject
          && selectedDrawerProject.project.id === selectedProject.id
        ) {
          setDrawerVisible(false);
        }
      })
      .catch(() => {
        setModalConfirmLoading(false);
        setMoveProjectModalVisible(false);
        Message.error('??????????????????');
      })
  }

  // ????????????
  const recoverProject = () => {
    setModalConfirmLoading(true)
    request
      .put(`/project/recover/${selectedProject?.id}`)
      .then(() => {
        setModalConfirmLoading(false);
        setMyProjects(myProjects.filter(data => data.project.id !== selectedProject.id));
        setRecoverProjectVisible(false);
        if (selectedProject?.ownerType === 'FOLDER') {
          fetchMyFolder();
        }
        if (
          drawerVisible
          && selectedDrawerProject
          && selectedDrawerProject.project.id === selectedProject.id
        ) {
          setDrawerVisible(false);
        }
      })
      .catch(err => {
        setModalConfirmLoading(false);
        setRecoverProjectVisible(false);
        Message.error('??????????????????');
        console.error(err);
      })
  }

  // ??????????????????
  const deletedProject = () => {
    setModalConfirmLoading(true);
    request
      .delete(`/project/${selectedProject?.id}`)
      .then(() => {
        setModalConfirmLoading(false);
        setMyProjects(myProjects.filter(data => data.project.id !== selectedProject.id));
        setDeleteProjectVisible(false);
        if (selectedProject?.ownerType === 'FOLDER') {
          fetchMyFolder();
        }
        if (
          drawerVisible
          && selectedDrawerProject
          && selectedDrawerProject.project.id === selectedProject.id
        ) {
          setDrawerVisible(false);
        }
      })
      .catch(err => {
        setModalConfirmLoading(false);
        setDeleteProjectVisible(false);
        Message.error('??????????????????');
        console.error(err);
      })
  }

  const getEmptyStateTip = () => {
    if (isTrash) {
      return '????????????????????????';
    } else if (projectQueryParam.name !== '') {
      return '??????????????????????????????????????????????????????';
    } else if (projectQueryParam.status !== '') {
      return '???????????????????????????????????????????????????';
    } else {
      return '????????????????????????????????????????????????'
    }
  }

  // ????????????????????????
  const descriptionsData = [
    {
      label: '????????????',
      value: `???${selectedDrawerProject?.questionCount}???`,
    },
    {
      label: '????????????',
      value: selectedDrawerProject?.status === 'CLOSE' ? '?????????' : '?????????',
    },
    {
      label: '????????????',
      value: selectedDrawerProject?.project?.updateTime
    },
    {
      label: '????????????',
      value: selectedDrawerProject?.project?.createTime,
    },
  ];

  return (
    <div ref={refDrawerWrapper}>
      <div className={styles['title-nav']}>
        <span className={styles['header-title']}>
          {renderBreadCrumb()}
        </span>
        {
          !isTrash
          && (
            <div className={styles['nav-right']}>
              <Space>
                <Input
                  style={{width: '180px'}}
                  allowClear placeholder="????????????"
                  onClear={() => handleClearParam({name: ''}, true)}
                  onKeyDown={handleInputEnterDown}
                />
                <Select
                  placeholder="????????????"
                  style={{width: '120px'}}
                  allowClear
                  onClear={() => handleClearParam({status: ''}, true)}
                  onChange={(value) => setProjectQueryParam({...projectQueryParam, status: value})}
                >
                  <Select.Option value="CLOSE">?????????</Select.Option>
                  <Select.Option value="PUBLISH">?????????</Select.Option>
                </Select>
                <Select
                  style={{width: '160px'}}
                  defaultValue="updateTime,desc"
                  onChange={(value) => setProjectQueryParam({...projectQueryParam, sort: value})}
                >
                  <Select.Option value="updateTime,desc">?????????????????????</Select.Option>
                  <Select.Option value="createTime,asc">?????????????????????</Select.Option>
                </Select>
              </Space>
            </div>
          )
        }
      </div>
      <Spin loading={loading} style={{width: '100%'}}>
        <Scrollbar
          ref={scrollRef}
          style={{height: 'calc(100vh - 80px)', width: '100%'}}
          disableTrackYWidthCompensation
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
          onScrollStop={onScrollStop}
        >
          {
            myProjects.length ? (
              <div className={styles['project-content']}>
                {
                  myProjects.map(data => {
                    let { project, status, quantityCollected } = data;
                    let createTime = formatTime(new Date(project.createTime), '{y}???{m}???{d}???');
                    if (project.ownerType === 'FOLDER') {
                      return (
                        <div key={project.id} className={styles['content-wrapper']}>
                          <FolderCard onClick={() => navigate(`/${isTrash ? 'recycle' : 'mine'}/${project.id}`)} name={project.name} createTime={createTime}>
                            <Dropdown droplist={createFolderDropList(data)} trigger='click' position='bl'>
                              <Link href='#' onClick={e => e.stopPropagation()} icon={<IconMore />}/>
                            </Dropdown>
                          </FolderCard>
                        </div>
                      );
                    } else if (project.ownerType === 'SURVEY') {
                      return (
                        <div key={project.id} className={styles['content-wrapper']}>
                          <ProjectCard
                            onClick={() => {
                              setDrawerVisible(true);
                              setSelectedDrawerProject(data);
                            }}
                            name={project.name}
                            status={status}
                            createTime={createTime}
                            quantityCollected={quantityCollected}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}} onClick={event => event.stopPropagation()}>
                              {
                                isTrash ? (
                                  <Space size="medium">
                                    <Link
                                      icon={<IconUndo />}
                                      onClick={() => {
                                        setSelectedProject(project)
                                        setRecoverProjectVisible(true);
                                      }}
                                    >
                                      ??????
                                    </Link>
                                    <Link
                                      icon={<IconDelete />}
                                      onClick={() => {
                                        setSelectedProject(project);
                                        setDeleteProjectVisible(true);
                                      }}
                                    >
                                      ????????????
                                    </Link>
                                  </Space>
                                ) : (
                                  <>
                                    <Link
                                      icon={status === 'CLOSE' ? <IconPlayCircle /> : <IconPauseCircle />}
                                      onClick={() => {
                                        setSelectedProject({...project, status});
                                        setChangeProjectStatusVisible(true);
                                      }}
                                    >
                                      {status === 'CLOSE' ? '??????' : '??????'}
                                    </Link>
                                    <Link icon={<IconEdit />} onClick={() => navigate(`/design?id=${project.ownerId}`)}>??????</Link>
                                    <Link icon={<IconClockCircle />} onClick={(event) => navigate(`/stat?id=${project.ownerId}`)}>??????</Link>
                                    <Dropdown droplist={createSurveyDropList(data)} trigger='click' position='tr'>
                                      <Link icon={<IconMore />}/>
                                    </Dropdown>
                                  </>
                                )
                              }
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
            ) : (
              <div className={styles['exception-content']}>
                <div>
                  <div className={styles['exception-img']}></div>
                  <div className={styles['exception-text']}>
                  <span>
                    {getEmptyStateTip()}
                  </span>
                  </div>
                </div>
              </div>
            )
          }
        </Scrollbar>
      </Spin>
      <Drawer
        className={styles['project-drawer']}
        width={400}
        title={selectedDrawerProject?.project?.name}
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
              ???30???????????????
              <span>????????????:{selectedDrawerProject?.quantityCollectedLast30Days}</span>
            </div>
          </div>
          <Descriptions
            colon=''
            column={1}
            labelStyle={{ width: 100 }}
            valueStyle={{textAlign: 'right'}}
            data={descriptionsData}
          />
          <Divider style={{margin: '2px 0'}} />
          {
            !isTrash
            && (
              <>
                <div className={styles['drawer-button-group']}>
                  <div
                    className={styles['bottom-button']}
                    onClick={() => {
                      setSelectedProject({...selectedDrawerProject.project, status: selectedDrawerProject?.status});
                      setChangeProjectStatusVisible(true);
                    }}
                  >
                    {selectedDrawerProject?.status === 'CLOSE' ? <IconPlayCircle /> : <IconPauseCircle />}
                    <div className={styles['button-text']}>{selectedDrawerProject?.status === 'CLOSE' ? '??????' : '??????'}</div>
                  </div>
                  <div
                    className={styles['bottom-button']}
                    onClick={() => navigate(`/design?id=${selectedDrawerProject?.project?.ownerId}`)}
                  >
                    <IconEdit />
                    <div className={styles['button-text']}>
                      ??????
                    </div>
                  </div>
                  <div
                    className={styles['bottom-button']}
                    onClick={(event) => navigate(`/stat?id=${selectedDrawerProject?.project?.ownerId}`)}
                  >
                    <IconClockCircle />
                    <div className={styles['button-text']} >??????</div>
                  </div>
                  <Dropdown droplist={createSurveyDropList(selectedDrawerProject)} trigger='click' position='bl'>
                    <div className={styles['bottom-button']}>
                      <IconMore />
                      <div className={styles['button-text']}>??????</div>
                    </div>
                  </Dropdown>
                </div>
              </>
            )
          }
        </div>
      </Drawer>
      <Modal
        style={{width: '420px'}}
        title={selectedProject?.ownerType === 'FOLDER' ? '??????????????????' : '???????????????'}
        visible={renameModalVisible}
        confirmLoading={modalConfirmLoading}
        onOk={handleRenameProject}
        onCancel={handleRenameModalCancel}
        autoFocus={false}
        focusLock={true}
      >
        <Input
          size="large"
          value={selectedProject?.ownerType === 'FOLDER' ? renameFolderParam?.folderName : renameSurveyParam?.surveyTitle}
          onChange={e =>
            selectedProject?.ownerType === 'FOLDER'
              ? setRenameFolderParam({folderName: e})
              : setRenameSurveyParam({surveyTitle: e})
          }
        />
      </Modal>
      <Modal
        title={selectedProject?.status === 'CLOSE' ? '????????????' : '????????????'}
        visible={changeProjectStatusVisible}
        onOk={() => {
          changeSurveyStatus();
          setChangeProjectStatusVisible(false)
        }}
        onCancel={() => {setChangeProjectStatusVisible(false)}}
        autoFocus={false}
        focusLock={true}
        style={{width: '430px'}}
        confirmLoading={modalConfirmLoading}
      >
        <p>
          {
            selectedProject?.status === 'CLOSE' ?
              `????????????????????????${selectedProject?.name}?????????` :
              `????????????????????????????????????????????????????????????????????????????????????????????????${selectedProject?.name}?????????`
          }
        </p>
      </Modal>
      <Modal
        title="????????????"
        visible={clearDataModalVisible}
        onOk={() => clearAllSurveyData()}
        onCancel={() => {setClearDataModalVisible(false)}}
        autoFocus={false}
        focusLock={true}
        style={{width: '430px'}}
        confirmLoading={modalConfirmLoading}
      >
        <p>
          {`????????????????????????????????????????????????${selectedProject?.name}????????????????????????`}
        </p>
      </Modal>
      <Modal
        title="????????????"
        visible={moveProjectModalVisible}
        onOk={() => moveProject()}
        onCancel={() => {setMoveProjectModalVisible(false)}}
        autoFocus={false}
        focusLock={true}
        style={{width: '430px'}}
        confirmLoading={modalConfirmLoading}
      >
        <p>
          {`??????????????????${selectedProject?.name}???????????? ???${selectedProject?.parentId ? '?????????' : selectedFolder?.name}?????????`}
        </p>
      </Modal>
      <Modal
        title="??????????????????"
        visible={moveToTrashModalVisible}
        onOk={() => handleMoveToTrash()}
        onCancel={() => {setMoveToTrashVisible(false)}}
        autoFocus={false}
        focusLock={true}
        style={{width: '430px'}}
        confirmLoading={modalConfirmLoading}
      >
        <p>
          {`?????????${selectedProject?.ownerType === 'FOLDER' ? '?????????' : '??????'}${selectedProject?.ownerType === 'FOLDER' ? `"${selectedProject?.name}"` : `???${selectedProject?.name}???`}????????????????????????`}
        </p>
      </Modal>
      <Modal
        title={`??????${selectedProject?.ownerType === 'FOLDER' ? '?????????' : '??????'}`}
        visible={recoverProjectVisible}
        onOk={() => recoverProject()}
        onCancel={() => {setRecoverProjectVisible(false)}}
        autoFocus={false}
        focusLock={true}
        style={{width: '430px'}}
        confirmLoading={modalConfirmLoading}
      >
        <p>
          {`???????????????${selectedProject?.ownerType === 'FOLDER' ? '?????????' : '??????'}${selectedProject?.ownerType === 'FOLDER' ? `"${selectedProject?.name}"` : `???${selectedProject?.name}???`}??????`}
        </p>
      </Modal>
      <Modal
        title={`????????????${selectedProject?.ownerType === 'FOLDER' ? '?????????' : '??????'}`}
        visible={deleteProjectVisible}
        onOk={() => deletedProject()}
        onCancel={() => {setDeleteProjectVisible(false)}}
        autoFocus={false}
        focusLock={true}
        style={{width: '430px'}}
        confirmLoading={modalConfirmLoading}
      >
        <p>
          {`????????????${selectedProject?.ownerType === 'FOLDER' ? '?????????' : '??????'}${selectedProject?.ownerType === 'FOLDER' ? `"${selectedProject?.name}"` : `???${selectedProject?.name}???`}??????????????????????????????????????????${selectedProject?.ownerType === 'FOLDER' ? '?????????' : '??????'}????????????`}
        </p>
      </Modal>
    </div>
  );
}

export default MyProject;