import styles from './style/index.module.less'
import {
  Table,
  Grid,
  Input,
  Form,
  DatePicker,
  Space,
  Button,
  Link,
  Modal,
  Select,
  Tag,
  Message, Popconfirm, Skeleton
} from "@arco-design/web-react";
import { IconDelete, IconExport, IconEye, IconReply, IconSearch } from "@arco-design/web-react/icon";
import { IconSeparateWindow } from "@arco-iconbox/react-cz-icon";
import { useCallback, useEffect, useState } from "react";
import request from "@/utils/request";
import { useSearchParams } from "react-router-dom";
import { convertFromRaw } from "draft-js";
import { isChoiceQuestion, isInputModeQuestionType } from "@/pages/editor/form-design/question-service";
import { Map } from 'immutable'
import { formatSecondTime } from "@/utils/time";
import SurveyForm from "@/pages/editor/form-design/surveyForm";

const { RangePicker } = DatePicker;

const initColumns = [
  {
    title: 'ip地址',
    dataIndex: 'ip',
    width: 200
  },
  {
    title: 'IP地理位置',
    dataIndex: 'location',
    width: 260,
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    ellipsis: true,
    width: 300
  },
  {
    title: '平台',
    dataIndex: 'platform',
    width: 180
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    width: 180
  },
  {
    title: '答题时长',
    dataIndex: 'duration',
    width: 180
  },
  {
    title: '开始答题时间',
    dataIndex: 'startedAt',
    width: 200
  },
  {
    title: '答题结束时间',
    dataIndex: 'endedAt',
    width: 200
  },

];

