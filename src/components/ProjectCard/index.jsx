import styles from "./style/index.module.less";

function ProjectCard({
  name,
  status,
  createTime,
  quantityCollected,
  onClick,
  children
}) {
  return (
    <div onClick={onClick} className={styles['project-card']}>
      <div className={styles['project-cover']}>
        {
          status === 'PUBLISH' && (
            <div className={styles['project-status']}>
              <span>答题中</span>
            </div>
          )
        }
      </div>
      <div className={styles['project-name']}>
        <span>{name}</span>
      </div>
      <div className={styles['project-info']}>
        <div className={styles['project-statistics']}>
          <span>{quantityCollected}份</span>
          <span className={styles['stat-time']}>{createTime}</span>
        </div>
        <div className={styles['project-operation']}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;