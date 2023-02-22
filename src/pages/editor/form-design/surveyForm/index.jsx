import React, { useMemo } from "react";
import classNames from "classnames";
import styles from "./style/index.module.less"
import { Scrollbar } from "react-scrollbars-custom";
import { Alert, Radio, Input, Checkbox, Button, Avatar, Typography, Divider } from "@arco-design/web-react";
import { useCallback, useEffect, useState } from "react";
import request from "@/utils/request";
import { Map, Set } from "immutable";
import { convertFromRaw } from "draft-js";
import { convertToHTML } from "draft-convert";
import { isChinese, isEmail, isEnglish, isIdCard, isMobile, isNumber, isPhone, isUrl } from "@/utils/validate";
import { IconLeft, IconUser } from "@arco-design/web-react/icon";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "@/utils/token-util";
import { IconSuccessFill, IconWarningFill } from "@arco-iconbox/react-cz-icon";
import { dayjs } from "@arco-design/web-react/es/_util/dayjs";

const randomOptions = (options) => {
  let fixedIndex = Set();
  options.forEach((option, index) => option.fixed && (fixedIndex = fixedIndex.add(index)));
  let targetIndex;
  for (let i = 0; i < options.length; ++i) {
    if (!fixedIndex.has(i)) {
      targetIndex = i;
      break;
    }
  }
  let temp = null;
  for (let i = 0; i < options.length; ++i) {
    const swapIndex = Math.floor(Math.random() * options.length);
    if (fixedIndex.has(swapIndex)) {
      continue;
    }
    temp = options[targetIndex];
    options[targetIndex] = options[swapIndex];
    options[swapIndex] = temp;
  }
  return options;
}

const blockToHTML = (block) => {
  if (block.type === 'unstyled') {
    return <p className="pe-line" />
  }
}

const formatOptionKey = (optionKey, suffix = '') => {
  const splitStrArr = optionKey.split('#');
  if (splitStrArr.length > 1) {
    return `${splitStrArr[0]}#${splitStrArr[1]}`;
  } else {
    return `${splitStrArr[0]}#${suffix}`
  }
}