function DataDetails() {
  const [searchParams] = useSearchParams();
  const [pageLoading, setPageLoading] = useState(true);
  const [data, setData] = useState([]);
  const [survey, setSurvey] = useState(null);
  const [terseStat, setTerseStat] = useState(null);
  const [terseStatLoading, setTerseStatLoading] = useState(false);
  const [columns, setColumns] = useState(initColumns);
  const [questionMap, setQuestionMap] = useState(Map());
  const [tableScrollX, setTableScrollX] = useState(2100);
  const [optionTextMap, setOptionTextMap] = useState(Map());
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showTotal: true,
    sizeCanChange: true,
  });
  const [queryParam, setQueryParam] = useState({});
  const [tempQueryParam, setTempQueryParam] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [quesViewModalVisible, setQuesViewModalVisible] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const surveyId = searchParams.get('id');

  useEffect(() => {
    setTerseStatLoading(true);
    request
      .get(`/survey/${surveyId}/terseStat`)
      .then(res => {
        setTerseStat(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setTerseStatLoading(false));
  }, [surveyId]);

  const mapAnswerToText = (quesKey, answer) => {
    let question = questionMap.get(quesKey);
    if (!question || !answer) {
      return;
    }
    const {type} = question;
    switch (type) {
      case 'RADIO': {
        const {value} = answer;
        if (value.indexOf('#') !== -1) {
          const valueArr = value.split('#');
          return optionTextMap.get(`${valueArr[0]}#${valueArr[1]}`);
        }
        return optionTextMap.get(`${value}#${quesKey}`)
      }
      case 'CHECKBOX': {
        const {value} = answer;
        let optionTexts = [];
        value.forEach(optionId => {
          let item;
          if (optionId.indexOf('#') !== -1) {
            const valueArr = optionId.split('#');
            item = optionTextMap.get(`${valueArr[0]}#${valueArr[1]}`);
          } else {
            item = optionTextMap.get(`${optionId}#${quesKey}`);
          }
          if (item) {
            optionTexts = [...optionTexts, item];
          }
        })
        return optionTexts.join(',');
      }
      case 'TEXTAREA':
      case 'INPUT': {
        return answer;
      }
      default: {
        console.error(`暂不支持${type}类型`);
        return ;
      }
    }
  };

  const fetchSurveyAnswers = () => {
    if (questionMap.size === 0) {
      return;
    }
    setTableLoading(true);
    const {current, pageSize} = pagination;
    request.get('/survey/answer/page', {
      params: {
        surveyId,
        page: current - 1,
        size: pageSize,
        ...queryParam,
        startTime: queryParam?.timeRange ? queryParam.timeRange[0] : null,
        endTime: queryParam?.timeRange ? queryParam.timeRange[1] : null
      }
    })
      .then(res => {
        const total = res.headers['x-total-count'];
        let dataArr = [];
        res.data.forEach(item => {
          let {surveyAnswer, answerer: dataItem} = item;
          let answer = surveyAnswer.answer;
          let answerTextMap = {};
          Object.keys(answer).forEach(key => {
            answerTextMap = {...answerTextMap, [key]: mapAnswerToText(key, answer[key])};
          });
          let location;
          const ipProvince = surveyAnswer.ipProvince;
          const ipCity = surveyAnswer.ipCity;
          if (ipProvince === 'Unknown') {
            location = '-';
          } else if (ipProvince === ipCity) {
            location = ipProvince;
          } else {
            location = `${ipProvince}-${ipCity}`;
          }
          dataItem = {
            ...dataItem,
            ...surveyAnswer,
            ...answerTextMap,
            duration: formatSecondTime(parseInt(surveyAnswer.duration)),
            location
          };
          dataArr = [...dataArr, dataItem];
        });
        setTableLoading(false);
        setPagination({...pagination, total});
        setData(dataArr);
      })
      .catch(err => console.error(err))
  };

  const onChangeTable = (pagination) => {
    setPagination(pagination);
  }

  const changeAnswerValid = (answerId, valid) => {
    request
      .put('/survey/answer/valid', {answerId, valid})
      .then(() => fetchSurveyAnswers())
      .catch(() => Message.error('操作失败'))
  }

  const deleteAnswer = (answerId) => {
    request
      .delete(`/survey/answer/${answerId}`)
      .then(() => fetchSurveyAnswers())
      .catch(() => Message.error('操作失败'))
  }

  const batchChangeAnswerValid = () => {
    if (selectedRowKeys.length === 0) {
      Message.info('请至少选中一条数据');
      return;
    }
    Modal.confirm({
      title: '批量设置回答标记',
      content: '确认将所选中的回答标记为无效吗？',
      okButtonProps: {status: 'warning'},
      onOk: () => {
        return request
          .put('/survey/answer/batch/valid', {ids: selectedRowKeys, valid: false})
          .then(() => {
            fetchSurveyAnswers();
            setSelectedRowKeys([]);
            Message.info('标记成功');
          })
          .catch(() => Message.error("操作失败"));
      },
    });
  }

  const batchDelete = () => {
    if (selectedRowKeys.length === 0) {
      Message.info('请至少选中一条数据');
      return;
    }
    Modal.confirm({
      title: '批量删除回答',
      content: '确认删除所选中的回答吗？',
      okButtonProps: {status: 'danger'},
      onOk: () => {
        return request
          .delete('/survey/answer', {data: {ids: selectedRowKeys}})
          .then(() => {
            fetchSurveyAnswers();
            setSelectedRowKeys([]);
            Message.info('删除成功');
          })
          .catch(() => Message.error("操作失败"));
      },
    });
  }

  const renderOperator = (col, record) => {
    return (
      <Space>
        <Link icon={<IconEye/>} onClick={() => {
          setCurrentAnswer(record);
          setQuesViewModalVisible(true);
        }}>
          查看
        </Link>
        <Popconfirm
          className={styles['operator-pop']}
          focusLock
          position="bottom"
          title={`是否将该回答标记为${record.valid ? '无效' : '有效'}？`}
          okText='确认'
          cancelText='取消'
          onOk={() => changeAnswerValid(record.id, !record.valid)}
        >
          <Link icon={<IconSeparateWindow/>} style={{color: record.valid ? '#86909c' : '#00b42a'}}>
            标记{record.valid ? '无效' : '有效'}
          </Link>
        </Popconfirm>
        <Popconfirm
          className={styles['operator-pop']}
          focusLock
          position="bottom"
          title="是否删除该回答"
          okText='确认'
          cancelText='取消'
          onOk={() => deleteAnswer(record.id)}
        >
          <Link icon={<IconDelete />} status="error">删除</Link>
        </Popconfirm>
      </Space>
    );
  }

  const getSurveyDetail = useCallback(() => {
    request
      .get('/survey/detail', {params: {surveyId}})
      .then(res => {
        const {pages} = res.data;
        let quesMap = Map();
        let optionTextMap = Map();
        let scrollX = tableScrollX;
        const columns = pages.flatMap(page => {
          return page.questions
            .filter(ques => isInputModeQuestionType(ques.type))
            .map(ques => {
              const {title, questionKey, type, additionalInfo} = ques;
              quesMap = quesMap.set(questionKey, ques);
              if (isChoiceQuestion(type)) {
                const {options} = additionalInfo;
                options.forEach(option =>
                  optionTextMap = optionTextMap.set(`${option.id}#${questionKey}`, convertFromRaw(option.label).getPlainText()));
              }
              scrollX += 300;
              return {dataIndex: questionKey, title: convertFromRaw(title).getPlainText(), ellipsis: true};
            })
        })
        const renderValid = (data) => data ? <Tag color="#00b42a">有效回答</Tag> : <Tag color="#86909c">无效回答</Tag>
        const renderNickName = (data, record) => record.answererId ? data : <span style={{color: "#86909c"}}>未要求登录</span>;
        setSurvey(res.data);
        setOptionTextMap(optionTextMap);
        setQuestionMap(quesMap);
        setColumns([
          {title: '是否有效', dataIndex: 'valid', width: 120, fixed: 'left', render: renderValid},
          {title:  '昵称', dataIndex: 'nickName', width: 130, fixed: 'left', ellipsis: true, render: renderNickName},
          ...columns,
          ...initColumns
        ]);
        setTableScrollX(scrollX);
        setPageLoading(false);
      })
      .catch(err => console.log(err))
    // eslint-disable-next-line
  }, [surveyId]);

  useEffect(() => {
    getSurveyDetail();
  }, [getSurveyDetail]);

  useEffect(() => {
    fetchSurveyAnswers();
    // eslint-disable-next-line
  }, [questionMap, surveyId, pagination.current, pagination.pageSize, queryParam]);

  useEffect(() => {
    setColumns([...columns, { title: '操作', dataIndex: 'operator', fixed: 'right', width: 250, render: renderOperator }]);
    // eslint-disable-next-line
  }, [questionMap]);

  const getColumns = () => {
    const operator = { title: '操作', dataIndex: 'operator', fixed: 'right', width: 250, render: renderOperator };
    const lastColumn = columns[columns.length - 1];
    if (lastColumn.dataIndex === 'operator') {
      return [...columns.slice(0, columns.length - 1), operator];
    } else {
      return [...columns, operator];
    }
  }

  if (pageLoading) {
    return ;
  }

  return (
    <div className={styles['data-details-page']}>
      <div className={styles['stat-summary']}>
        <Grid.Row gutter={24} justify='space-around'>
          <Grid.Col span={4}>
            <div style={{textAlign: 'center'}}>
              <Skeleton
                text={{rows: 1, width: '100%'}}
                animation
                loading={terseStatLoading}
              >
                今日新增: {terseStat?.todayCount}
              </Skeleton>
            </div>
          </Grid.Col>
          <Grid.Col span={4}>
            <div style={{textAlign: 'center'}}>
              <Skeleton
                text={{rows: 1, width: '100%'}}
                animation
                loading={terseStatLoading}
              >
                回收总量: {terseStat?.totalCount}
              </Skeleton>
            </div>
          </Grid.Col>
          <Grid.Col span={4}>
            <div style={{textAlign: 'center'}}>
              <Skeleton
                text={{rows: 1, width: '100%'}}
                animation
                loading={terseStatLoading}
              >
                平均答题时长: {formatSecondTime(terseStat?.avgDuration)}
              </Skeleton>
            </div>
          </Grid.Col>
        </Grid.Row>
      </div>
      <div className={styles['data-details-container']}>
        <div className={styles['details-header']}>
          <Form id='searchForm' layout='vertical'>
            <Grid.Row gutter={24} align="end">
              <Grid.Col span={6}>
                <Form.Item label='提交时间' field='timeRange'>
                  <RangePicker
                    allowClear
                    mode="date"
                    showTime
                    size="large"
                    format='YYYY-MM-DD HH:mm:ss'
                    value={queryParam.timeRange}
                    onClear={() => {setQueryParam({...queryParam, timeRange: null})}}
                    onChange={value => setTempQueryParam({...tempQueryParam, timeRange: value})}
                    onOk={value => {
                      setTempQueryParam({...tempQueryParam, timeRange: value});
                      setQueryParam({...queryParam, timeRange: value});
                    }}
                  />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={4}>
                <Form.Item label='用户昵称' field='nickname'>
                  <Input
                    size="large"
                    placeholder='请输入昵称'
                    allowClear
                    addAfter={<IconSearch className={styles['search-btn']} onClick={() => {setQueryParam(tempQueryParam)}}/>}
                    onChange={value => setTempQueryParam({...tempQueryParam, nickName: value})}
                    onClear={() => setQueryParam({...queryParam, nickName: null})}
                  />
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={3}>
                <Form.Item label='是否有效' field='valid'>
                  <Select
                    placeholder="是否有效"
                    allowClear
                    onChange={value => setQueryParam({...queryParam, valid: value === 'validated'})}
                    onClear={() => setQueryParam({...queryParam, valid: null})}
                  >
                    <Select.Option value="validated">有效回答</Select.Option>
                    <Select.Option value="invalid">无效回答</Select.Option>
                  </Select>
                </Form.Item>
              </Grid.Col>
              <Grid.Col span={11}>
                <Grid.Row justify="end" className={styles['operate-btn-group']}>
                  <Space>
                    <Button type='primary' icon={<IconExport />} onClick>题目筛选</Button>
                    <Button type='primary' status='success' icon={<IconExport />} onClick>导出</Button>
                    <Button type='primary' status='warning' icon={<IconSeparateWindow />} onClick={() => batchChangeAnswerValid()}>标记无效</Button>
                    <Button type='primary' status='danger' icon={<IconDelete />} onClick={() => batchDelete()}>删除</Button>
                  </Space>
                </Grid.Row>
              </Grid.Col>
            </Grid.Row>
          </Form>
        </div>
        <div className={styles['details-content']}>
          <Table
            loading={tableLoading}
            columns={getColumns()}
            data={data}
            rowKey="id"
            scroll={{x: tableScrollX}}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
            }}
            pagination={pagination}
            onChange={onChangeTable}
          />
        </div>
      </div>
      <Modal
        simple
        title='Modal Title'
        visible={quesViewModalVisible}
        autoFocus={false}
        focusLock={true}
        className={styles['browse-survey-modal']}
      >
        <div className={styles['exit-btn']}>
          <Button icon={<IconReply />} type="primary" status="danger" onClick={() => setQuesViewModalVisible(false)}/>
        </div>
        <SurveyForm
          surveyData={survey}
          type="browse"
          answerData={currentAnswer?.answer}
          answerInfo={currentAnswer}
        />
      </Modal>
    </div>
  );
}

export default DataDetails;