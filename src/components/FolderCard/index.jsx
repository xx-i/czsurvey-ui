import styles from "./style/index.module.less";

function FolderCard({name, createTime, children, onClick}) {
  return (
    <div onClick={onClick} className={styles['folder-box-wrapper']}>
      <div className={styles['folder-box']}>
        <div className={styles['folder']}>
          <div className={styles['folder-page']}></div>
          <div className={styles['folder-cover']}></div>
        </div>
        <div className={styles['folder-info']}>
          <div className={styles['folder-name']}>{name}</div>
          <div className={styles['folder-statistics']}>
            <span className={styles['folder-time']}>{createTime}</span>
            {children}
            {/*<Link href='#' icon={<IconMore />}/>*/}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FolderCard;