import React, { useContext, useRef, useState } from "react";
import styles from './style/index.module.less';
import classNames from "classnames";
import InlineRichEditor from "@/components/InlineRichEditor";
import { IconCopy, IconDelete, IconDragArrow, IconPlusCircleFill, IconStar } from "@arco-design/web-react/icon";
import { useSortable } from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { Message } from "@arco-design/web-react";
import { convertFromRaw, convertToRaw } from "draft-js";

function QuesContentCard({id, tag, simple = false, children}) {
  let contentSlot = null;
  let bottomSlot = null;

  React.Children.forEach(children, child => {
    if (child && child.type) {
      if (!contentSlot && child.type.isContentSlot) {
        contentSlot = child;
      } else if (!bottomSlot && child.type.isBottomSlot) {
        bottomSlot = child;
      }
    }
  })

  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id, data: {type: 'question'}});

  const quesTitleRef = useRef();
  const {
    activeQuestionKey,
    setActiveQuestionKey,
    getSerialByKey,
    getQuesDetailByKey,
    setQuesDetail,
    surveySettings,
    deleteCurrentPageQuestionByKey,
    createQuestion
  } = useContext(FdContext);
  const questionDetail = getQuesDetailByKey(id);
  const [titleContentState, setTitleContentState] = useState(questionDetail.get('title'));

  const serial = getSerialByKey(id);
  const transformStyle = CSS.Transform.toString(transform);

  const style = {
    transform: isDragging ? `${transformStyle} scale(1.01)` : transformStyle,
    transition,
  };

  const SerialNum = ({num}) => (
    <div
      style={{
        lineHeight: '28px',
        fontSize: '18px',
        fontWeight: '700',
        height: '28px',
        marginRight: '10px'
      }}
    >
      {num}
    </div>
  );

  const handleQuesTitleEditorBlur = (contentState) => {
    if (!(contentState.hasText() && (contentState.getPlainText() !== ''))) {
      Message.warning('请输入题目标题');
      const clone = convertFromRaw(convertToRaw(questionDetail.get('title')));
      setTitleContentState(clone);
    } else {
      setQuesDetail(questionDetail.set('title', contentState));
    }
  };

  const getEditorPrefix = () => {
    if (!surveySettings?.displayQuestionNo) {
      return null;
    }
    return serial && <SerialNum num={serial > 9 ? serial.toString() : `0${serial.toString()}`}/>;
  }

  return (
    <div
      className={
        classNames(
          styles['ques-content-card'],
          isDragging && styles['is-dragging'],
          activeQuestionKey === id && styles['active']
        )
      }
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (activeQuestionKey !== id) {
          // todo: 待优化
          // quesTitleRef.current.focus();
          setActiveQuestionKey(id);
        }
      }}
    >
      <div className={styles['su-content-card']}>
        <div className={styles['card-title']} {...attributes} {...listeners}>
          <span className={styles['card-tag']}>{tag}</span>
        </div>
        <div className={styles['card-content-wrapper']}>
          <div className={styles['card-content']}>
            {
              !simple
              && (
                <>
                  <div className={styles['ques-title-container']}>
                    {questionDetail.get('required') && <span className={styles['question-required']}>*</span>}
                    <InlineRichEditor
                      ref={quesTitleRef}
                      className={styles['ques-title']}
                      editorPrefix={getEditorPrefix()}
                      contentState={titleContentState}
                      onBlur={handleQuesTitleEditorBlur}
                    />
                  </div>
                  <div className={styles['ques-desc']}>
                    <InlineRichEditor
                      className={styles['ques-desc']}
                      placeholder="请输入题目说明（选填）"
                      contentState={questionDetail.get('description')}
                      onBlur={contentState => setQuesDetail(questionDetail.set('description', contentState))}
                    />
                  </div>
                </>
              )
            }
            <div className={styles['ques-body']}>
              {contentSlot}
            </div>
          </div>
        </div>
        {
          activeQuestionKey === id && bottomSlot !== null &&
          <div className={styles['card-bottom']}>
            {bottomSlot}
          </div>
        }
        <div className={styles['card-tools']} onClick={event => event.stopPropagation()}>
          <button
            className={classNames(styles['add-btn'], styles['top-btn'])}
            onClick={() => createQuestion({targetKey: id, position: 'before', type: questionDetail.get('type')})}
          >
            <IconPlusCircleFill />
          </button>
          <button title="收藏"><IconStar /></button>
          <button title="复制" onClick={() => createQuestion({targetKey: id}, 'copy')}><IconCopy /></button>
          <button title="长按拖动题目" {...attributes} {...listeners}><IconDragArrow /></button>
          <button title="删除" onClick={() => deleteCurrentPageQuestionByKey(id)}><IconDelete /></button>
          <button
            className={classNames(styles['add-btn'], styles['bottom-btn'])}
            onClick={() => createQuestion({targetKey: id, position: 'after', type: questionDetail.get('type')})}
          >
            <IconPlusCircleFill />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentSlot({children}) {
  return children;
}
ContentSlot.isContentSlot = true;
QuesContentCard.ContentSlot = ContentSlot;

function BottomSlot({children}) {
  return children;
}

BottomSlot.isBottomSlot = true;
QuesContentCard.BottomSlot = BottomSlot;

export default QuesContentCard;