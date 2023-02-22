import styles from './style/index.module.less';
import { Button, Form, Input, Message } from "@arco-design/web-react";
import logo from "@/components/NavBar/assets/logo.png";
import { IconLock, IconUser, IconWechat } from "@arco-design/web-react/icon";
import { IconContactFill } from "@arco-iconbox/react-cz-icon";
import classNames from "classnames";
import { useEffect, useState } from "react";
import request from "@/utils/request";
import { useAuth } from "@/utils/auth";
import { useSearchParams } from "react-router-dom";
const FormItem = Form.Item;

function MobileLogin() {

  const [loginType, setLoginType] = useState('wx');
  const [loginBtnLoading, setLoginBtnLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const {onLogin} = useAuth();
  const [form] = Form.useForm();
  const surveyId = searchParams.get('id');
  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      return;
    }
    setPageLoading(true);
    request
      .post('/wx/web/login', {authorizationCode: code})
      .then(res => {
        let { data: {token} } = res;
        onLogin(token, surveyId ? `/s?id=${surveyId}` : '/');
      })
      .finally(() => {
        setPageLoading(false);
      })
    // eslint-disable-next-line
  }, [code, surveyId]);

  const handleWxLogin = () => {
    const redirectUrl = window.location.href = encodeURI(`${process.env.REACT_APP_PROJECT_LOCATION}/mobile/login?id=${surveyId}`);
    window.location.replace(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.REACT_APP_WX_APPID}&redirect_uri=${redirectUrl}&response_type=code&scope=snsapi_userinfo`);
  }

  const handleAccountLogin = (loginForm) => {
    setLoginBtnLoading(true);
    request
      .post('/login', loginForm)
      .then(res => {
        let { data: {token} } = res;
        onLogin(token, surveyId ? `/s?id=${surveyId}` : '/');
      })
      .catch(error => {
        if (error.response.status === 401) {
          Message.error('用户名或密码错误');
        }
      })
      .finally(() => {
        setLoginBtnLoading(false);
      })
  }

  if (pageLoading) {
    return ;
  }

  return (
    <div className={styles['mobile-login']}>
      <div className={styles['header-logo']}>
        <div className={styles['logo-inner']}>
          <img src={logo} alt="logo"/>
          <span>CZ SURVEY</span>
        </div>
      </div>
      <div className={styles['login-title']}>
        <div className={styles['title-content']}>欢迎使用橙子问卷</div>
      </div>
      {
        loginType === 'wx'
        && (
          <div className={styles['wx-login-content']}>
            <Button type="primary" long size="large" onClick={() => handleWxLogin()}>微信登录</Button>
            <div className={styles['wx-login-desc']}>
              <p>登录后，您将允许”橙子问卷“获取以下权限</p>
              <p>✔ 微信昵称</p>
              <p>✔ 微信头像</p>
            </div>
          </div>
        )
      }
      {
        loginType === 'account'
        && (
          <div className={styles['account-login-content']}>
            <Form
              form={form}
              style={{ width: '100%' }}
              wrapperCol={{ span: 24 }}
              autoComplete='off'
              initialValues={{username: '', password: ''}}
              onSubmit={(loginForm) => handleAccountLogin(loginForm)}
            >
              <FormItem field='username' rules={[{ required: true, message: '请输入手机号或邮箱' }]}>
                <Input prefix={<IconUser />} placeholder='请输入手机号/邮箱' size="large" />
              </FormItem>
              <FormItem field='password' rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<IconLock />} placeholder='请输入密码' size="large" />
              </FormItem>
              <FormItem>
                <Button type='primary' htmlType='submit' long size="large" loading={loginBtnLoading}>
                  登录
                </Button>
              </FormItem>
            </Form>
          </div>
        )
      }
      <div className={styles['login-bottom']}>
        <div
          className={styles['login-icon']}
          onClick={() => setLoginType('wx')}
        >
          <IconWechat />
        </div>
        <div
          className={classNames(styles['account-icon'], styles['login-icon'])}
          onClick={() => setLoginType('account')}
        >
          <IconContactFill />
        </div>
      </div>
    </div>
  );
}

export default MobileLogin;