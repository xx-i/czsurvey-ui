import LoginForm from "@/pages/login/loginForm";
import styles from './style/index.module.less'
import { useSearchParams } from "react-router-dom";

function SurveyLogin() {
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id');
  return (
    <div className={styles['survey-login']}>
      <LoginForm to={surveyId ? `/s?id=${surveyId}` : '/'}>
        <div className={styles['login-tip']}>
          该问卷需要登录后作答
        </div>
      </LoginForm>
    </div>
  );
}

export default SurveyLogin;