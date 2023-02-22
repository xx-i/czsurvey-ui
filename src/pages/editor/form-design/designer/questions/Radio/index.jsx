import QuesContentCard from "@/pages/editor/form-design/designer/QuesContentCard";
import InlineRichEditor from "@/components/InlineRichEditor";
import styles from './style/index.module.less'
import { IconDragDotVertical, IconPlusCircle } from "@arco-design/web-react/icon";
import LinkButton from "@/components/LinkButton";
import { Divider, Message } from "@arco-design/web-react";
import classNames from "classnames";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDndMonitor } from "@dnd-kit/core";
import { useContext } from "react";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { randomStr } from "@/utils/random";
import { ContentState } from "draft-js";

const radioPrefix = (
  <div className={styles['radio-prefix-container']}>
    <div className={styles['radio-prefix']} />
  </div>
);

function RadioOption({id, questionKey, contentState, onCancel, onBlur}) {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    data: {
      type: 'radioOption',
      area: questionKey
    }
  });

  const optionStyle = {
    transition,
    transform: CSS.Transform.toString(transform)
  }

  return (
    <div
      ref={setNodeRef}
      style={optionStyle}
      className={classNames(styles['radio-option'], isDragging && styles['dragging'])}
    >
      <button className={styles['dragging-handler']} {...attributes} {...listeners}>
        <IconDragDotVertical />
      </button>
      <InlineRichEditor
        editorPrefix={radioPrefix}
        cancellable
        contentState={contentState}
        onBlur={(contentState) => onBlur && onBlur(contentState)}
        onCancel={() => onCancel && onCancel()}/>
    </div>
  );
}

function Radio({id}) {

  const {getQuesDetailByKey, setQuesDetail, getSerialByKey} = useContext(FdContext);

  const  radioDetail =  getQuesDetailByKey(id);
  const additionalInfo = radioDetail.get('additionalInfo');
  const {options, reference, refQuestionKey} = additionalInfo;
  const optionIds = options.map(e => e.id);

  useDndMonitor({
    onDragEnd({active, over}) {
     const {type: activeType, area: activeArea} = active.data.current;
     const {type: overType, area: overArea} = over?.data.current || {};
     if (
       activeType === 'radioOption'
       && overType === 'radioOption'
       && activeArea === id
       && overArea === id
     ) {
       const activeIndex = optionIds.indexOf(active.id);
       const overIndex = optionIds.indexOf(over.id);
       setQuesDetail(radioDetail.set(
         'additionalInfo',
         {...additionalInfo, options: arrayMove(options, activeIndex, overIndex)}
       ));
     }
    }
  });

  const getNextOptionId = () => {
    const optionIds = options.map(e => e.id);
    const nextId = 'ro_' + randomStr();
    return optionIds.indexOf(nextId) === -1 ? nextId : getNextOptionId();
  }

  const setOptions = (options) => {
    setQuesDetail(radioDetail.set(
      'additionalInfo',
      {...additionalInfo, options: options}
    ));
  };

  const handleCancelOption = (optionId) => {
    return () => {
      if (
        options.length <= 1
        || (
          options.length === 2
          && options[options.length - 1].otherOption
          && options[options.length - 1].id !== optionId
        )
      ) {
        Message.warning({duration: 3000, content: '单选题需要至少保留一个非其它项的选项'});
        return;
      }
      setOptions(additionalInfo.options.filter(e => e.id !== optionId));
    }
  }

  const addOtherOption = () => {
    if (!options[options.length - 1].otherOption) {
      const option = {
        id: getNextOptionId(),
        label: ContentState.createFromText('其它'),
        fixed: false,
        otherOption: true
      }
      setOptions([...options.filter(e => !e.otherOption), option]);
    }
  }

  const addOption = () => {
    const option = {
      id: getNextOptionId(),
      label: ContentState.createFromText('选项'),
      fixed: false,
      otherOption: false
    }
    const lastOption = options[options.length - 1];
    if (lastOption.otherOption) {
      setOptions([...options.slice(0, -1), option, lastOption]);
    } else {
      setOptions([...options, option]);
    }
  }

  const handleOptionEditorBlur = (optionId) => {
    return (contentState) => {
      setOptions(additionalInfo.options.map(e => e.id === optionId ? {...e, label: contentState} : e));
    };
  }

  const renderOtherOption = () => {
    const lastOption = options[options.length - 1];
    if (lastOption?.otherOption) {
      return (
        <div className={styles['other-option']}>
          <div className={styles['radio-option']}>
            <button className={styles['dragging-handler']}>
              <IconDragDotVertical />
            </button>
            <InlineRichEditor
              contentState={lastOption.label}
              editorPrefix={radioPrefix}
              cancellable
              onCancel={handleCancelOption(lastOption.id)}
              onBlur={handleOptionEditorBlur(lastOption.id)}
            />
          </div>
          <textarea className={styles['other-textarea']} rows="3" placeholder="请输入" readOnly />
        </div>
      )
    }
    return null;
  }

  return (
    <QuesContentCard id={id} tag="单选">
      <QuesContentCard.ContentSlot>
        <div className={styles['radio-option-wrapper']}>
          <SortableContext
            items={optionIds}
            strategy={verticalListSortingStrategy}
          >
            {
              options.filter(e => !e.otherOption)
                .map(e =>
                  <RadioOption
                    id={e.id}
                    key={e.id}
                    questionKey={id}
                    contentState={e.label}
                    onCancel={handleCancelOption(e.id)}
                    onBlur={handleOptionEditorBlur(e.id)}
                  />
                )
            }
          </SortableContext>
          {renderOtherOption()}
          {
            reference &&
            <div className={styles['reference-tip']}>
              此题选项来源与第{getSerialByKey(refQuestionKey)}题中的选项，请先填写第{getSerialByKey(refQuestionKey)}题
            </div>
          }
        </div>
      </QuesContentCard.ContentSlot>
      <QuesContentCard.BottomSlot>
        <div>
          <Divider style={{margin: '0'}}/>
          <div className={styles['bottom-button-container']}>
            <LinkButton
              icon={<IconPlusCircle/>}
              text="添加选项"
              onClick={() => addOption()}
            />
            <Divider type="vertical"/>
            <LinkButton
              disabled={options[options.length - 1].otherOption}
              icon={<IconPlusCircle/>}
              text="添加其它"
              onClick={() => addOtherOption()}
            />
          </div>
        </div>
      </QuesContentCard.BottomSlot>
    </QuesContentCard>
  );
}

export default Radio;