import styles from './styles/index.module.less'
import classNames from "classnames";
import { Result } from "@arco-design/web-react";

function Page404(className, style) {
  return (
    <div className={classNames(styles['error-page'], className)} style={style}>
      <Result status='404' subTitle="页面找不到了"/>
    </div>
  );
}

export default Page404;