import styles from './style/index.module.less'
import { useDraggable } from "@dnd-kit/core";
import { forwardRef, useContext } from "react";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";

function QuesTypeTab() {

  const {quesOrder: {typeOrder}, getQuesTypeByKey, createQuestion} = useContext(FdContext);

  return (
    <div className={styles['tab-container']}>
      {
        typeOrder.map(category => {
          return (
            <div className={styles['ques-type-tab-card']} key={category.id}>
              <div className={styles['ques-tab-title']}>{category.label}</div>
              <div className={styles['type-tags-container']}>
                {
                  category.typeKeys.map(typeKey => {
                    const isDraggingTag = typeKey.startsWith('DRAGGING_');
                    const typeDetail = getQuesTypeByKey(isDraggingTag ? typeKey.replace('DRAGGING_', '') : typeKey);
                    return (
                      isDraggingTag ?
                        (
                          <QuestionTabTag
                            key={typeKey}
                            icon={typeDetail.icon}
                            label={typeDetail.label}
                          />
                        ) :
                        (
                          <QuesTabTagItem
                            key={typeDetail.key}
                            id={typeDetail.key}
                            icon={typeDetail.icon}
                            label={typeDetail.label}
                            onClick={() => createQuestion(typeDetail.key)}
                          />
                        )
                    );
                  })
                }
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

function QuesTabTagItem({id, icon, label, onClick}) {
  const {
    attributes,
    transform,
    setNodeRef,
    listeners
  } = useDraggable({id, data: {type: 'quesTypeTag'}});
  return <QuestionTabTag
    ref={setNodeRef}
    listeners={listeners}
    transform={transform}
    {...attributes}
    icon={icon}
    label={label}
    onClick={onClick}
  />;
}

export const QuestionTabTag = forwardRef(
  function QuestionTabTag({icon, label, listeners, transform, dragOverlay = false, onClick, ...props}, ref) {
    return (
      <div
        onClick={onClick}
        className={styles['type-tags']}
        style={{transform: transform && dragOverlay && `translate3d(${transform.x}px, ${transform.y}px, 0)`}}
        ref={ref}
        {...listeners}
        {...props}
      >
        {icon}
        <span className={styles['type-tags-text']}>{label}</span>
      </div>
    );
  }
)

export default QuesTypeTab;