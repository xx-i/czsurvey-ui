import { createContext, useState } from "react";
import {
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

  const mouseSensor = useSensor(MouseSensor, {activationConstraint: {distance: 10}});
  const touchSensor = useSensor(TouchSensor, {activationConstraint: {distance: 10}});
  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const getQuesDetailByKey = (key) => {
    return quesDetailMap.get(key);
  }

  const getNextQuesKey = () => {
    let id = randomStr();
    return quesDetailMap.has(id) ? getNextQuesKey() : id;
  }

  const createQuestion = (type) => {
    const questionKey = getNextQuesKey();
    const question = crateDefaultQuestion(type, getNextQuesKey(questionKey));
    setQuesDetailMap(quesDetailMap.set(questionKey, question));
    setQuesOrder({...quesOrder, itemOrder: [...quesOrder.itemOrder, questionKey]});
  }

  const sortQuestions = (activeId, overId) => {
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
    createQuestion,
    sortQuestions,
    activeQuestionKey,
    setActiveQuestionKey
  }

  const handleDragEnd = e => {
    const {active, over} = e;
    if (active.data?.current?.type === over?.data?.current?.type) {
      sortQuestions(active.id, over.id);
    }
    setActiveDraggable(null);
    console.log(e);
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