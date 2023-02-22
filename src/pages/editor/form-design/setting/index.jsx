import styles from "./style/index.module.less"
import {
  Checkbox,
  DatePicker,
  Divider,
  InputNumber,
  Message,
  Select,
  Spin,
  Switch,
  Tooltip
} from "@arco-design/web-react";
import { IconClockCircle, IconRight, IconRobotAdd, IconUndo } from "@arco-design/web-react/icon";
import classNames from "classnames";
import {
  IconAlignBottom,
  IconAuth, IconCancelOnborading, IconContact, IconFlipVertical,
  IconIdentity,
  IconLoadBalancing, IconReminders, IconSaveFile, IconUpdate,
  IconUserResearch
} from "@arco-iconbox/react-cz-icon";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import request from "@/utils/request";
import { dayjs } from "@arco-design/web-react/es/_util/dayjs";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";


const range = (start, end) => {
  const result = [];
  for (let i = start; i < end; ++i) {
    result.push(i);
  }
  return result;
}

const EACH_HOUR = range(0, 24);
const EACH_MINUTE = range(0, 60);

function SettingContainer({title, children}) {
  return (
    <div className={styles['setting-container']}>
      <h3 className={styles['setting-title']}>{title}</h3>
      <ul className={styles['setting-block']}>
        {children}
      </ul>
    </div>
  );
}

function SettingItem({icon, label, operateNode, children}) {
  return (
    <li className={styles['setting-item']}>
      <div className={styles['item-main']}>
        <div className={styles['item-desc']}>
          {icon}
          <span>{label}</span>
        </div>
        <div>
          {operateNode}
        </div>
      </div>
      {
        children
        && (
          <div>
            <Divider style={{margin: 0}} />
            <div  className={styles['item-children']}>
              {children}
            </div>
          </div>
        )
      }
    </li>
  );
}

