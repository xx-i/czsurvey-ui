import QuesContentCard from "@/pages/editor/form-design/designer/QuesContentCard";
import styles from '../style/formItem.module.less'

function Input({id}) {
  return (
    <QuesContentCard id={id} tag="单行文本">
      <QuesContentCard.ContentSlot>
        <input className={styles['input-item']} type="text" placeholder="请输入" readOnly />
      </QuesContentCard.ContentSlot>
    </QuesContentCard>
  );
}

export default Input;