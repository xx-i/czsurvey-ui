import styles from './style/index.module.less';
import { Button, Empty, Link, Message, Select, Spin } from "@arco-design/web-react";
import { IconDelete, IconMinus, IconPlus, IconPlusCircle } from "@arco-design/web-react/icon";
import classNames from "classnames";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import request from "@/utils/request";
import { convertFromRaw } from "draft-js";
import { Map } from "immutable";
import { isInputModeQuestionType } from "@/pages/editor/form-design/question-service";

function Logic() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [questionsMap, setQuestionMap] = useState(new Map());
  const [logics, setLogics] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const createEmptyLogic = () => {
    const emptyLogic = {
      surveyId: searchParams.get('id'),
      expression: 'ALL',
      conditions: [{questionKey: undefined, expression: 'SELECTED', optionId: undefined}],
      questionKeys: [undefined]
    };
    setLogics([...logics, emptyLogic]);
  }

  useEffect(() => {
    const surveyId = searchParams.get('id');
    if (surveyId === null) {
      navigate('/error/404');
    }
    setPageLoading(true);
    let begin = 1;
    request
      .get('/survey/detail', {params: {surveyId}})
      .then(res => {
        const {pages, logics} = res.data;
        const remoteQuestions = pages.flatMap(page => {
          return page.questions.map(ques => ({
            ...ques,
            pageOrderNum: page.orderNum,
            serial: isInputModeQuestionType(ques.type) ? begin++ : '',
            titleText: convertFromRaw(ques.title).getPlainText(),
            options: ['CHECKBOX', 'SELECT', 'RADIO'].indexOf(ques.type) !== -1
              && ques.additionalInfo.options.map(option => ({...option, labelText: convertFromRaw(option.label).getPlainText()})),
          }))
        });
        let questionMap = new Map();
        remoteQuestions.forEach(question => {
          questionMap = questionMap.set(question.questionKey, question);
        })
        setQuestions(remoteQuestions);
        setQuestionMap(questionMap);
        setLogics(logics);
        setTimeout(() => setPageLoading(false), 300);
      })
      .catch((err) => {
        setPageLoading(false);
        console.error(err);
        navigate('/error/500');
      })
    // eslint-disable-next-line
  }, [searchParams]);

  const addLogicCondition = (logicIndex) => {
    setLogics(logics.map((logic, index) => {
      return logicIndex === index ?
        {...logic, conditions: [...logic.conditions, {questionKey: undefined, expression: 'SELECTED', optionId: undefined}]} : logic;
    }));
  }

  const removeLogicCondition = (logicIndex, removeConditionIndex) => {
    checkAndSaveLogic({
      ...logics[logicIndex],
      conditions: logics[logicIndex].conditions.filter((_, conditionIndex) => conditionIndex !== removeConditionIndex)
    }, logicIndex);
  }

  const addLogicResult = (logicIndex) => {
    setLogics(logics.map((logic, index) => {
      return logicIndex === index ? {...logic, questionKeys: [...logic.questionKeys, undefined]} : logic;
    }));
  }

  const removeLogicResult = (logicIndex, removeLogicResultIndex) => {
    checkAndSaveLogic({
      ...logics[logicIndex],
      questionKeys: logics[logicIndex].questionKeys.filter((_, resultIndex) => resultIndex !== removeLogicResultIndex)
    }, logicIndex)
  }

  const removeLogic = (logicIndex) => {
    const logic = logics[logicIndex];
    if (logic.id) {
      setLoading(true);
      request
        .delete(`/survey/logic/${logic.id}`)
        .then(_ => {
          setLoading(false);
          setLogics(logics.filter((_, index) => index !== logicIndex));
        })
        .catch(err => {
          setLoading(false);
          Message.error(err.response.data.message);
        });
    } else {
      setLogics(logics.filter((_, index) => index !== logicIndex));
    }
  }

  const checkLogicIntegrality = (logicItem) => {
    const {expression, conditions, questionKeys} = logicItem;
    let isConditionsIntegrality = true;
    let isQuestionKeysIntegrality = true;
    for (let condition of conditions) {
      const {questionKey, expression, optionId} = condition;
      if (!(questionKey && expression && optionId)) {
        isConditionsIntegrality = false;
        break;
      }
    }
    for (let questionKey of questionKeys) {
      if (!questionKey) {
        isQuestionKeysIntegrality = false;
        break;
      }
    }
    return expression && isConditionsIntegrality && isQuestionKeysIntegrality;
  }

  const checkAndSaveLogic = (newLogic, index) => {
    if (checkLogicIntegrality(newLogic)) {
      setLoading(true);
      request
        .post('/survey/logic', newLogic)
        .then(res => {
          setLoading(false);
          setLogics(logics.map((logic, updateIndex) => index === updateIndex ? {...newLogic, id: res.data.id} : logic));
        })
        .catch(err => {
          setLoading(false);
          Message.error(err.response.data.message);
        })
    } else {
      setLogics(logics.map((logic, updateIndex) => index === updateIndex ? newLogic : logic));
    }
  }

  const renderResultQuestions = (logicIndex) => {
    const currentLogic = logics[logicIndex];
    const {conditions} = currentLogic;
    let maxPageOrderNum = -1;
    let maxQuestionOrderNum = -1;
    conditions.map(condition => condition.questionKey)
      .filter(questionKey => questionKey !== null && questionKey !== undefined)
      .forEach(questionKey => {
        const questionDetail = questionsMap.get(questionKey);
        if (questionDetail.pageOrderNum >= maxPageOrderNum) {
          maxPageOrderNum = questionDetail.pageOrderNum;
          maxQuestionOrderNum = Math.max(questionDetail.orderNum, maxQuestionOrderNum);
        }
      });
    return questions.map(question => (
      <Select.Option
        key={question.id}
        value={question.questionKey}
        disabled={
          (question.pageOrderNum < maxPageOrderNum || (question.pageOrderNum === maxPageOrderNum && question.orderNum <= maxQuestionOrderNum))
          || (currentLogic.questionKeys.indexOf(question.questionKey) !== -1)
        }
      >
        {`${question.serial && `${question.serial}. `}${question.titleText}`}
      </Select.Option>
    ))
  };

  return (
    <div>
      {
        pageLoading ? (
          <div className="loading-wrapper">
            <Spin loading={true} style={{display: "block"}} size={40}/>
          </div>
        ) : (
          <div className={classNames('rewrite-arco', styles['logic-wrapper'])}>
            <Spin className={styles['logic-spin']} loading={loading}>
              <div className={styles['logic-view']}>
                <div className={styles['logic-head']}>
                  <div className={styles['logic-title']}>逻辑设置</div>
                  <div>
                    <Button type="outline" size="small" icon={<IconPlusCircle />} onClick={() => createEmptyLogic()}>添加逻辑</Button>
                  </div>
                </div>
                <div className={styles['logic-content']}>
                  {
                    logics.length === 0 ? (
                      <div className={styles['empty-content']}>
                        <Empty description={<span>您还未设置任何逻辑，请<Link>添加逻辑</Link></span>} />
                      </div>
                    ) : (
                      <ul className={styles['logic-list']}>
                        {
                          logics.map((logic, index) => (
                            <li className={styles['logic-item']} key={index}>
                              <div className={styles['deleted-btn']}>
                                <Button type="primary" status="danger" icon={<IconDelete />} size="mini" onClick={() => removeLogic(index)}/>
                              </div>
                              <div className={styles['logic-line']}>
                                <span className={styles['mr16']}>当满足以下</span>
                                <Select
                                  className={styles['sw']}
                                  value={logic.expression}
                                  onChange={value => {
                                    setLogics(logics.map((updateLogic, updateIndex) => {
                                      return index === updateIndex ? {...updateLogic, expression: value} : updateLogic;
                                    }));
                                  }}
                                >
                                  <Select.Option key="ALL" value="ALL">全部</Select.Option>
                                  <Select.Option key="ANY" value="ANY">任意</Select.Option>
                                </Select>
                                <span>条件: </span>
                              </div>
                              <div>
                                {
                                  logic.conditions.map((condition, conditionIndex) => (
                                    <div className={styles['logic-line']} key={conditionIndex}>
                                      <span className={styles['mr16']}>题目</span>
                                      <Select
                                        className={styles['lw']}
                                        placeholder="请选则题目"
                                        value={condition.questionKey}
                                        onChange={value => {
                                          const selectedQuestion = questionsMap.get(value);
                                          checkAndSaveLogic({
                                            ...logics[index],
                                            conditions: logics[index].conditions.map((updateCondition, updateConditionIndex) => {
                                              return conditionIndex === updateConditionIndex ? {
                                                ...updateCondition,
                                                questionKey: value,
                                                optionId: undefined,
                                              } : updateCondition;
                                            }),
                                            questionKeys: logics[index].questionKeys.map(questionKey => {
                                              if (questionKey === undefined) {
                                                return questionKey;
                                              }
                                              const question = questionsMap.get(questionKey);
                                              return selectedQuestion.pageOrderNum > question.pageOrderNum
                                              || (selectedQuestion.pageOrderNum === question.pageOrderNum && selectedQuestion.orderNum >= question.orderNum)
                                                ? undefined : questionKey;
                                            })
                                          }, index);
                                        }}
                                      >
                                        {
                                          questions
                                            .filter(question => ['CHECKBOX', 'SELECT', 'RADIO'].indexOf(question.type) !== -1)
                                            .map(question => (
                                              <Select.Option key={question.id} value={question.questionKey}>
                                                {`${question.serial}. ${question.titleText}`}
                                              </Select.Option>
                                            ))
                                        }
                                      </Select>
                                      <Select
                                        className={styles['sw']}
                                        value={condition.expression}
                                        onChange={value => {
                                          checkAndSaveLogic({
                                            ...logics[index],
                                            conditions: logics[index].conditions.map((updateCondition, updateConditionIndex) => {
                                              return conditionIndex === updateConditionIndex ? {...updateCondition, expression: value} : updateCondition;
                                            })
                                          }, index);
                                        }}
                                      >
                                        <Select.Option key="SELECTED" value="SELECTED">选中</Select.Option>
                                        <Select.Option key="UNSELECTED" value="UNSELECTED">未选中</Select.Option>
                                      </Select>
                                      <Select
                                        className={styles['lw']}
                                        placeholder="请选则选项"
                                        value={condition.optionId}
                                        onChange={value => {
                                          checkAndSaveLogic({
                                            ...logics[index],
                                            conditions: logics[index].conditions.map((updateCondition, updateConditionIndex) => {
                                              return conditionIndex === updateConditionIndex ? {...updateCondition, optionId: value} : updateCondition;
                                            })
                                          }, index);
                                        }}
                                      >
                                        {
                                          questions.find(question => question.questionKey === condition.questionKey)
                                            ?.options
                                            .map(option => (
                                              <Select.Option key={option.id} value={option.id}>
                                                {option.labelText}
                                              </Select.Option>
                                            ))
                                        }
                                      </Select>
                                      <span className={styles['add-button-group']}>
                                {
                                  logic.conditions.length - 1 === conditionIndex &&
                                  <Button
                                    shape="circle"
                                    type="outline"
                                    size="mini"
                                    icon={<IconPlus />}
                                    onClick={() => addLogicCondition(index)}
                                  />
                                }
                                        {
                                          logic.conditions.length > 1 &&
                                          <Button
                                            shape="circle"
                                            type="outline"
                                            size="mini"
                                            status='danger'
                                            icon={<IconMinus />}
                                            onClick={() => removeLogicCondition(index, conditionIndex)}
                                          />
                                        }
                              </span>
                                    </div>
                                  ))
                                }
                              </div>
                              <div>
                                {
                                  logic.questionKeys.map((questionKey, questionKeyIndex) => (
                                    <div className={styles['logic-line']} key={questionKeyIndex}>
                                      <span className={styles['mr16']}>显示题目</span>
                                      <Select
                                        className={styles['lw']}
                                        placeholder="请选择题目"
                                        value={questionKey}
                                        onChange={value => {
                                          checkAndSaveLogic({
                                            ...logics[index],
                                            questionKeys: logics[index].questionKeys.map((updateQuestionKey, updateQuestionKeyIndex) => {
                                              return questionKeyIndex === updateQuestionKeyIndex ? value : updateQuestionKey;
                                            })
                                          }, index);
                                        }}
                                      >
                                        {renderResultQuestions(index)}
                                      </Select>
                                      <span className={styles['mr16']}>否则不显示</span>
                                      <span className={styles['add-button-group']}>
                                {
                                  logic.questionKeys.length - 1 === questionKeyIndex &&
                                  <Button
                                    shape="circle"
                                    type="outline"
                                    size="mini"
                                    icon={<IconPlus />}
                                    onClick={() => addLogicResult(index)}/>
                                }
                                        {
                                          logic.questionKeys.length > 1 &&
                                          <Button
                                            shape="circle"
                                            type="outline"
                                            size="mini"
                                            status='danger'
                                            icon={<IconMinus />}
                                            onClick={() => removeLogicResult(index, questionKeyIndex)}
                                          />
                                        }
                              </span>
                                    </div>
                                  ))
                                }
                              </div>
                            </li>
                          ))
                        }
                      </ul>
                    )
                  }
                </div>
              </div>
            </Spin>
          </div>
        )
      }
    </div>
  );
}

export default Logic;