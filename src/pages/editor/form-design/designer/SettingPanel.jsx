import styles from './style/index.module.less'
import { Empty, Message, Switch, Tabs, Typography } from '@arco-design/web-react';
import { useContext, useEffect, useState } from "react";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import Radio from "@/pages/editor/form-design/designer/settings/Radio";
import Checkbox from "@/pages/editor/form-design/designer/settings/Checkbox";
import Input from "@/pages/editor/form-design/designer/settings/Input";
import Textarea from "@/pages/editor/form-design/designer/settings/Textarea";
import classNames from "classnames";
import request from "@/utils/request";
import { useSearchParams } from "react-router-dom";
const TabPane = Tabs.TabPane;

export function SettingContainer({title, children}) {
  return (
    <div className={styles['general-settings']}>
      <h3 className={styles['setting-title']}>{title}</h3>
      {children}
    </div>
  );
}

export function SettingItem({label, children}) {
  return (
    <div className={styles['setting-item']}>
      {label && <span>{label}</span>}
      {children}
    </div>
  );
}


function SettingPanel() {

  const {getQuesDetailByKey, activeQuestionKey, surveySettings, setSurveySettings} = useContext(FdContext);
  const activeQuesType = getQuesDetailByKey(activeQuestionKey)?.get('type');
  const [activeTab, setActiveTab] = useState(activeQuesType ? '2' : '1');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    activeQuesType ? setActiveTab('2') : setActiveTab('1');
  }, [activeQuesType]);

  const remoteSetSetting = (params) => {
    return request.put('/survey/setting', {...params, surveyId: searchParams.get('id')});
  };

  const renderQuesSettingPane = () => {
    if (activeQuestionKey) {
      switch (activeQuesType) {
        case 'RADIO': {
          return <Radio id={activeQuestionKey}/>
        }
        case 'CHECKBOX': {
          return <Checkbox id={activeQuestionKey}/>
        }
        case 'INPUT': {
          return <Input id={activeQuestionKey}/>
        }
        case 'TEXTAREA': {
          return <Textarea id={activeQuestionKey} />
        }
        default: {
          return <Empty/>
        }
      }
    }
    return <Empty style={{marginTop: '30px'}}/>
  }

  return (
    <div
      className={classNames(styles['setting-panel'], 'rewrite-arco')}
      onClick={(e) => e.stopPropagation()}
    >
      <Tabs activeTab={activeTab} onChange={setActiveTab} className={styles['setting-tabs-container']}>
        <TabPane key='1' title='整卷设置'>
          <Typography.Paragraph>
            <div className={styles['panel-settings']}>
              <SettingContainer title="显示方式">
                <SettingItem label="显示题目编号">
                  <Switch
                    checked={surveySettings?.displayQuestionNo}
                    size="small"
                    onChange={(value) => {
                      setSurveySettings({...surveySettings, displayQuestionNo: value});
                      remoteSetSetting({displayQuestionNo: value})
                        .catch(err => {
                          Message.error(err.response.data.message)
                          setSurveySettings({...surveySettings, displayQuestionNo: !value});
                        });
                    }}
                  />
                </SettingItem>
                <SettingItem label="答题过程中可回退">
                  <Switch
                    checked={surveySettings?.allowRollback}
                    size="small"
                    onChange={(value) => {
                      setSurveySettings({...surveySettings, allowRollback: value});
                      remoteSetSetting({allowRollback: value})
                        .catch(err => {
                          Message.error(err.response.data.message);
                          setSurveySettings({...surveySettings, allowRollback: !value});
                        })
                    }}
                  />
                </SettingItem>
              </SettingContainer>
            </div>
          </Typography.Paragraph>
        </TabPane>
        <TabPane key='2' title='题目设置'>
          <Typography.Paragraph>
            <div className={styles['panel-settings']}>
              {renderQuesSettingPane()}
            </div>
          </Typography.Paragraph>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default SettingPanel;