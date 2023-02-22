import styles from './style/index.module.less'
import classNames from "classnames";

function LinkButton({className, icon, text, onClick, disabled}) {
  return (
    <button
      className={
        classNames(
          styles['link-btn'],
          className,
          disabled && styles['disabled']
        )
      }
      onClick={(e) => onClick && onClick(e)}
    >
      {icon}
      {text}
    </button>
  );
}

export default LinkButton;