import { Button } from "@arco-design/web-react";
import { useSearchParams } from "react-router-dom";
import { IconCdFill, IconInfoFill, IconSuccessFill } from "@arco-iconbox/react-cz-icon";
import styles from './styles/index.module.less'
import { useEffect, useState } from "react";
import request from "@/utils/request";
function WxAuth() {
  const [searchParams] = useSearchParams();
  const [pageLoading, setPageLoading] = useState(false);
  const loginToken =  searchParams.get('login_token');
  const code = searchParams.get('code');

  const [loginState, setLoginState] = useState(loginToken ? 'NORMAL' : 'ERROR');
  useEffect(() => {
    if (!loginToken) {
      setLoginState('ERROR');
      return;
    }
    if (code) {
      setPageLoading(true);
      request
        .post('/wx/qrcode/login', {authorizationCode: code, wxLoginCode: loginToken})
        .then(() => {
          setPageLoading(false);
          setLoginState('SUCCESS')
        })
        .catch(() => {
          setPageLoading(false);
          setLoginState('ERROR')
        })
    } else {
      setPageLoading(true);
      request
        .post('/wx/login/scan/qrcode', {codeId: loginToken})
        .then(res => {
          setPageLoading(false);
          if (res.data === 'EXPIRED') {
            setLoginState('ERROR');
          }
        })
        .catch(() => {
          setPageLoading(false);
          setLoginState('ERROR')
        })
    }
  }, [loginToken, code]);

  const onLogin = () => {
    const redirectUrl = window.location.href = encodeURI(`${process.env.REACT_APP_PROJECT_LOCATION}/wx/auth?login_token=${loginToken}`);
    window.location.replace(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.REACT_APP_WX_APPID}&redirect_uri=${redirectUrl}&response_type=code&scope=snsapi_userinfo`);
  }

  return (
    <div className={styles['wx-auth-page']}>
      {
        !pageLoading && loginState === 'NORMAL'
        && (
          <div>
            <div className={styles['auth-icon']}>
              <IconCdFill fontSize={102} color="#165FFF" />
            </div>
            <div className={styles['auth-confirm-text']}>
              确认登录橙子问卷?
            </div>
            <div className={styles['auth-confirm-desc']}>
              确认后将在电脑端完成登录
            </div>
            <div className={styles['confirm-btn']}>
              <Button long size='large' type="primary" onClick={() => onLogin()}>确认登录</Button>
            </div>
          </div>
        )
      }
      {
        !pageLoading && loginState === 'SUCCESS'
        && (
          <div>
            <div className={styles['auth-icon']}>
              <IconSuccessFill fontSize={102} color="#00B42A"/>
            </div>
            <div className={styles['auth-confirm-text']}>
              已确认登录
            </div>
            <div className={styles['auth-confirm-desc']}>
              请在电脑上继续使用
            </div>
          </div>
        )
      }
      {
        !pageLoading && loginState === 'ERROR'
        && (
          <div>
            <div className={styles['notice-icon']}>
              <IconInfoFill fontSize={102} color="#999" />
            </div>
            <div className={styles['notice-content']}>
              系统出错，请稍后再试
            </div>
          </div>
        )
      }
    </div>
  );
}

export default WxAuth;