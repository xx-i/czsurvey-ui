import styles from './style/index.module.less'
import { Avatar, Button, Divider, Dropdown, Menu, Message, Modal, Switch } from "@arco-design/web-react";
import {
  IconArrowRight,
  IconDesktop,
  IconDown,
  IconEdit,
  IconImport,
  IconMenu,
  IconMobile,
  IconPoweroff, IconReply,
  IconShareAlt,
  IconUser
} from "@arco-design/web-react/icon";
import logo from "./assets/logo.png"
import { useAuth } from "@/utils/auth";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Scrollbar } from 'react-scrollbars-custom';
import { useEffect, useRef, useState } from "react";
import SurveyForm from "@/pages/editor/form-design/surveyForm";
import classNames from "classnames";
import { loadingNode } from "@/components/Loading";
import request from "@/utils/request";
import { QRCodeCanvas } from 'qrcode.react';
import { copyToClipboard } from "@/utils/copy";

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(1px)',
};

function EditorLayout() {

  const {onLogout} = useAuth();
  const {nickname} = useSelector(state => state.user);
  const [previewSurvey, setPreviewSurvey] = useState({isPreview: false, type: 'DESKTOP'});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const downloadQrcodeRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const {pathname} = location;
  const surveyId = searchParams.get('id');

  useEffect(() => {
    if (!surveyId) {
      navigate('/error/404');
    }
    setLoading(true);
    request.get(`/survey/${surveyId}`)
      .then((res => {
        setLoading(false);
        setSurvey(res.data);
      }))
      .catch(err => {
        setLoading(false);
        navigate('/error/500');
        console.error(err);
      })
    // eslint-disable-next-line
  }, [surveyId]);

  const onChangeStatus = () => {
    const status = survey.status;
    const newStatus = status === 'PUBLISH' ? 'CLOSE' : 'PUBLISH';
    setSurvey({...survey, status: newStatus});
    request
      .put('/survey/status', {
        surveyId: surveyId,
        status: newStatus
      })
      .catch(err => {
        console.error(err);
        Message.error("服务器异常");
        setSurvey({...survey, status});
      })
  }

  const downloadQrcode = () => {
    const qrcodeCanvas = document.querySelector('#share-qrcode > canvas');
    const pngFile = qrcodeCanvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.download = "qrcode";
    downloadLink.href = `${pngFile}`;
    downloadLink.click();
  }

  const userDropList = (
    <Menu>
      <Menu.Item key='1'><IconUser style={iconStyle} />个人中心</Menu.Item>
      <Menu.Item key='2' onClick={() => onLogout()}><IconPoweroff style={iconStyle} />退出登录</Menu.Item>
    </Menu>
  );

  if (loading) {
    return;
  }

  return (
    <div>
      <div className={`${styles['editor-nav']} ${styles['nav-top']}`}>
        <div className={styles['nav-left-container']}>
          <a
            href='/'
            className={styles['nav-logo']}
            onClick={event => {
              event.preventDefault();
              navigate('/');
            }}
          >
            <img src={logo} alt="logo" />
          </a>
          <Button
            type='text'
            icon={<IconImport />}
            onClick={() => navigate('/')}
          >
            退出编辑
          </Button>
        </div>
        <div className={styles['nav-center-container']}>
          个人空间 / {survey.title.length > 10 ? `${survey.title.slice(0, 10)}...` : survey.title}
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
          {
            previewSurvey.isPreview
            && (
              <>
                <span
                  className={classNames(styles['nav-left-btn'], previewSurvey.type === 'DESKTOP' && styles['active'])}
                  onClick={() => setPreviewSurvey({...previewSurvey, type: 'DESKTOP'})}
                >
                  <IconDesktop style={{fontSize: '24px'}} />
                </span>
                <span
                  className={classNames(styles['nav-left-btn'], previewSurvey.type === 'MOBILE' && styles['active'])}
                  onClick={() => setPreviewSurvey({...previewSurvey, type: 'MOBILE'})}
                >
                  <IconMobile style={{fontSize: '24px'}} />
                </span>
              </>
            )
          }
        </div>
        <div className={styles['nav-center-container']}>
          <div
            className={classNames(
              styles['next'],
              pathname === '/design' && styles['active'],
              styles['link']
            )}
            onClick={() => navigate(`/design?id=${surveyId}`)}
          >
            编辑
          </div>
          <div className={styles['next']}>
            <IconArrowRight />
          </div>
          <div
            className={classNames(
              styles['next'],
              pathname === '/design/setting' && styles['active'],
              styles['link']
            )}
            onClick={() => navigate(`/design/setting?id=${surveyId}`)}
          >
            设置
          </div>
          <div className={styles['next']}>
            <IconArrowRight />
          </div>
          <div
            className={classNames(
              styles['next'],
              styles['disabled']
            )}
          >
            分享
          </div>
          <div className={styles['next']}>
            <IconArrowRight />
          </div>
          <div
            className={classNames(
              styles['next'],
              pathname === '/stat' && styles['active'],
              styles['link']
            )}
            onClick={() => navigate(`/stat?id=${surveyId}`)}
          >
            统计
          </div>
        </div>
        <div className={styles['nav-right-container']}>
          <Switch
            checked={survey.status === 'PUBLISH'}
            checkedText='允许提交'
            uncheckedText='禁止提交'
            defaultChecked
            onChange={() => onChangeStatus()}
          />
          <Divider type='vertical' />
          <Button
            type='outline'
            style={{marginRight: '8px'}}
            icon={previewSurvey.isPreview ? <IconReply /> : <IconEdit />}
            onClick={() => {
              if (previewSurvey.isPreview) {
                setPreviewSurvey({isPreview: false, type: 'DESKTOP'})
              } else {
                setPreviewLoading(true);
                setPreviewSurvey({isPreview: true, type: 'DESKTOP'})
              }
            }}
          >
            {previewSurvey.isPreview ? '退出试答' : '试答问卷'}
          </Button>
          <Button type='primary' icon={<IconShareAlt />} onClick={() => setShareModalVisible(true)}>分享问卷</Button>
        </div>
      </div>
      {
        previewSurvey?.isPreview && previewLoading
        && (
          <div className={classNames(styles['preview-modal'], styles['loading'])}>
            {loadingNode}
          </div>
        )
      }
      {
        previewSurvey?.isPreview
        && (
          <>
            <div
              className={classNames(
                styles['preview-modal'],
                (previewSurvey.type !== 'DESKTOP' || previewLoading) && 'hidden'
              )}
            >
              <SurveyForm style={{height: 'calc(100vh - 128px)'}} surveyId={surveyId} type="preview"/>
            </div>
            <div
              className={classNames(
                styles['preview-modal'],
                (previewSurvey.type !== 'MOBILE' || previewLoading) && 'hidden'
              )}
            >
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
                <div className={styles['mobile-frame']}>
                  <iframe
                    title="preview-mobile"
                    src={`${process.env.REACT_APP_PROJECT_LOCATION}/s?id=${surveyId}&preview=1`}
                    className={styles['preview-iframe']}
                    onLoad={(e) => {
                      setPreviewLoading(false);
                    }}
                  />
                </div>
              </Scrollbar>
            </div>
          </>
        )
      }
      <div className={styles['editor-main']}>
        <Scrollbar
          style={{height: "100%", width: "100%"}}
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
        >
          <div className={styles['editor-main-container']}>
            <Outlet/>
          </div>
        </Scrollbar>
      </div>
      <Modal
        title={
          <div className={styles['share-modal-title']}>
            分享问卷
          </div>
        }
        visible={shareModalVisible}
        onOk={() => setShareModalVisible(false)}
        onCancel={() => setShareModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        footer={null}
        className={styles['share-modal']}
      >
        <div className={styles['share-modal-content']}>
          <div className={styles['qrcode-container']} id="share-qrcode">
            <QRCodeCanvas
              value={`${process.env.REACT_APP_PROJECT_LOCATION}/s?id=${surveyId}`}
              size={180}
              level="Q"
              renderAs="canvas"
            />
          </div>
          <div className={styles['operator-btn-container']}>
            <Button type="primary" size="large" ref={downloadQrcodeRef} onClick={() => downloadQrcode()}>下载二维码</Button>
            <Button
              type="outline"
              status="success"
              size="large"
              onClick={() => {
                copyToClipboard(`${process.env.REACT_APP_PROJECT_LOCATION}/s?id=${surveyId}`);
                Message.success('复制问卷地址成功');
              }}
            >
              复制链接地址
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EditorLayout;