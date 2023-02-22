import styles from './style/index.module.less'
import {
  IconCheckCircleFill,
  IconLock,
  IconQuestionCircle,
  IconRefresh,
  IconUser,
  IconUserAdd
} from '@arco-design/web-react/icon';
import {
  Tabs,
  Typography,
  Link,
  Form,
  Input,
  Button,
  Spin,
  Message
} from '@arco-design/web-react';
import request from '@/utils/request'
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/utils/auth";
import classNames from "classnames";

function LoginForm({className, children, to = '/'}) {

  const [wxQrcode, setWxQrcode] = useState({});
  const [qrcodeStatus, setQrcodeStatus] = useState('WAITING');
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm()
  const {onLogin} = useAuth();

  // 获取微信登录的二维码图片
  function fetchWxQrcode(showLoading = true) {
    showLoading && setLoading(true);
    request
      .get('/wx/login/qrcode')
      .then(res => {
        setWxQrcode(res.data);
        setQrcodeStatus('WAITING');
      })
      .finally(() => {
        showLoading && setLoading(false);
      });
  }

  useEffect(() => {
    fetchWxQrcode();
  }, []);

  // 校验微信登录的状态
  const checkWxLoginStatus = useCallback(() => {
    if (!wxQrcode?.codeId) {
      return;
    }
    request
      .get('/wx/login/token/status', {params: {codeId: wxQrcode.codeId}})
      .then(res => {
        const status = res.data.status;
        setQrcodeStatus(status);
        if (status === 'EXPIRED') {
          setWxQrcode({...wxQrcode, clear: true});
        }
        if (status === 'SUCCESS') {
          setWxQrcode({...wxQrcode, clear: true});
          onLogin(res.data.token, to);
        }
      })
      .catch(() => {
        setWxQrcode({...wxQrcode, clear: true});
      })
    // eslint-disable-next-line
  }, [wxQrcode, onLogin]);

  // 每隔一秒一次检测微信二维码的状态
  useEffect(() => {
    let timer;
    if (!wxQrcode?.clear) {
      timer = setInterval(checkWxLoginStatus, 1000);
    }
    return () => {
      timer && clearInterval(timer);
    }
  }, [wxQrcode, checkWxLoginStatus]);

  const handleChangeTab = key => {
    key === 'wx_qrcode' ? fetchWxQrcode() : setWxQrcode({...wxQrcode, clear: true});
  }

  const handleLogin = async () => {
    let loginForm = await form.validate();
    setLoading(true);
    try {
      let { data: {token} } = await request.post('/login', loginForm);
      onLogin(token, to);
    } catch (error) {
      setLoading(false);
      if (error.response.status === 401) {
        Message.error('用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  const messageTemplate = {
    required: ({field}) => {
      const messageField = {username: '手机号或邮箱', password: '密码'};
      return `请输入${messageField[field]}`
    }
  }

  let expireStateModal = (
    <div className={styles['qrcode-modal']}>
      <div>
        <IconRefresh className={styles['refresh-icon']}/>
        <span>二维码已经失效</span>
        <span>
          {/* eslint-disable-next-line */}
          <a href="#" onClick={() => fetchWxQrcode()}>点击刷新</a>
        </span>
      </div>
    </div>
  )

  let scannedStateModal = (
    <div className={styles['qrcode-modal']}>
      <div>
        <div className={styles['scanned-icon-container']}>
          <IconCheckCircleFill className={styles['scanned-icon']} />
        </div>
        <span>扫码成功</span>
        <span className={styles['scanned-tip-text']}>
          请在手机上继续操作
        </span>
      </div>
    </div>
  )

  return (
    <div className={classNames(className, styles['login-form'])}>
      <Tabs defaultActiveTab="wx_qrcode" onChange={handleChangeTab}>
        <Tabs.TabPane key='wx_qrcode' title='微信扫码登录'>
          <Typography.Paragraph>
            <div className={styles['wx-login']}>
              <div className={styles['mod-text']}>
                请使用微信扫一扫登录
                <Link role="button" icon={<IconRefresh />} onClick={fetchWxQrcode}>刷新</Link>
              </div>
              <Spin loading={loading} style={{display: 'block'}}>
                <div className={styles.qrcode}>
                  {qrcodeStatus === 'EXPIRED' && expireStateModal}
                  {qrcodeStatus === 'SCANNED' && scannedStateModal}
                  {wxQrcode.image && <img src={wxQrcode.image} alt="登录二维码" style={{height: '100%', width: '100%'}}/>}
                </div>
              </Spin>
            </div>
          </Typography.Paragraph>
        </Tabs.TabPane>
        <Tabs.TabPane key='form' title='账号密码登录'>
          <Typography.Paragraph>
            <Form
              style={{marginTop: '2px'}}
              form={form}
              wrapperCol={{span: 24}}
              validateMessages={messageTemplate}
              initialValues={{username: '', password: ''}}
            >
              <Form.Item field="username" rules={[{ required: true }]}>
                <Input prefix={<IconUser />} allowClear size="large" placeholder='请输入手机号/邮箱'/>
              </Form.Item>
              <Form.Item field="password" rules={[{ required: true }]}>
                <Input.Password prefix={<IconLock />} size="large" placeholder='请输入密码' />
              </Form.Item>
              <Form.Item>
                <Button
                  loading={loading}
                  style={{width: '100%'}}
                  size="large"
                  type='primary'
                  onClick={handleLogin}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <Link icon={<IconUserAdd />}>立即注册</Link>
              <Link icon={<IconQuestionCircle />}>找回密码</Link>
            </div>
          </Typography.Paragraph>
        </Tabs.TabPane>
      </Tabs>
      <div className={styles['form-bottom']}>
        {children}
      </div>
    </div>
  )
}

export default LoginForm;