function Setting() {

  const [setting, setSetting] = useState({});
  const [timeSetting, setTimeSetting] = useState({});
  const [checkedMaxAnswers, setCheckedMaxAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {setSurveySettings} = useContext(FdContext);

  useEffect(() => {
    const surveyId = searchParams.get('id');
    if (surveyId === null) {
      navigate('/error/404');
    }
    setLoading(true);
    request
      .get(`/survey/setting/${surveyId}`)
      .then(res => {
        const remoteSetting = res.data;
        setSetting(remoteSetting);
        setTimeSetting({
          showTimeSetting: remoteSetting.beginTime !== null || remoteSetting.endTime !== null,
          checkedBeginTime: remoteSetting.beginTime !== null,
          checkedEndTime: remoteSetting.endTime !== null
        });
        setCheckedMaxAnswers(remoteSetting.maxAnswers > 0);
        setTimeout(() => setLoading(false), 300);
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        navigate('/error/500');
      })
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setSurveySettings(setting);
    // eslint-disable-next-line
  }, [setting]);

  const remoteSetSetting = (params) => {
    return request.put('/survey/setting', {...params, surveyId: searchParams.get('id')});
  };

  return (
    <div>
      {
        loading ? (
          <div className="loading-wrapper">
            <Spin loading={true} style={{display: "block"}} size={40}/>
          </div>
        ) : (
          <div className={classNames('rewrite-arco', styles['setting-wrapper'])}>
            <div className={styles['setting-content']}>
              <SettingContainer title="问卷显示">
                <SettingItem
                  icon={<IconAlignBottom />}
                  label="问卷显示问题编号"
                  operateNode={
                    <Switch
                      size="small"
                      checked={setting.displayQuestionNo}
                      onChange={(value) => {
                        setSetting({...setting, displayQuestionNo: value});
                        remoteSetSetting({displayQuestionNo: value})
                          .catch(err => {
                            Message.error(err.response.data.message)
                            setSetting({...setting, displayQuestionNo: !value});
                          });
                      }}
                    />
                  }
                />
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconUndo />}
                  label="答题过程可以回退"
                  operateNode={
                    <Switch
                      size="small"
                      checked={setting.allowRollback}
                      onChange={(value) => {
                        setSetting({...setting, allowRollback: value});
                        remoteSetSetting({allowRollback: value})
                          .catch(err => {
                            Message.error(err.response.data.message);
                            setSetting({...setting, allowRollback: !value});
                          })
                      }}
                    />
                  }
                />
              </SettingContainer>
              <SettingContainer title="答题限制">
                <SettingItem
                  icon={<IconAuth />}
                  label="答题需要登录验证"
                  operateNode={
                    <Switch
                      size="small"
                      checked={setting.loginRequired}
                      onChange={(value) => {
                        setSetting({...setting, loginRequired: value});
                        remoteSetSetting({loginRequired: value})
                          .catch(err => {
                            Message.error(err.response.data.message);
                            setSetting({...setting, loginRequired: !value});
                          })
                      }}
                    />
                  }
                />
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconUserResearch />}
                  label="谁可以填答"
                  operateNode={
                    <Select value={setting.answererType} className={styles['operate-select']}>
                      <Select.Option value='ALL'>所有人</Select.Option>
                      <Select.Option value='DESIGNATED_CONTACTS' disabled>指定联系人</Select.Option>
                    </Select>
                  }
                />
                <Divider className={styles['m0']} />
                {
                  setting.answererType === 'DESIGNATED_CONTACTS'
                  && (
                    <>
                      <SettingItem
                        icon={<IconIdentity />}
                        label="指定用户"
                        operateNode={<IconRight />}
                      />
                      <Divider className={styles['m0']} />
                    </>
                  )
                }
                <SettingItem
                  icon={<IconLoadBalancing />}
                  label="每个用户答题次数限制"
                  operateNode={
                    <>
                      <Tooltip
                        content="开启答题次数限制需要先开启登录验证"
                        position='bottom'
                        disabled={setting.loginRequired}
                      >
                        <Switch
                          size="small"
                          disabled={!setting.loginRequired}
                          checked={setting.enableUserAnswerLimit}
                          onChange={(value) => {
                            if (value) {
                              setSetting({...setting, enableUserAnswerLimit: value, userLimitFreq: 'ONLY', userLimitNum: 1});
                              remoteSetSetting({enableUserAnswerLimit: value, userLimitFreq: 'ONLY', userLimitNum: 1})
                                .catch(err => {
                                  Message.error(err.response.data.message);
                                  setSetting({...setting, enableUserAnswerLimit: !value});
                                });
                            } else {
                              setSetting({...setting, enableUserAnswerLimit: value});
                              remoteSetSetting({enableUserAnswerLimit: value})
                                .catch(err => {
                                  Message.error(err.response.data.message);
                                  setSetting({...setting, enableUserAnswerLimit: !value});
                                });
                            }
                          }}
                        />
                      </Tooltip>
                    </>
                  }
                >
                  {
                    setting.enableUserAnswerLimit
                    && (
                      <div className={styles['single-row-sub-item']}>
                        <div style={{display: 'inline-block'}}>
                          <Select
                            className={styles['sw']}
                            size="small"
                            value={setting.userLimitFreq}
                            onChange={value => {
                              setSetting({...setting, userLimitFreq: value});
                              remoteSetSetting({userLimitFreq: value})
                                .catch(err => Message.error(err.response.data.message));
                            }}
                          >
                            <Select.Option key="ONLY" value="ONLY">只能</Select.Option>
                            <Select.Option key="HOUR" value="HOUR">每小时</Select.Option>
                            <Select.Option key="DAY" value="DAY">每天</Select.Option>
                            <Select.Option key="WEEK" value="WEEK">每自然周</Select.Option>
                            <Select.Option key="WITHIN_7_DAYS" value="WITHIN_7_DAYS">每7天内</Select.Option>
                            <Select.Option key="MONTH" value="MONTH">每自然月</Select.Option>
                            <Select.Option key="WITHIN_30_DAYS" value="WITHIN_30_DAYS">每30天内</Select.Option>
                          </Select>
                        </div>
                        <span className={styles['tm']}>答题</span>
                        <div style={{display: 'inline-block'}}>
                          <InputNumber
                            size="small"
                            placeholder='1'
                            min={1}
                            max={9999}
                            className={styles['mw']}
                            value={setting.userLimitNum}
                            onChange={num => {
                              const userLimitNum = num === undefined ? 1 : num;
                              setSetting({...setting, userLimitNum});
                            }}
                            onBlur={() => {
                              remoteSetSetting({userLimitNum: setting.userLimitNum})
                                .catch(err => Message.error(err.response.data.message))
                            }}
                          />
                        </div>
                        <span className={styles['tm']}>次</span>
                      </div>
                    )
                  }
                </SettingItem>
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconRobotAdd />}
                  label="每个IP答题次数限制"
                  operateNode={
                    <Switch
                      size="small"
                      checked={setting.enableIpAnswerLimit}
                      onChange={(value) => {
                        if (value) {
                          setSetting({...setting, enableIpAnswerLimit: value, ipLimitFreq: 'ONLY', ipLimitNum: 1});
                          remoteSetSetting({enableIpAnswerLimit: value, ipLimitFreq: 'ONLY', ipLimitNum: 1})
                            .catch(err => {
                              Message.error(err.response.data.message);
                              setSetting({...setting, enableIpAnswerLimit: !value});
                            })
                        } else {
                          setSetting({...setting, enableIpAnswerLimit: value});
                          remoteSetSetting({enableIpAnswerLimit: value})
                            .catch(err => {
                              Message.error(err.response.data.message);
                              setSetting({...setting, enableIpAnswerLimit: !value});
                            })
                        }
                      }}
                    />
                  }
                >
                  {
                    setting.enableIpAnswerLimit
                    && (
                      <div className={styles['single-row-sub-item']}>
                        <div style={{display: 'inline-block'}}>
                          <Select
                            className={styles['sw']}
                            size="small"
                            value={setting.ipLimitFreq}
                            onChange={value => {
                              setSetting({...setting, ipLimitFreq: value});
                              remoteSetSetting({ipLimitFreq: value})
                                .catch(err => Message.error(err.response.data.message));
                            }}
                          >
                            <Select.Option key="ONLY" value="ONLY">只能</Select.Option>
                            <Select.Option key="HOUR" value="HOUR">每小时</Select.Option>
                            <Select.Option key="DAY" value="DAY">每天</Select.Option>
                            <Select.Option key="WEEK" value="WEEK">每自然周</Select.Option>
                            <Select.Option key="WITHIN_7_DAYS" value="WITHIN_7_DAYS">每7天内</Select.Option>
                            <Select.Option key="MONTH" value="MONTH">每自然月</Select.Option>
                            <Select.Option key="WITHIN_30_DAYS" value="WITHIN_30_DAYS">每30天内</Select.Option>
                          </Select>
                        </div>
                        <span className={styles['tm']}>答题</span>
                        <div style={{display: 'inline-block'}}>
                          <InputNumber
                            size="small"
                            placeholder='1'
                            min={1}
                            max={9999}
                            className={styles['mw']}
                            value={setting.ipLimitNum}
                            onChange={num => {
                              const ipLimitNum = num === undefined ? 1 : num;
                              setSetting({...setting, ipLimitNum});
                            }}
                            onBlur={() => {
                              remoteSetSetting({ipLimitNum: setting.ipLimitNum})
                                .catch(err => Message.error(err.response.data.message));
                            }}
                          />
                        </div>
                        <span className={styles['tm']}>次</span>
                      </div>
                    )
                  }
                </SettingItem>
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconClockCircle />}
                  label="设置开始时间和结束时间"
                  operateNode={
                    <Switch
                      size="small"
                      checked={timeSetting.showTimeSetting}
                      onChange={value => {
                        if (!value) {
                          setTimeSetting({showTimeSetting: false, checkedBeginTime: false, checkedEndTime: false});
                          setSetting({...setting, beginTime: null, endTime: null});
                          remoteSetSetting({beginTime: null, endTime: null})
                            .catch(err => Message.error(err.response.data.message));
                        } else {
                          setTimeSetting({...timeSetting, showTimeSetting: value});
                        }
                      }}
                    />
                  }
                >
                  {
                    timeSetting.showTimeSetting
                    && (
                      <div style={{padding: '11px 0'}}>
                        <div className={styles['item-line']}>
                          <Checkbox
                            checked={timeSetting.checkedBeginTime}
                            onChange={value => {
                              setTimeSetting({...timeSetting, checkedBeginTime: value});
                              if (!value) {
                                setSetting({...setting, beginTime: null})
                                remoteSetSetting({beginTime: null})
                                  .catch(err => Message.error(err.response.data.message));
                              }
                            }}
                          >
                            开始时间
                          </Checkbox>
                          <DatePicker
                            style={{marginLeft: '6px'}}
                            size="small"
                            allowClear={false}
                            disabled={!timeSetting.checkedBeginTime}
                            showTime
                            showNowBtn={false}
                            format='YYYY-MM-DD HH:mm'
                            value={setting.beginTime}
                            onOk={(dateString) => {
                              if (setting.endTime) {
                                const endTime = dayjs(setting.endTime);
                                if (endTime.isBefore(dayjs())) {
                                  dateString = endTime.subtract(1, 'minute').format('YYYY-MM-DD HH:mm');
                                }
                              }
                              setSetting({...setting, beginTime: dateString});
                              remoteSetSetting({beginTime: dateString})
                                .catch(err => Message.error(err.response.data.message));
                            }}
                            onChange={(v) => setSetting({...setting, beginTime: v})}
                            disabledDate={(current) => {
                              if (setting.endTime === null || setting.endTime === '') {
                                return false;
                              }
                              return current.isAfter(dayjs(setting.endTime));
                            }}
                            disabledTime={(current) => {
                              if (setting.endTime === null || setting.endTime === '' || current === undefined) {
                                return;
                              }
                              const endTime = dayjs(setting.endTime);
                              return {
                                disabledHours: () => {
                                  const cutEndTime = endTime.hour(0).minute(0).second(0).millisecond(0);
                                  const cutCurrent = current.hour(0).minute(0).second(0).millisecond(0);
                                  const diffDay = cutCurrent.diff(cutEndTime, 'd');
                                  if (diffDay > 0) {
                                    return EACH_HOUR;
                                  } else if (diffDay === 0) {
                                    return EACH_HOUR.filter(d => d > endTime.hour());
                                  } else {
                                    return [];
                                  }
                                },
                                disabledMinutes: () => {
                                  const cutEndTime = endTime.minute(0).second(0).millisecond(0);
                                  const cutCurrent = current.minute(0).second(0).millisecond(0);
                                  const diffHour = cutCurrent.diff(cutEndTime, 'h');
                                  if (diffHour > 0) {
                                    return EACH_MINUTE;
                                  } else if (diffHour === 0) {
                                    return EACH_MINUTE.filter(m => m >= endTime.minute());
                                  } else {
                                    return [];
                                  }
                                }
                              };
                            }}
                          />
                        </div>
                        <div className={styles['item-line']}>
                          <Checkbox
                            checked={timeSetting.checkedEndTime}
                            onChange={value => {
                              setTimeSetting({...timeSetting, checkedEndTime: value});
                              if (!value) {
                                setSetting({...setting, endTime: null})
                                remoteSetSetting({endTime: null})
                                  .catch(err => Message.error(err.response.data.message));
                              }
                            }}
                          >
                            结束时间
                          </Checkbox>
                          <DatePicker
                            style={{marginLeft: '6px'}}
                            size="small"
                            allowClear={false}
                            disabled={!timeSetting.checkedEndTime}
                            showTime
                            showNowBtn={false}
                            format='YYYY-MM-DD HH:mm'
                            value={setting.endTime}
                            onOk={(dateString, date) => {
                              let target;
                              const current = dayjs().add(5, 'minute');
                              if (setting.beginTime) {
                                const beginTime = dayjs(setting.beginTime).add(5, 'minute');
                                target = current.isBefore(beginTime) ? beginTime : current;
                              } else {
                                target = current;
                              }
                              if (date.isBefore(target)) {
                                dateString = target.format('YYYY-MM-DD HH:mm');
                              }
                              setSetting({...setting, endTime: dateString});
                              remoteSetSetting({endTime: dateString})
                                .catch(err => Message.error(err.response.data.message));
                            }}
                            onChange={(v) => setSetting({...setting, endTime: v})}
                            disabledDate={(current) => {
                              const today = dayjs().hour(0).minute(0).second(0).millisecond(0);
                              if (setting.beginTime === null || setting.beginTime === '') {
                                return current.isBefore(today);
                              }
                              return current.isBefore(dayjs(setting.beginTime).hour(0).minute(0).second(0).millisecond(0));
                            }}
                            disabledTime={(current) => {
                              if (current === undefined) {
                                return;
                              }
                              let target;
                              const currentTime = dayjs().add(5, 'minute');
                              if (setting.beginTime === null || setting.beginTime === '') {
                                target = currentTime;
                              } else {
                                const beginTime = dayjs(setting.beginTime).add(5, 'minute');
                                target = currentTime.isAfter(beginTime) ? currentTime : beginTime;
                              }
                              return {
                                disabledHours: () => {
                                  const cutTarget = target.hour(0).minute(0).second(0).millisecond(0);
                                  const cutCurrent = current.hour(0).minute(0).second(0).millisecond(0);
                                  const diffDay = cutCurrent.diff(cutTarget, 'd');
                                  if (diffDay < 0) {
                                    return EACH_HOUR;
                                  } else if (diffDay === 0) {
                                    return EACH_HOUR.filter(d => d < target.hour());
                                  } else {
                                    return [];
                                  }
                                },
                                disabledMinutes: () => {
                                  const cutTarget = target.minute(0).second(0).millisecond(0);
                                  const cutCurrent = current.minute(0).second(0).millisecond(0);
                                  const diffHour = cutCurrent.diff(cutTarget, 'h');
                                  if (diffHour < 0) {
                                    return EACH_MINUTE;
                                  } else if (diffHour === 0) {
                                    return EACH_MINUTE.filter(m => m <= target.minute());
                                  } else {
                                    return [];
                                  }
                                }
                              };
                            }}
                          />
                        </div>
                      </div>
                    )
                  }
                </SettingItem>
              </SettingContainer>
              <SettingContainer title="回收设置">
                <SettingItem
                  icon={<IconReminders />}
                  label="设置问卷回收上限"
                  operateNode={
                    <Switch
                      size="small"
                      checked={checkedMaxAnswers}
                      onChange={(value) => {
                        setCheckedMaxAnswers(value);
                        if (!value) {
                          setSetting({...setting, maxAnswers: 0});
                          remoteSetSetting({maxAnswers: 0})
                            .catch(err => Message.error(err.response.data.message));
                        }
                      }}
                    />
                  }
                >
                  {
                    checkedMaxAnswers
                    && (
                      <div className={styles['single-row-sub-item']}>
                        <span className={styles['tm']}>收集</span>
                        <div style={{display: 'inline-block'}}>
                          <InputNumber
                            size="small"
                            min={1}
                            max={999999}
                            className={styles['mw']}
                            value={setting.maxAnswers === 0 ? undefined : setting.maxAnswers}
                            onChange={num => {
                              if (num > 0) {
                                setSetting({...setting, maxAnswers: num});
                              }
                            }}
                            onBlur={() => {
                              if (setting.maxAnswers > 0) {
                                remoteSetSetting({maxAnswers: setting.maxAnswers})
                                  .catch(err => Message.error(err.response.data.message))
                              }
                            }}
                          />
                        </div>
                        <span className={styles['tm']}>份数据后结束</span>
                      </div>
                    )
                  }
                </SettingItem>
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconContact />}
                  label="将答题者存为联系人"
                  operateNode={
                    <Tooltip content="此功能待实现" position='bottom'>
                      <Switch size="small" disabled/>
                    </Tooltip>
                  }
                />
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconUpdate />}
                  label="允许用户修改问卷"
                  operateNode={
                    <>
                      <Tooltip
                        content="开启允许用户修改问卷需要先开启登录验证"
                        position='bottom'
                        disabled={setting.loginRequired}
                      >
                        <Switch
                          size="small"
                          disabled={!setting.loginRequired}
                          checked={setting.enableChange}
                          onChange={value => {
                            setSetting({...setting, enableChange: value});
                            remoteSetSetting({enableChange: value})
                              .catch(err => {
                                Message.error(err.response.data.message);
                                setSetting({...setting, enableChange: !value});
                              })
                          }}
                        />
                      </Tooltip>
                    </>
                  }
                />
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconCancelOnborading />}
                  label="匿名回收"
                  operateNode={
                    <>
                      <Tooltip
                        content="开启匿名回收需要先开启登录验证"
                        position='bottom'
                        disabled={setting.loginRequired}
                      >
                        <Switch
                          size="small"
                          disabled={!setting.loginRequired}
                          checked={setting.anonymously}
                          onChange={value => {
                            setSetting({...setting, anonymously: value});
                            remoteSetSetting({anonymously: value})
                              .catch(err => {
                                Message.error(err.response.data.message);
                                setSetting({...setting, anonymously: !value});
                              })
                          }}
                        />
                      </Tooltip>
                    </>
                  }
                />
              </SettingContainer>
              <SettingContainer title="其它设置">
                <SettingItem
                  icon={<IconFlipVertical />}
                  label="允许断点续答"
                  operateNode={
                    <Switch
                      size="small"
                      checked={setting.breakpointResume}
                      onChange={(value) => {
                        setSetting({...setting, breakpointResume: value});
                        remoteSetSetting({breakpointResume: value})
                          .catch(err => {
                            Message.error(err.response.data.message)
                            setSetting({...setting, breakpointResume: !value});
                          });
                      }}
                    />
                  }
                />
                <Divider className={styles['m0']} />
                <SettingItem
                  icon={<IconSaveFile />}
                  label="保存上次填写的内容"
                  operateNode={
                    <Switch
                      size="small"
                      checked={setting.saveLastAnswer}
                      onChange={(value) => {
                        setSetting({...setting, saveLastAnswer: value});
                        remoteSetSetting({saveLastAnswer: value})
                          .catch(err => {
                            Message.error(err.response.data.message)
                            setSetting({...setting, saveLastAnswer: !value});
                          });
                      }}
                    />
                  }
                />
              </SettingContainer>
            </div>
          </div>
        )
      }
    </div>
  );
}

export default Setting;