import { createContext, useCallback, useEffect, useState } from "react";
import {
  closestCenter,
  rectIntersection,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { getEventCoordinates } from '@dnd-kit/utilities'
import { createPortal } from "react-dom";
import { QuestionTabTag } from "@/pages/editor/form-design/QuestionTypeTab";
import { IconCodeSquare} from "@arco-design/web-react/icon";
import { Map } from "immutable";
import {
  crateDefaultQuestion,
  isInputModeQuestionType,
  questionTypes
} from "@/pages/editor/form-design/question-service";
import { randomStr } from "@/utils/random";
import { arrayMove } from "@dnd-kit/sortable";
import { useNavigate, useSearchParams } from "react-router-dom";
import request from "@/utils/request";
import { useLoading } from "@/components/Loading";
import { convertFromRaw, convertToRaw } from "draft-js";
import { Message } from "@arco-design/web-react";

export const FdContext = createContext(null);

export const quesTypeList = questionTypes.flatMap(category => category.types);
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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {loading, setLoading} = useLoading();
  const [activeDraggable, setActiveDraggable] = useState({});
  const [pageOrder, setPageOrder] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [quesOrder, setQuesOrder] = useState({typeOrder: initQuesTypeOrder(), itemOrder: {}})
  const [quesDetailMap, setQuesDetailMap] = useState(Map({}));
  const [activeQuestionKey, setActiveQuestionKey] = useState(null);
  const [quesSerial, setQuesSerial] = useState(Map({}));
  const [surveySummary, setSurveySummary] = useState({});
  const [surveySettings, setSurveySettings] = useState({});
  const [swapQuestionPause, setSwapQuestionPause] = useState(false);

  const mouseSensor = useSensor(MouseSensor, {activationConstraint: {distance: 10}});
  const touchSensor = useSensor(TouchSensor, {activationConstraint: {distance: 10}});
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    const surveyId = searchParams.get('id');
    if (surveyId === null) {
      navigate('/error/404');
    }
    setLoading(true);
    request
      .get('/survey/detail', {params: {surveyId}})
      .then(res => {
        const {data: {pages, survey, settings}} = res;
        const pageOrder = pages.map(page => page.pageKey);
        const currentPage = pageOrder[0];
        const itemOrder = {};
        pages.forEach(page => itemOrder[page.pageKey] = page.questions.map(ques => ques.questionKey));
        const questions = pages.flatMap(page => page.questions);
        let quesDetailMap = Map({});
        questions.forEach(ques => {quesDetailMap = quesDetailMap.set(ques.questionKey, Map(convertRemoteQuesToDetail(ques)))});
        setPageOrder(pageOrder);
        setCurrentPage(currentPage);
        setQuesOrder({typeOrder: initQuesTypeOrder(), itemOrder})
        setQuesDetailMap(quesDetailMap);
        setSurveySummary({title: survey.title, instruction: convertFromRaw(survey.instruction)});
        setSurveySettings(settings);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
        navigate('/error/500');
      })
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // 没有完成初始化前直接返回
    if (pageOrder.length === 0 || quesOrder.itemOrder.length === 0) {
      return;
    }
    let qs = Map({});
    let begin = 1;
    pageOrder.forEach((pageKey) => {
      quesOrder.itemOrder[pageKey].forEach((key) => {
        const quesDetail = quesDetailMap.get(key);
        if (quesDetail && isInputModeQuestionType(quesDetail.get('type'))) {
          qs = qs.set(key, begin);
          begin++;
        }
      });
    })
    setQuesSerial(qs);
    // eslint-disable-next-line
  }, [pageOrder, quesOrder]);

  const convertRemoteQuesToDetail = ques => {
    const {questionKey, title, description, type, pageKey, required, additionalInfo} = ques;
    let detail = {
      questionKey,
      title: convertFromRaw(title),
      description: description ? convertFromRaw(description) : null,
      type,
      pageKey,
      required,
      additionalInfo
    };
    switch (type) {
      case 'RADIO':
      case 'CHECKBOX': {
        detail.additionalInfo = {
          ...additionalInfo,
          options: additionalInfo.options.map(o => ({...o, label: convertFromRaw(o.label)}))
        }
        break;
      }
      default: {
        detail.additionalInfo = {...additionalInfo}
      }
    }
    return detail;
  };

  const convertQuesDetailToParam = quesDetail => {
    const title = quesDetail.get('title');
    const description = quesDetail.get('description');
    const type = quesDetail.get('type');
    const additionalInfo = quesDetail.get('additionalInfo');
    const quesDetailJs = quesDetail.toJS();
    const param = {
      ...quesDetailJs,
      title: convertToRaw(title),
      description: description ? convertToRaw(description) : null
    };
    switch (type) {
      case 'RADIO':
      case 'CHECKBOX': {
        param.additionalInfo = {
          ...additionalInfo,
          options: additionalInfo.options.map(o => ({...o, label: convertToRaw(o.label)}))
        }
        break;
      }
      default: {
        param.additionalInfo = {...additionalInfo}
      }
    }
    return param;
  }

  const collisionDetectionStrategy = useCallback(
    (args) => {
      const activeType = args.active.data.current?.type;
      if (activeType === 'quesTypeTag') {
        return rectIntersection({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.data.current?.type === 'question'
          )
        });
      }

      if (activeType === 'quesIndicator') {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) =>
              container.data.current?.type === 'question'
              || container.data.current?.type === 'quesIndicator'
          )
        })
      }

      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container) => container.data.current?.type === activeType
        )
      });
    },
    []
  );

  // 通过key获取问题题号
  const getSerialByKey = (key) => {
    return quesSerial.get(key);
  }

  // 通过key获取题目详情
  const getQuesDetailByKey = (key) => {
    return quesDetailMap.get(key);
  }

  const setQuesDetailByKey = (key, detail) => {
    setQuesDetailMap(quesDetailMap.set(key, detail));
  }

  const setQuesDetail = (detail) => {
    request
      .put('/survey/question', {
        ...convertQuesDetailToParam(detail),
        surveyId: searchParams.get('id'),
        pageKey: null
      })
      .then(() => {
        setQuesDetailMap(quesDetailMap.set(detail.get('questionKey'), detail));
      })
      .catch(err => {
        const {errorKey, message} = err.response.data;
        if(errorKey === 'logic_dependent') {
          Message.error(message);
        } else {
          Message.error(`题目保存失败，请刷新页面后重试`);
          console.error(err);
        }
      })
  }

  // 生成一个问题Key
  const getNextQuesKey = () => {
    let id = 'q_' + randomStr();
    return quesDetailMap.has(id) ? getNextQuesKey() : id;
  }

  const getNextPageKey = () => {
    let id = 'p_' + randomStr();
    return pageOrder.indexOf(id) !== -1 ? getNextPageKey() : id;
  }

  const createNewQuestion = (type, pageKey) => {
    const questionKey = getNextQuesKey();
    const question = crateDefaultQuestion(type, questionKey, pageKey);
    return {questionKey, question};
  }

  //创建一个新的问题
  const createQuestion = (param, action = 'add') => {
    const {type, targetKey, position} = param;
    let questionKey, question;
    if (action === 'copy') {
      questionKey = getNextQuesKey();
      question = getQuesDetailByKey(targetKey).set('questionKey', questionKey);
    } else {
      const createdQues = createNewQuestion(type, currentPage);
      questionKey = createdQues.questionKey;
      question = createdQues.question;
    }

    const {typeOrder, itemOrder} = quesOrder;
    let currentPageItemOrder;
    if (targetKey && (position || action === 'copy')) {
      let targetIndex = itemOrder[currentPage].indexOf(targetKey);
      if (position === 'before') {
        currentPageItemOrder = [...itemOrder[currentPage].slice(0, targetIndex), questionKey, ...itemOrder[currentPage].slice(targetIndex)];
      } else {
        currentPageItemOrder = [...itemOrder[currentPage].slice(0, targetIndex + 1), questionKey, ...itemOrder[currentPage].slice(targetIndex + 1)];
      }
    } else {
      currentPageItemOrder = [...itemOrder[currentPage], questionKey];
    }
    fetchCreateQuestion({
      ...convertQuesDetailToParam(question),
      sortedPageKeys: pageOrder,
      sortedQuestionKeys: currentPageItemOrder,
      surveyId: searchParams.get('id')
    })
      .then(() => {
        setQuesDetailMap(quesDetailMap.set(questionKey, question));
        setQuesOrder({
          typeOrder,
          itemOrder: {
            ...itemOrder,
            [currentPage]: currentPageItemOrder
          }
        });
        setActiveQuestionKey(questionKey);
      })
      .catch(err => {
        Message.error(`添加问题失败：${err.response.data.message}`);
      })
  }

  // 删除一个问题
  const deleteCurrentPageQuestionByKey = (questionKey) => {
    const {typeOrder, itemOrder} = quesOrder;
    if (itemOrder[currentPage].length === 1) {
      Message.error('每一页至少需要一个题目')
      return;
    }
    request
      .delete(`/survey/${searchParams.get('id')}/question/${questionKey}`)
      .then(() => {
        setQuesDetailMap(quesDetailMap.delete(questionKey));
        setQuesOrder({
          typeOrder,
          itemOrder: {
            ...itemOrder,
            [currentPage]: itemOrder[currentPage].filter(key => key !== questionKey)
          }
        });
      })
      .catch(err => {
        Message.error(err.response.data.message);
      })
  }

  /**
   * 删除分页
   */
  const deletePage = (index) => {
    if (pageOrder.length <= 1) {
      Message.error('每个问卷至少有一个分页');
      return;
    }
    const pageKey = pageOrder[index];
    let {itemOrder} = quesOrder;
    let newCurrentPage = currentPage;
    if (pageKey === currentPage) {
      newCurrentPage = index === 0 ? pageOrder[1] : pageOrder[index - 1];
    }

    request
      .delete(`/survey/${searchParams.get('id')}/page/${pageKey}`)
      .then(() => {
        let newQuesDetailMap = quesDetailMap;
        Object.keys(itemOrder).forEach(quesKey => {
          newQuesDetailMap = quesDetailMap.delete(quesKey);
        })
        const newPageOrder = pageOrder.filter(key => key !== pageKey);
        delete itemOrder[pageKey];
        setPageOrder(newPageOrder);
        setQuesOrder({...quesOrder, itemOrder});
        setQuesDetailMap(newQuesDetailMap);
        setCurrentPage(newCurrentPage);
      })
      .catch(err => Message.error(err.response.data.message))
  }

  const fetchCreateQuestion = (data) => {
    return request
      .post('/survey/question', data);
  }

  const createPage = () => {
    const pageKey = getNextPageKey();
    const {questionKey, question} = createNewQuestion('RADIO', pageKey);
    const sortedPageKeys = [...pageOrder, pageKey];
    const currentPageItemOrder = [questionKey];
    fetchCreateQuestion({
      ...convertQuesDetailToParam(question),
      sortedPageKeys: sortedPageKeys,
      sortedQuestionKeys: currentPageItemOrder,
      surveyId: searchParams.get('id')
    })
      .then(() => {
        setQuesDetailMap(quesDetailMap.set(questionKey, question));
        setPageOrder([...pageOrder, pageKey]);
        setQuesOrder({
          ...quesOrder,
          itemOrder: {
            ...quesOrder.itemOrder,
            [pageKey]: [questionKey]
          }
        });
        setCurrentPage(pageKey);
      })
      .catch(err => {
        Message.error(`新建分页失败：${err.response.data.message}`);
      });
  }

  const updateSurveySummary = (data) => {
      request
        .put(`/survey/${searchParams.get('id')}`, {
          title: data.title,
          instruction: convertToRaw(data.instruction)
        })
        .catch((err) => {
          Message.error(`服务器异常: ${err.response.data.message}`);
        });
  }

  // 交换两个问题的顺序
  const swapQuestions = (activeId, overId) => {
    if (activeId !== overId) {
      if (swapQuestionPause) {
        return;
      }
      setSwapQuestionPause(true);
      const snapshot = quesOrder;
      const {typeOrder, itemOrder} = quesOrder;
      const oldIndex = itemOrder[currentPage].indexOf(activeId);
      const newIndex = itemOrder[currentPage].indexOf(overId);
      setQuesOrder({
        typeOrder,
        itemOrder: {
          ...itemOrder,
          [currentPage]: arrayMove(itemOrder[currentPage], oldIndex, newIndex)
        }
      });
      request
        .post('/survey/question/swapQuestionDisplayOrder', {
          surveyId: searchParams.get('id'),
          sourceQuestionKey: activeId,
          targetQuestionKey: overId
        })
        .catch(err => {
          setQuesOrder(snapshot);
          Message.error(err.response.data.message)
        })
        .finally(() => {
          setSwapQuestionPause(false);
        })
    }
  }

  const getQuestionBeforeKey = (questionKey, type) => {
    let result = [];
    const itemOrder = quesOrder.itemOrder;
    for (let pageKey of pageOrder) {
      for (let quesKey of itemOrder[pageKey]) {
        if (quesKey === questionKey) {
          return result;
        }
        const ques = quesDetailMap.get(quesKey)
        if (!ques) {
          break;
        }
        if (!type || (type && ques.get('type') === type)) {
          result = [...result, ques];
        }
      }
    }
    return result;
  };

  const contextProps = {
    getQuesTypeByKey,
    getQuesDetailByKey,
    setQuesDetailByKey,
    deleteCurrentPageQuestionByKey,
    currentPage,
    setCurrentPage,
    pageOrder,
    setPageOrder,
    quesOrder,
    surveySummary,
    setQuesDetail,
    updateSurveySummary,
    createPage,
    getSerialByKey,
    createQuestion,
    swapQuestions,
    activeQuestionKey,
    setActiveQuestionKey,
    getQuestionBeforeKey,
    surveySettings,
    setSurveySettings,
    deletePage
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
      const {questionKey, question} = createNewQuestion(active.id, currentPage);
      let currentPageItemOrder;
      if (over.id === active.id) {
        currentPageItemOrder = itemOrder[currentPage].map(e => e === active.id ? questionKey : e);
      } else {
        const activeIndex = itemOrder[currentPage].indexOf(active.id);
        const overIndex =  itemOrder[currentPage].indexOf(over.id);
        currentPageItemOrder = arrayMove(itemOrder[currentPage], activeIndex, overIndex).map(e => e === active.id ? questionKey : e);
      }
      fetchCreateQuestion({
        ...convertQuesDetailToParam(question),
        sortedPageKeys: pageOrder,
        sortedQuestionKeys: currentPageItemOrder,
        surveyId: searchParams.get('id')
      })
        .then(() => {
          setQuesDetailMap(quesDetailMap.set(questionKey, question));
          setQuesOrder({
            typeOrder: initQuesTypeOrder(),
            itemOrder: {
              ...itemOrder,
              [currentPage]: currentPageItemOrder
            }
          });
        })
        .catch(err => {
          setQuesOrder({
            typeOrder: initQuesTypeOrder(),
            itemOrder: {
              ...itemOrder,
              [currentPage]: itemOrder[currentPage].filter(e => e !== active.id)
            }
          });
          Message.error(`添加问题失败：${err.response.data.message}`);
        })
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
      const quesIdIndex = itemOrder[currentPage].indexOf(over.id);
      setQuesOrder({
        typeOrder: [
          ...typeOrder.map(category => ({
            ...category,
            typeKeys: category.typeKeys.map(key => key === active.id ? `DRAGGING_${key}` : key)
          }))
        ],
        itemOrder: {
          ...itemOrder,
          [currentPage]: [
            ...itemOrder[currentPage].slice(0, quesIdIndex),
            active.id,
            ...itemOrder[currentPage].slice(quesIdIndex, itemOrder[currentPage].length)
          ]
        }
      });
    }
  }

  const renderDragOverlay = () => {
    if (activeDraggable) {
      const {type} = activeDraggable;
      if (type === 'quesTypeTag') {
        const {icon, label} = getQuesTypeByKey(activeDraggable.id);
        return <QuestionTabTag icon={icon} dragOverlay label={label} />
      } else if (type === 'question') {
        return <QuestionTabTag icon={<IconCodeSquare />} dragOverlay label="题目" />;
      } else if (type === 'radioOption' || type === 'checkBoxOption') {
        return <QuestionTabTag icon={<IconCodeSquare />} dragOverlay label="选项" />;
      }
    }
    return <QuestionTabTag icon={<IconCodeSquare />} dragOverlay label="拖拽组件" />;
  }

  return (
    <FdContext.Provider value={contextProps}>
      <DndContext
        modifiers={[followMouseModifier]}
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragOver={handleDragOver}
        onDragStart={e => {
          setActiveDraggable({id: e.active.id, type: e.active.data.current.type})
        }}
        onDragEnd={handleDragEnd}
      >
        {!loading && children}
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