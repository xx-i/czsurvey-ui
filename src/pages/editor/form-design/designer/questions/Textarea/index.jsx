import QuesContentCard from "@/pages/editor/form-design/designer/QuesContentCard";
import styles from "./style/index.module.less";

function TextArea({id}) {
  return (
    <QuesContentCard id={id} tag="多行文本">
      <QuesContentCard.ContentSlot>
        <textarea className={styles['textarea-item']} rows="5" placeholder="请输入" readOnly />
      </QuesContentCard.ContentSlot>
    </QuesContentCard>
  );
}

export default TextArea;