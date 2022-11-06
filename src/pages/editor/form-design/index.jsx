import style from './style/index.module.less'
import { IconShake } from "@arco-design/web-react/icon";

function Editor() {
  return (
    <div>
      <div className={style['side-nav']}>
        <div className={style['menu-container']}>
          <div className={style['menu-item']}>
            <IconShake />
            <div className={style['menu-text']}>问卷</div>
          </div>
          <div className={style['menu-item']}>
            <IconShake />
            <div className={style['menu-text']}>问卷</div>
          </div>
          <div className={style['menu-item']}>
            <IconShake />
            <div className={style['menu-text']}>问卷</div>
          </div>
          <div className={style['menu-item']}>
            <IconShake />
            <div className={style['menu-text']}>问卷</div>
          </div>
          <div className={style['menu-item']}>
            <IconShake />
            <div className={style['menu-text']}>问卷</div>
          </div>
        </div>
        <div className={style['bottom-menu-container']}>
          <div className={style['menu-item']}>
            <IconShake />
          </div>
          <div className={style['menu-item']}>
            <IconShake />
          </div>
        </div>
      </div>
      <div style={{height: '2000px'}}>
          
      </div>
    </div>
  );
}

export default Editor;