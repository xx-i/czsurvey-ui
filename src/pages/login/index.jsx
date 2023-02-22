import styles from './style/index.module.less'
import LoginForm from "@/pages/login/loginForm";
import { Link } from "@arco-design/web-react";

function Login() {
  return (
    <div className={styles.container}>
      <LoginForm className={styles['main-login-form']}>
        <div className={styles['login-tips-title']}>登录遇到问题？</div>
        <div className={styles['login-tips-text']}>
          原登录方式不可用、密码无法找回、账号管理员变动，请联系
          <Link href='#' style={{fontSize: '12px'}}>管理员</Link>，
          其它登录问题，请参考<Link href='#' style={{fontSize: '12px'}}>帮助文档</Link>
        </div>
      </LoginForm>
    </div>
  )
}

export default Login;