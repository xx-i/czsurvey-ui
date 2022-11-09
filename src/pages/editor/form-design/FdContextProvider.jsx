import { createContext, useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { getEventCoordinates } from '@dnd-kit/utilities'
import { createPortal } from "react-dom";
import { QuestionTabTag } from "@/pages/editor/form-design/QuesTypeTab";
import { IconCodeSquare} from "@arco-design/web-react/icon";
import { Map } from "immutable";
import { crateDefaultQuestion, questionTypes } from "@/pages/editor/form-design/question-service";
import { randomStr } from "@/utils/random";
import { arrayMove } from "@dnd-kit/sortable";

export const FdContext = createContext(null);

const quesTypeList = questionTypes.flatMap(category => category.types);
const quesTypeMap = {};
quesTypeList.forEach(e => quesTypeMap[e.key] = e);

const getQuesTypeByKey = (key) => quesTypeMap[key];

const initQuesTypeOrder = () => {
  const quesTypeOrder = [];
  questionTypes.forEach(e => {
    const { id, label } = e;
    quesTypeOrder.push({id, label, typeKeys: e.types.map(t => t.key)});
  });
  return quesTypeOrder;
}

/**
 * 自定义修饰符，使DragOverlay定位到指针的中心
 */
const followMouseModifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent) {
    const activatorCoordinates = getEventCoordinates(activatorEvent);

    if (!activatorCoordinates) {
      return transform;
    }
    const offsetY = activatorCoordinates.y - draggingNodeRect.top;
    const offsetX = activatorCoordinates.x - draggingNodeRect.left;
    return {
      x: transform.x + offsetX - draggingNodeRect.width / 2,
      y: transform.y + offsetY - draggingNodeRect.height / 2,
    }
  }
  return transform;
}

function FdContextProvider({children}) {

  const [activeDraggable, setActiveDraggable] = useState({});
  const [quesOrder, setQuesOrder] = useState({typeOrder: initQuesTypeOrder(), itemOrder: []})
  const [quesDetailMap, setQuesDetailMap] = useState(Map({}));
  const [activeQuestionKey, setActiveQuestionKey] = useState(null);
  const [quesSerial, setQuesSerial] = useState(Map({}));

  const mouseSensor = useSensor(MouseSensor, {activationConstraint: {distance: 10}});
  const touchSensor = useSensor(TouchSensor, {activationConstraint: {distance: 10}});
  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);


  useEffect(() => {
    let qs = Map({});
    let begin = 1;
    quesOrder.itemOrder.forEach((key) => {
      if (key.startsWith('q_')) {
        let serialStr = begin < 10 ? '0' + begin.toString() : begin.toString();
        qs = qs.set(key, serialStr);
        begin++;
      }
    });
    setQuesSerial(qs);
  }, [quesOrder])

  // 通过key获取问题题号
  const getSerialByKey = (key) => {
    return quesSerial.get(key);
  }

  // 通过key获取题目详情
  const getQuesDetailByKey = (key) => {
    return quesDetailMap.get(key);
  }

  // 生成一个问题Key
  const getNextQuesKey = () => {
    let id = 'q_' + randomStr();
    return quesDetailMap.has(id) ? getNextQuesKey() : id;
  }

  const createNewQuestion = (type) => {
    const questionKey = getNextQuesKey();
    const question = crateDefaultQuestion(type, getNextQuesKey(questionKey));
    setQuesDetailMap(quesDetailMap.set(questionKey, question));
    return questionKey;
  }

  //创建一个新的问题
  const createQuestion = (type) => {
    const questionKey = createNewQuestion(type);
    setQuesOrder({...quesOrder, itemOrder: [...quesOrder.itemOrder, questionKey]});
  }


  // 交换两个问题的顺序
  const swapQuestions = (activeId, overId) => {
    if (activeId !== overId) {
      const {itemOrder} = quesOrder;
      const oldIndex = itemOrder.indexOf(activeId);
      const newIndex = itemOrder.indexOf(overId);
      setQuesOrder({...quesOrder, itemOrder: arrayMove(itemOrder, oldIndex, newIndex)});
    }
  }

  const contextProps = {
    getQuesTypeByKey,
    getQuesDetailByKey,
    quesOrder,
    getSerialByKey,
    createQuestion,
    swapQuestions,
    activeQuestionKey,
    setActiveQuestionKey
  }

  const handleDragEnd = e => {
    const {active, over} = e;
    const activeType = active.data?.current?.type;
    const overType = over?.data?.current?.type;
    if (activeType === 'question' &&  overType === 'question') {
      swapQuestions(active.id, over.id);
    }
    if (activeType === 'quesIndicator' && (overType === 'question' || overType === 'quesIndicator')) {
      const {itemOrder} = quesOrder;
      const questionKey = createNewQuestion(active.id);
      if (over.id === active.id) {
        setQuesOrder({
          typeOrder: initQuesTypeOrder(),
          itemOrder: itemOrder.map(e => e === active.id ? questionKey : e)
        });
      } else {
        const activeIndex = itemOrder.indexOf(active.id);
        const overIndex =  itemOrder.indexOf(over.id);
        setQuesOrder({
          typeOrder: initQuesTypeOrder(),
          itemOrder: arrayMove(itemOrder, activeIndex, overIndex).map(e => e === active.id ? questionKey : e)
        });
      }
    }
  }

  const handleDragOver = e => {
    const {active, over} = e;
    if (
      over !== null
      && active.data?.current?.type === 'quesTypeTag'
      && over.data?.current?.type === 'question'
    ) {
      const {typeOrder, itemOrder} = quesOrder;
      const quesIdIndex = itemOrder.indexOf(over.id);
      setQuesOrder({
        typeOrder: [
          ...typeOrder.map(category => ({
            ...category,
            typeKeys: category.typeKeys.map(key => key === active.id ? `DRAGGING_${key}` : key)
          }))
        ],
        itemOrder: [
          ...itemOrder.slice(0, quesIdIndex),
          active.id,
          ...itemOrder.slice(quesIdIndex, itemOrder.length)
        ]
      });
    }
  }

  const renderDragOverlay = () => {
    if (activeDraggable && activeDraggable.type === 'quesTypeTag') {
      const {icon, label} = getQuesTypeByKey(activeDraggable.id);
      return <QuestionTabTag icon={icon} dragOverlay label={label} />
    }
    return <QuestionTabTag icon={<IconCodeSquare />} dragOverlay label={"dragging"} />;
  }

  return (
    <FdContext.Provider value={contextProps}>
      <DndContext
        modifiers={[followMouseModifier]}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragStart={e => {
          setActiveDraggable({id: e.active.id, type: e.active.data.current.type})
        }}
        onDragEnd={handleDragEnd}
      >
        {children}
        {
          activeDraggable?.id ?
            createPortal(
              <DragOverlay dropAnimation={null}>
                {renderDragOverlay()}
              </DragOverlay>,
              document.body
            ) : null
        }
      </DndContext>
    </FdContext.Provider>
  );
}

export default FdContextProvider;