function SurveyForm(
  {
    className,
    style,
    surveyId,
    surveyData,
    answerData,
    // answer:填写 | preview:预览 | browse:浏览
    type = 'answer',
    answerInfo,
  }
) {
  const [surveyDetail, setSurveyDetail] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitBtnLoading, setSubmitBtnLoading] = useState(false);
  const [isNativeScrollBar, setIsNativeBar] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState('NORMAL');
  const [startedDate, setStartedDate] = useState(new Date());
  const [logicsMap, setLogicsMap] = useState(Map());
  const [pageOrder, setPageOrder] = useState([]);
  const [quesMap, setQuesMap] = useState(Map());
  const [initialQuesMap, setInitialQuesMap] = useState(Map());
  const [pageMap, setPageMap] = useState(Map());
  const [displayQuestions, setDisplayQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [surveyAnswer, setSurveyAnswer] = useState(Map());
  const [errorInfoMap, setErrorInfoMap] = useState(Map());
  const [operatorBtnLoading, setOperatorBtnLoading] = useState(false);

  const {survey, settings} = surveyDetail;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBrowse = type === 'browse';

  const mobile = useMemo(() => isMobile() , []);

  useEffect(() => {
    const updateSize = () => {
      setIsNativeBar(window.innerWidth < 768);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getDisplayQuestions = useCallback(() => {
    let result = [];
    pageOrder.forEach(({pageKey}) => {
      let filterQuestions = [];
      const questions = pageMap.get(pageKey);
      questions.forEach(quesKey => {
        const question = quesMap.get(quesKey);
        // possessionConditions 问题挂载的逻辑
        // needConditions 此问题展示时需要的逻辑
        // completedConditions 已经满足的逻辑
        if (
          question.needConditions
          && question.needConditions.size > 0
          && question.completedConditions
          && question.needConditions.equals(question.completedConditions)
        ) {
          filterQuestions = [...filterQuestions, quesKey];
        } else if (!question.needConditions || question.needConditions.size === 0) {
          filterQuestions = [...filterQuestions, quesKey];
        }
      });
      if (filterQuestions.length > 0) {
        result = [...result, filterQuestions];
      }
    });
    return result;
  }, [pageMap, pageOrder, quesMap]);

  useEffect(() => {
    setDisplayQuestions(getDisplayQuestions());
  }, [getDisplayQuestions]);

  const loadSurvey = useCallback((data) => {
    const {logics, pages} = data;
    let logicsMap = Map();
    logics.forEach(logic => logicsMap = logicsMap.set(logic.id, logic));
    let pageOrder = pages.map(({pageKey, orderNum}) => ({pageKey, orderNum}));
    let quesMap = Map();
    let pageMap = Map();
    let begin = 1;
    pages.forEach(page => {
      let quesArray = [];
      page.questions.forEach(ques => {
        if (['RADIO', 'CHECKBOX', 'SELECT'].indexOf(ques.type) !== -1) {
          const {additionalInfo} = ques;
          let newOptions = additionalInfo.options;
          if (additionalInfo.reference) {
            const refQues = quesMap.get(additionalInfo.refQuestionKey);
            newOptions = [
              ...refQues.additionalInfo.options.map(option => ({...option, id: option.id + '#' + additionalInfo.refQuestionKey})),
              ...newOptions
            ];
          }
          if (additionalInfo.random) {
            newOptions = randomOptions(newOptions);
          }
          quesMap = quesMap.set(ques.questionKey, {
            ...ques,
            serial: begin++,
            additionalInfo: {...ques.additionalInfo, options: newOptions}
          });
        } else {
          quesMap = quesMap.set(ques.questionKey, {...ques, serial: ques.type !== 'DESCRIPTION' ? begin++ : null});
        }
        quesArray = [...quesArray, ques.questionKey];
      })
      pageMap = pageMap.set(page.pageKey, quesArray);
    });
    logics.forEach(logic => {
      logic.questionKeys.forEach(quesKey => {
        const ques = quesMap.get(quesKey);
        const needConditions = ques?.needConditions;
        const completedConditions = ques?.completedConditions;
        if (needConditions) {
          ques.needConditions = needConditions.add(logic.id);
        } else {
          ques.needConditions = Set.of(logic.id);
        }
        if (!completedConditions) {
          ques.completedConditions = Set();
        }
        quesMap = quesMap.set(quesKey, {...ques});
      });
      logic.conditions.forEach(condition => {
        const ques = quesMap.get(condition.questionKey);
        const possessionConditions = ques?.possessionConditions;
        if (possessionConditions) {
          ques.possessionConditions = possessionConditions.add(logic.id);
        } else {
          ques.possessionConditions = Set.of(logic.id);
        }
        quesMap = quesMap.set(condition.questionKey, {...ques});
      });
    });
    setSurveyDetail(data);
    setLogicsMap(logicsMap);
    setPageOrder(pageOrder);
    setQuesMap(quesMap);
    setInitialQuesMap(quesMap);
    setPageMap(pageMap);
    setStartedDate(Date.now());
  }, []);
  
  useEffect(() => {
    setLoading(true);
    const loadSurveyAndCheckStatus = (surveyData) => {
      const surveyDetail = surveyData;
      const {loginRequired, breakpointResume, saveLastAnswer} = surveyDetail.settings;
      const id = searchParams.get('id')
      if (loginRequired && !getToken()) {
        setLoading(false);
        mobile ? navigate(`/mobile/login?id=${id}`) : navigate(`/s/login?id=${id}`);
      }
      if (type === 'answer') {
        request
          .get(`/survey/answerState/${id}`)
          .then(res => {
            const status = res.data;
            setLoading(false);
            // 是否允许断点续传
            if (
              status === 'NORMAL'
              && breakpointResume
              && localStorage.getItem(`break_point_resume#${surveyId}`)
            ) {
              setSurveyStatus('BREAK_POINT');
            } else if (status === 'NORMAL' && saveLastAnswer) {
              if (localStorage.getItem(`last_answer#${surveyId}`)) {
                setSurveyStatus('LOAD_LAST_ANSWER');
              }
            } else {
              setSurveyStatus(status);
            }
            loadSurvey(surveyDetail);
          })
          .catch(err => {
            setLoading(false);
            if (err.response.status === 401) {
              mobile ? navigate(`/mobile/login?id=${id}`) : navigate(`/s/login?id=${id}`);
            }
          })
      } else {
        setLoading(false);
        loadSurvey(surveyDetail);
      }
    }
    if (!surveyId) {
      loadSurveyAndCheckStatus(surveyData);
    } else {
      request
        .get('/survey/detail', {params: {surveyId}})
        .then(res => {
          const surveyData = res.data;
          loadSurveyAndCheckStatus(surveyData);
        })
        .catch(err => {
          setLoading(false);
          console.error(err);
        })
    }
  }, [surveyData, loadSurvey, navigate, type, searchParams, surveyId, mobile]);

  const checkLogic = useCallback((question, quesMap, answerMap) => {
    const {type, possessionConditions} = question;
    if (['RADIO', 'CHECKBOX', 'SELECT'].indexOf(type) === -1) {
      return [quesMap, answerMap];
    }
    if (!possessionConditions || possessionConditions.size === 0) {
      return [quesMap, answerMap];
    }
    let newQuesMap = quesMap;
    possessionConditions.forEach(logicId => {
      const {conditions, expression, questionKeys} = logicsMap.get(logicId);
      let isMet = expression === 'ALL';
      for (let i = 0; i < conditions.length; ++i) {
        const condition = conditions[i];
        const conditionQuestion = quesMap.get(condition.questionKey);
        let conditionQuesAnswer = answerMap.get(condition.questionKey);
        if ((conditionQuestion.type === 'CHECKBOX' || conditionQuestion.type === 'RADIO')) {
          conditionQuesAnswer = conditionQuesAnswer?.value;
        }
        let isChecked;
        if (conditionQuestion.type === 'CHECKBOX') {
          isChecked = conditionQuesAnswer && conditionQuesAnswer.indexOf(condition.optionId) !== -1;
        } else {
          isChecked = conditionQuesAnswer && conditionQuesAnswer === condition.optionId;
        }
        if (
          (condition.expression === 'SELECTED' && !isChecked)
          || (condition.expression === 'UNSELECTED' && isChecked)
        ) {
          if (expression === 'ALL') {
            isMet = false;
            break;
          }
        } else if (expression === 'ANY') {
          isMet = true;
          break;
        }
      }
      questionKeys.forEach(resultQuesKey => {
        const resultQues = newQuesMap.get(resultQuesKey);
        let completedConditions = resultQues.completedConditions;
        if (isMet) {
          completedConditions = completedConditions.add(logicId);
          newQuesMap = newQuesMap.set(resultQuesKey, {...resultQues, completedConditions});
        } else {
          if (resultQues.needConditions.equals(completedConditions)) {
            completedConditions = completedConditions.delete(logicId);
            newQuesMap = newQuesMap.set(resultQuesKey, {...resultQues, completedConditions});
            answerMap = answerMap.delete(resultQuesKey);
            const [rNewQuesMap, rAnswerMap] = checkLogic(resultQues, newQuesMap, answerMap);
            newQuesMap = rNewQuesMap;
            answerMap = rAnswerMap;
          } else {
            completedConditions = completedConditions.delete(logicId);
            newQuesMap = newQuesMap.set(resultQuesKey, {...resultQues, completedConditions});
          }
        }
      });
    });
    return [newQuesMap, answerMap];
  }, [logicsMap]);

  const loadSurveyAnswer = useCallback((answerMap) => {
    if (initialQuesMap.size === 0) {
      return;
    }
    let newQuestionMap = initialQuesMap;
    let newAnswerMap = answerMap;
    pageOrder.forEach(({pageKey}) => {
      const questions = pageMap.get(pageKey);
      questions.forEach(quesKey => {
        const question = newQuestionMap.get(quesKey);
        if (question.possessionConditions && question.possessionConditions.size > 0) {
          const [rQuestionMap, rAnswerMap] = checkLogic(question, newQuestionMap, newAnswerMap);
          newQuestionMap = rQuestionMap;
          newAnswerMap = rAnswerMap;
        }
      })
    });
    setQuesMap(newQuestionMap);
    setSurveyAnswer(newAnswerMap);
  }, [initialQuesMap, pageOrder, pageMap, checkLogic]);

  useEffect(() => {
    if (answerData) {
      loadSurveyAnswer(Map(answerData));
    }
  }, [answerData, loadSurveyAnswer]);

  // 断点续答
  useEffect(() => {
    if (settings?.breakpointResume && surveyStatus === 'NORMAL' && type === 'answer') {
      let answerJson = JSON.stringify(surveyAnswer.toJS());
      if (answerJson !== '{}') {
        localStorage.setItem(`break_point_resume#${surveyId}`, answerJson);
      }
    }
  }, [type, surveyStatus, surveyId, settings, surveyAnswer]);

  const modifyLastQuestion = () => {
    setOperatorBtnLoading(true);
    request
      .get(`/survey/answer/last/${surveyId}`)
      .then(res => {
        if (res.data) {
          loadSurveyAnswer(Map(res.data.answer));
        }
        setSurveyStatus('NORMAL');
        setOperatorBtnLoading(false);
      })
      .catch(err => {
        console.error(err);
        setOperatorBtnLoading(false);
      })
  }

  const breakpointLoad = () => {
    setOperatorBtnLoading(true);
    let answerJson = localStorage.getItem(`break_point_resume#${surveyId}`);
    loadSurveyAnswer(Map(JSON.parse(answerJson)));
    setSurveyStatus('NORMAL');
    setOperatorBtnLoading(false);
  }

  const loadLastAnswer = () => {
    setOperatorBtnLoading(true);
    let answerJson = localStorage.getItem(`last_answer#${surveyId}`);
    loadSurveyAnswer(Map(JSON.parse(answerJson)));
    setSurveyStatus('NORMAL');
    setOperatorBtnLoading(false);
  }

  const getQuesBody = (question) => {
    const { questionKey, type, additionalInfo} = question;
    switch (type) {
      case 'RADIO': {
        const options = additionalInfo.options;
        const {reference, refQuestionKey} = additionalInfo;
        let refAnswer;
        let formatRefOptionKeySet;
        if (reference) {
          refAnswer = surveyAnswer.get(refQuestionKey);
          if (!refAnswer || refAnswer?.value.length === 0) {
            const refQues = quesMap.get(refQuestionKey);
            return (
              <div>{`此题目来源于第${refQues.serial}题，请先填写第${refQues.serial}题`}</div>
            );
          }
          formatRefOptionKeySet = Set(refAnswer.value.map(optionKey => formatOptionKey(optionKey, refQuestionKey)));
        }
        return (
          <div className={styles['radio-content']}>
            <Radio.Group
              direction='vertical'
              value={surveyAnswer.get(questionKey)?.value}
              onChange={(value) => {
                if (isBrowse) {
                  return;
                }
                const oldAnswer = surveyAnswer.get(questionKey);
                const [rQuesMap, rAnswerMap] = checkLogic(question, quesMap, surveyAnswer.set(questionKey, {...oldAnswer, value}));
                if (value && errorInfoMap.get(questionKey)) {
                  setErrorInfoMap(errorInfoMap.delete(questionKey));
                }
                setQuesMap(rQuesMap);
                setSurveyAnswer(rAnswerMap);
              }}
            >
              {
                options
                  .filter(option => {
                    if (!reference) {
                      return true;
                    }
                    if (option.id.indexOf('#') === -1) {
                      return true;
                    }
                    return formatRefOptionKeySet.has(formatOptionKey(option.id));
                  })
                  .map(option => {
                    const optionHtml = convertToHTML(convertFromRaw(option.label));
                    return (
                      <div key={option.id}>
                        <Radio value={option.id}>
                          <div className={styles['option-content']} dangerouslySetInnerHTML={{__html: optionHtml}}/>
                        </Radio>
                        {
                          option.otherOption && !option.id.startsWith("ref_") && surveyAnswer.get(questionKey)?.value === option.id
                          && (
                            <div className={styles['other-textarea']}>
                              <Input.TextArea
                                value={surveyAnswer.get(questionKey)?.otherText}
                                onChange={value => {
                                  if (value && errorInfoMap.get(questionKey)) {
                                    setErrorInfoMap(errorInfoMap.delete(questionKey));
                                  }
                                  setSurveyAnswer(surveyAnswer.set(questionKey, {...surveyAnswer.get(questionKey), otherText: value}));
                                }}
                                placeholder="其它 ..."
                                className={styles['textarea-input']}
                                autoSize
                              />
                            </div>
                          )
                        }
                      </div>
                    )
                  })
              }
            </Radio.Group>
          </div>
        );
      }
      case 'CHECKBOX': {
        const options = additionalInfo.options;
        const {reference, refQuestionKey} = additionalInfo;
        let refAnswer;
        let formatRefOptionKeySet;
        if (reference) {
          refAnswer = surveyAnswer.get(refQuestionKey);
          if (!refAnswer || refAnswer?.value.length === 0) {
            const refQues = quesMap.get(refQuestionKey);
            return (
              <div>{`此题目选项来源于第${refQues.serial}题，请先填写第${refQues.serial}题`}</div>
            );
          }
          formatRefOptionKeySet = Set(refAnswer.value.map(optionKey => formatOptionKey(optionKey, refQuestionKey)));
        }
        return (
          <div className={styles['checkbox-content']}>
            <Checkbox.Group
              direction="vertical"
              value={surveyAnswer.get(questionKey)?.value}
              onChange={(value) => {
                if (isBrowse) {
                  return;
                }
                const oldAnswer = surveyAnswer.get(questionKey);
                const [rQuesMap, rAnswerMap] = checkLogic(question, quesMap, surveyAnswer.set(questionKey, {...oldAnswer, value}));
                if (value.length > 0 && errorInfoMap.get(questionKey)) {
                  setErrorInfoMap(errorInfoMap.delete(questionKey));
                }
                setQuesMap(rQuesMap);
                setSurveyAnswer(rAnswerMap);
              }}
            >
              {
                options
                  .filter(option => {
                    if (!reference) {
                      return true;
                    }
                    if (option.id.indexOf('#') === -1) {
                      return true;
                    }
                    return formatRefOptionKeySet.has(formatOptionKey(option.id));
                  })
                  .map(option => {
                    const answerValue = surveyAnswer.get(questionKey)?.value;
                    const optionHtml = convertToHTML(convertFromRaw(option.label));
                    let disabled = false;
                    let maxlength = question.additionalInfo.maxLength;
                    if (
                      maxlength
                      && answerValue
                      && answerValue.length >= maxlength
                      && answerValue.indexOf(option.id) === -1
                    ) {
                      disabled = true;
                    }
                    return (
                      <div key={option.id}>
                        <Checkbox value={option.id} disabled={disabled}>
                          <div className={styles['option-content']} dangerouslySetInnerHTML={{__html: optionHtml}}/>
                        </Checkbox>
                        {
                          option.otherOption
                          && !option.id.startsWith("ref_")
                          && answerValue
                          && answerValue.indexOf(option.id) !== -1
                          && (
                            <div className={styles['other-textarea']}>
                              <Input.TextArea
                                value={surveyAnswer.get(questionKey)?.otherText}
                                onChange={value => {
                                  if (value.length > 0 && errorInfoMap.get(questionKey)) {
                                    setErrorInfoMap(errorInfoMap.delete(questionKey));
                                  }
                                  setSurveyAnswer(surveyAnswer.set(questionKey, {...surveyAnswer.get(questionKey), otherText: value}));
                                }}
                                placeholder="其它 ..."
                                className={styles['textarea-input']}
                                autoSize
                              />
                            </div>
                          )
                        }
                      </div>
                    );
                  })
              }
            </Checkbox.Group>
          </div>
        );
      }
      case 'INPUT': {
        return (
          <Input
            size="large"
            placeholder="请输入 ..."
            value={surveyAnswer.get(questionKey)}
            onChange={(value) => {
              if (isBrowse) {
                return;
              }
              if (value && errorInfoMap.get(questionKey)) {
                setErrorInfoMap(errorInfoMap.delete(questionKey));
              }
              setSurveyAnswer(surveyAnswer.set(questionKey, value));
            }}
          />
        );
      }
      case 'TEXTAREA': {
        return (
          <Input.TextArea
            placeholder="请输入 ..."
            className={styles['textarea-input']}
            autoSize
            value={surveyAnswer.get(questionKey)}
            onChange={(value) => {
              if (isBrowse) {
                return;
              }
              if (value && errorInfoMap.get(questionKey)) {
                setErrorInfoMap(errorInfoMap.delete(questionKey));
              }
              setSurveyAnswer(surveyAnswer.set(questionKey, value));
            }}
          />
        )
      }
      case 'DESCRIPTION': {
        return null;
      }
      default: {
        return <div>其它</div>
      }
    }
  }

  const checkCurrentPageAnswer = () => {
    const currentPageQuesKeys = displayQuestions[currentPage];
    let errorInfoMap = Map();
    let isValidated = true;
    currentPageQuesKeys.forEach(quesKey => {
      const ques = quesMap.get(quesKey);
      const answer = surveyAnswer.get(quesKey);
      switch (ques.type) {
        case 'RADIO': {
          if (ques.required && !answer?.value) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, '这道题未回答');
            break;
          }
          const otherOptionIds = ques.additionalInfo.options
            .filter(option => option.otherOption)
            .map(option => option.id);
          const otherOptionId = otherOptionIds.length > 0 ? otherOptionIds[0] : null;
          if (otherOptionId && answer?.value === otherOptionId && !answer?.otherText) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, '请填写其它项');
            break;
          }
          break;
        }
        case 'CHECKBOX': {
          const value = answer?.value;
          if (ques.required && (!value || value.length === 0)) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, '这道题未回答');
            break;
          }
          if (value && value.length > 0) {
            const {minLength, maxLength} = ques.additionalInfo;
            if (minLength && value.length < minLength) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, `最少选择${minLength}个选项`);
              break
            }
            if (maxLength && value.length > maxLength) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, `最多选择${maxLength}个选项`);
              break;
            }
            const otherOptionIds = ques.additionalInfo.options
              .filter(option => option.otherOption)
              .map(option => option.id);
            const otherOptionId = otherOptionIds.length > 0 ? otherOptionIds[0] : null;
            if (otherOptionId && value && value.indexOf(otherOptionId) !== -1 && !answer?.otherText) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请填写其它项');
              break;
            }
          }
          break;
        }
        case 'INPUT': {
          if (ques.required && !answer) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, '这道题未回答');
            break;
          }
          const {type, maxLength} = ques.additionalInfo;
          if (answer) {
            if (type === 'NUMBER' && !isNumber(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入数字');
              break;
            } else if (type === 'EMAIL' && !isEmail(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入邮箱');
              break;
            } else if (type === 'CHINESE' && !isChinese(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入中文');
              break;
            } else if (type === 'ENGLISH' && !isEnglish(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入英文');
              break;
            } else if (type === 'URL' && !isUrl(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入网址');
              break;
            } else if (type === 'ID_CARD' && !isIdCard(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入身份证号');
              break;
            } else if (type === 'PHONE' && !isPhone(answer)) {
              isValidated = false;
              errorInfoMap = errorInfoMap.set(quesKey, '请输入手机号');
              break;
            }
            if (maxLength) {
              if (answer.length > maxLength) {
                isValidated = false;
                errorInfoMap = errorInfoMap.set(quesKey, `最多不能超过${maxLength}个字符`);
                break;
              }
            }
          }
          break;
        }
        case 'TEXTAREA': {
          if (ques.required && !answer) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, '这道题未回答');
          }
          const {minLength, maxLength} = ques.additionalInfo;
          if (answer && minLength && answer.length < minLength) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, `最少不能低于${minLength}个字符`);
            break;
          }
          if (answer && maxLength && answer.length > maxLength) {
            isValidated = false;
            errorInfoMap = errorInfoMap.set(quesKey, `最多不能超过${maxLength}个字符`);
            break;
          }
          break;
        }
        case 'DESCRIPTION' : {
          break;
        }
        default: {
          console.error('不存在的问题类型: ' + ques.type);
        }
      }
    });
    setErrorInfoMap(errorInfoMap);
    return isValidated;
  }

  const onSubmit = () => {
    setSubmitBtnLoading(true);
    if(!checkCurrentPageAnswer()) {
      setSubmitBtnLoading(false);
      return;
    }
    if (type !== 'answer') {
      setSubmitBtnLoading(false);
      return;
    }
    request.post('/survey/answer', {
      surveyId: searchParams.get('id'),
      answer: surveyAnswer.toJS(),
      startedAt: dayjs(startedDate).format('YYYY-MM-DD HH:mm:ss')
    })
      .then(() => {
        setSubmitBtnLoading(false);
        setSurveyStatus('SUBMIT_SUCCESS');
        localStorage.removeItem(`break_point_resume#${surveyId}`);
        if (settings.saveLastAnswer) {
          const answerJson = JSON.stringify(surveyAnswer.toJS());
          if (answerJson !== '{}') {
            localStorage.setItem(`last_answer#${surveyId}`, answerJson);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setSubmitBtnLoading(false);
        setSurveyStatus('SERVER_ERROR');
      })
  }

  const renderAnswerInfo = () => {
    if (!isBrowse || !answerInfo) {
      return;
    }
    const {
      answererId,
      nickName,
      phone,
      anonymously,
      startedAt,
      endedAt,
      avatar,
    } = answerInfo;
    let showNickName;
    let showPhone;
    let showAvatar;
    if (answererId === null) {
      showNickName = '未要求填答者登录答题';
      showPhone = '-';
      showAvatar = null;
    } else if (anonymously) {
      showNickName = '匿名用户'
      showPhone = '-';
      showAvatar = null;
    } else {
      showNickName = nickName;
      showPhone = phone ? phone : '-';
      showAvatar = avatar ? avatar : null;
    }
    return (
      <div className={styles['answer-info-container']}>
        <div className={styles['answer-info-content']}>
          <div className={styles['icon-container']}>
            <Avatar size={48} style={{backgroundColor: 'rgb(51, 112, 255)'}}>
              {avatar ? (<img alt="avatar" src={showAvatar}/>) : <IconUser />}
            </Avatar>
          </div>
          <div className={styles['text-info-content']}>
            <div className={styles['nickname']}>{showNickName}</div>
            <div className={styles['info-detail']}>
              <Typography.Text>手机号码: {showPhone}</Typography.Text>
              <Divider type='vertical' />
              <Typography.Text>填答时间: {`${startedAt} 至 ${endedAt}`}</Typography.Text>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderPreviousPageBtn = () => {
    if (type === 'answer' && !settings?.allowRollback) {
      return null;
    }
    if (currentPage > 0 && currentPage < displayQuestions.length) {
      return (
        <Button
          className={
            classNames(
              styles['page-up-btn'],
              isBrowse && currentPage === displayQuestions.length - 1 && styles['last-page-up']
            )
          }
          type='outline'
          onClick={() => setCurrentPage(currentPage - 1)}
          icon={<IconLeft />}
        >
          {isBrowse && currentPage === displayQuestions.length - 1 ? '返回上一页' : ''}
        </Button>
      );
    }
    return null;
  }

  const surveyContent = (
    <Scrollbar
      style={{height: "100%", width: "100%"}}
      native={isNativeScrollBar}
      disableTrackYWidthCompensation
      trackYProps={{
        renderer: (props) => {
          const { elementRef, ...restProps } = props;
          return <span {...restProps} ref={elementRef} className={styles['scroll-bar-track']} />;
        },
      }}
      thumbYProps={{
        renderer: (props) => {
          const { elementRef, ...restProps } = props;
          return <div {...restProps} ref={elementRef} className={styles['scroll-bar-thumb']} />;
        },
      }}
    >
      {
        type === 'preview'
        && (
          <Alert
            className={styles['preview-alert']}
            content="提示：当前为预览页面，答案不被记录"
            closable
          />
        )
      }
      <div className={styles['survey-form-container']}>
        {renderAnswerInfo()}
        <div className={styles['survey-main']}>
          {
            currentPage === 0
            && (
              <>
                <h1 className={styles['survey-title']}>{survey && survey.title}</h1>
                {survey && (<div className={styles['survey-instruction']} dangerouslySetInnerHTML={{__html: convertToHTML(convertFromRaw(survey.instruction))}}/>)}
              </>
            )
          }
          {
            displayQuestions.length > 0 &&
            displayQuestions[currentPage].map(quesKey => {
              const question = quesMap.get(quesKey);
              const {serial, title, description, type} = question;
              let questionTitleHtml = convertToHTML({blockToHTML})(convertFromRaw(title));
              let serialText;
              if (serial && serial > 0) {
                serialText = serial < 10 ? `0${serial.toString()}` : serial.toString();
              }
              let questionDescHtml;
              if (description) {
                const contentState = convertFromRaw(description);
                if (contentState.hasText()) {
                  questionDescHtml = convertToHTML({blockToHTML})(contentState);
                }
              }
              return (
                <div className={styles['survey-question']} key={quesKey}>
                  {
                    type !== 'DESCRIPTION' ? (
                      <div className={styles['ques-title']}>
                        {question.required && <span className={styles['question-required']}>*</span>}
                        {
                          settings.displayQuestionNo
                          && serial
                          && serial > 0
                          && (<span className={styles['ques-serial']}><span>{serialText}</span></span>)
                        }
                        <div className={styles['ques-title-text']} dangerouslySetInnerHTML={{__html: questionTitleHtml}}/>
                        {
                          errorInfoMap.get(quesKey)
                          && (
                            <span className={classNames(styles['ques-error-tag'], 'animate__animated', 'animate__headShake')}>
                            {errorInfoMap.get(quesKey)}
                          </span>
                          )
                        }
                      </div>
                    ) : (<div className={styles['ques-description']} dangerouslySetInnerHTML={{__html: questionTitleHtml}}/>)
                  }
                  {
                    questionDescHtml
                    && <div className={styles['ques-desc']} dangerouslySetInnerHTML={{__html: questionDescHtml}}/>}
                  <div className={styles['ques-body']}>
                    {getQuesBody(question)}
                  </div>
                </div>
              );
            })
          }
          <div className={styles['survey-bottom']}>
            <div className={styles['bottom-group']}>
              {renderPreviousPageBtn()}
              {
                currentPage < displayQuestions.length - 1
                && (
                  <Button
                    className={styles['survey-bottom-btn']}
                    type='primary'
                    onClick={() => {
                      if (isBrowse) {
                        setCurrentPage(currentPage + 1);
                      } else if (checkCurrentPageAnswer()) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                  >
                    下一页
                  </Button>
                )
              }
              {
                currentPage === displayQuestions.length - 1
                && !isBrowse
                && <Button
                  className={styles['survey-bottom-btn']}
                  type='primary'
                  onClick={() => onSubmit()}
                  loading={submitBtnLoading}
                >提交</Button>
              }
            </div>
          </div>
        </div>
      </div>
    </Scrollbar>
  );

  const statusToMessageMap = {
    NOT_OPEN: '问卷已暂停提交',
    ALREADY_ANSWERED: '您已经回答过此问卷',
    NOT_STATED: '问卷未到开始日期',
    FINISHED: '问卷已过截止日期',
    EXCEED_LIMIT: '问卷提交数量已达到上限',
    SERVER_ERROR: '服务器异常',
    SUBMIT_SUCCESS: '问卷提交成功',
    ALREADY_ANSWERED_BUT_CAD_MODIFY: '您已经回答过此问卷',
    EXCEED_LIMIT_BUT_CAN_MODIFY: '您已经回答过此问卷',
    BREAK_POINT: '是否继续上次填写？',
    LOAD_LAST_ANSWER: '是否要加载上一次提交的回答？'
  }

  const renderNoticeBtn = () => {
    if (surveyStatus === 'ALREADY_ANSWERED_BUT_CAD_MODIFY' || surveyStatus === 'EXCEED_LIMIT_BUT_CAN_MODIFY') {
      return (
        <div className={styles['operator-btn-container']}>
          <Button
            style={{margin: '0 auto'}}
            className={styles['operator-btn']}
            type="primary"
            onClick={() => modifyLastQuestion()}
            loading={operatorBtnLoading}
          >
            修改上次提交信息
          </Button>
        </div>
      );
    } else if (surveyStatus === 'BREAK_POINT') {
      return (
        <div className={styles['operator-btn-container']}>
          <Button
            className={styles['operator-btn']}
            onClick={() => breakpointLoad()}
            loading={operatorBtnLoading}
            type="primary"
          >
            继续填写
          </Button>
          <Button
            className={classNames(styles['operator-btn'], styles['normal-btn'])}
            onClick={() => {
              setSurveyStatus('NORMAL');
              localStorage.removeItem(`break_point_resume#${surveyId}`);
            }}
          >
            重新填写
          </Button>
        </div>
      );
    } else if (surveyStatus === 'LOAD_LAST_ANSWER') {
      return (
        <div className={styles['operator-btn-container']}>
          <Button
            className={styles['operator-btn']}
            onClick={() => loadLastAnswer()}
            loading={operatorBtnLoading}
            type="primary"
          >
            加载上次回答
          </Button>
          <Button
            className={classNames(styles['operator-btn'], styles['normal-btn'])}
            onClick={() => {
              localStorage.removeItem(`last_answer#${surveyId}`);
              setSurveyStatus('NORMAL');
            }}
          >
            重新填写
          </Button>
        </div>
      );
    }
  }

  const noticeContent = (
    <div className={styles['notice-page-wrapper']}>
      <div className={styles['notice-page-content']}>
        <div className={styles['notice-icon']}>
          {
            surveyStatus === 'SUBMIT_SUCCESS' ? <IconSuccessFill className={styles['success-icon']} /> : <IconWarningFill />
          }
        </div>
        <div className={styles['notice-tip-text']}>{statusToMessageMap[surveyStatus]}</div>
      </div>
      {renderNoticeBtn()}
    </div>
  );
  const renderPage = () => {
    if (loading) {
      return;
    }
    if (surveyStatus === 'NORMAL') {
      return surveyContent;
    }
    return noticeContent;
  }

  return (
    <div
      className={classNames(
        styles['survey-form-page'],
        className,
        mobile ? styles['mobile'] : styles['desktop']
      )}
      style={style}
    >
      {renderPage()}
    </div>
  );
}

export default SurveyForm;