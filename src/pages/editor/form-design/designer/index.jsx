import styles from './style/index.module.less'
import InlineRichEditor from "@/components/InlineRichEditor";
import { useContext, useRef } from "react";
import classNames from "classnames";
import SettingPanel from "@/pages/editor/form-design/designer/SettingPanel";
import Input from "@/pages/editor/form-design/designer/formItems/Input";
import Textarea from "@/pages/editor/form-design/designer/formItems/Textarea";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

function Designer() {
  const ref = useRef();
  const {quesOrder: {itemOrder}, getQuesDetailByKey, setActiveQuestionKey} = useContext(FdContext);
  return (
    <div onClick={() => setActiveQuestionKey(null)}>
      <div className={styles['designer-container']}>
        <div className={classNames(styles['su-title-container'], styles['su-content-card'])}>
          <input type='text' value="问卷标题" onChange={() => {}}/>
        </div>
        <div className={classNames(styles['su-desc-container'], styles['su-content-card'])}>
          <InlineRichEditor className={styles['su-desc-editor']} ref={ref} defaultText="为了给您提供更好的服务，希望您能抽出几分钟时间，将您的感受和建议告诉我们，我们非常重视每位用户的宝贵意见，期待您的参与！现在我们就马上开始吧!"/>
        </div>
        <div className={styles['sortable-container']}>
          <SortableContext items={itemOrder} strategy={verticalListSortingStrategy}>
            {
              itemOrder.map(key => {
                const ques = getQuesDetailByKey(key);
                if (ques.get('type') === 'INPUT') {
                  return <Input key={key} id={key} />
                } else {
                  return <Textarea key={key} id={key}/>
                }
              })
            }
          </SortableContext>
        </div>
      </div>
      <SettingPanel/>
    </div>
  );
}

export default Designer;