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
          Message.error('????????????????????????');
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
        <div className={styles['title-content']}>????????????????????????</div>
      </div>
      {
        loginType === 'wx'
        && (
          <div className={styles['wx-login-content']}>
            <Button type="primary" long size="large" onClick={() => handleWxLogin()}>????????????</Button>
            <div className={styles['wx-login-desc']}>
              <p>????????????????????????????????????????????????????????????</p>
              <p>??? ????????????</p>
              <p>??? ????????????</p>
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
              <FormItem field='username' rules={[{ required: true, message: '???????????????????????????' }]}>
                <Input prefix={<IconUser />} placeholder='??????????????????/??????' size="large" />
              </FormItem>
              <FormItem field='password' rules={[{ required: true, message: '???????????????' }]}>
                <Input.Password prefix={<IconLock />} placeholder='???????????????' size="large" />
              </FormItem>
              <FormItem>
                <Button type='primary' htmlType='submit' long size="large" loading={loginBtnLoading}>
                  ??????
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