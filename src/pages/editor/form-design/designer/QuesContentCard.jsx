import React, { useContext } from "react";
import styles from './style/index.module.less';
import classNames from "classnames";
import InlineRichEditor from "@/components/InlineRichEditor";
import { IconCopy, IconDelete, IconDragArrow, IconPlusCircleFill, IconStar } from "@arco-design/web-react/icon";
import { useSortable } from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";

function QuesContentCard({id, tag, children}) {
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

  const {activeQuestionKey, setActiveQuestionKey, getSerialByKey} = useContext(FdContext);

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
        setActiveQuestionKey(id)
      }}
    >
      <div className={styles['su-content-card']}>
        <div className={styles['card-title']} {...attributes} {...listeners}>
          <span className={styles['card-tag']}>{tag}</span>
        </div>
        <div className={styles['card-content-wrapper']}>
          <div className={styles['card-content']}>
            <div>
              <InlineRichEditor className={styles['ques-title']} editorPrefix={<SerialNum num={getSerialByKey(id)}/>} defaultText="请输入题目标题"/>
            </div>
            <div className={styles['ques-desc']}>
              <InlineRichEditor className={styles['ques-desc']} defaultText="请输入题目标题（选填）"/>
            </div>
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
        <div className={styles['card-tools']}>
          <button className={classNames(styles['add-btn'], styles['top-btn'])}><IconPlusCircleFill /></button>
          <button title="收藏"><IconStar /></button>
          <button title="复制"><IconCopy /></button>
          <button title="长按拖动题目" {...attributes} {...listeners}><IconDragArrow /></button>
          <button title="删除"><IconDelete /></button>
          <button className={classNames(styles['add-btn'], styles['bottom-btn'])}><IconPlusCircleFill /></button>
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