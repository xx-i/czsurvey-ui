import QuesContentCard from "@/pages/editor/form-design/designer/QuesContentCard";
import styles from "@/pages/editor/form-design/designer/questions/Input/style/index.module.less";
import InlineRichEditor from "@/components/InlineRichEditor";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { useContext, useState } from "react";
import { Message } from "@arco-design/web-react";
import { convertFromRaw, convertToRaw } from "draft-js";

function Description({id}) {
  const {getQuesDetailByKey, setQuesDetail} = useContext(FdContext);
  const questionDetail = getQuesDetailByKey(id);
  const [titleContentState, setTitleContentState] = useState(questionDetail.get('title'));

  const handleQuesTitleEditorBlur = (contentState) => {
    if (!(contentState.hasText() && (contentState.getPlainText() !== ''))) {
      Message.warning('请输入描述说明');
      const clone = convertFromRaw(convertToRaw(questionDetail.get('title')));
      setTitleContentState(clone);
    } else {
      setQuesDetail(questionDetail.set('title', contentState));
    }
  };

  return (
    <QuesContentCard id={id} tag="文本描述" simple>
      <QuesContentCard.ContentSlot>
        <div className={styles['ques-desc']}>
          <InlineRichEditor
            className={styles['ques-desc']}
            placeholder="请输入文本描述"
            contentState={titleContentState}
            onBlur={handleQuesTitleEditorBlur}
          />
        </div>
      </QuesContentCard.ContentSlot>
    </QuesContentCard>
  );
}

export default Description;