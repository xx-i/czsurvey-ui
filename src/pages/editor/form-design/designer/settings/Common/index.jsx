import { SettingItem } from "@/pages/editor/form-design/designer/SettingPanel";
import { Checkbox as ArcoCheckbox, Checkbox, Link, Modal, Select, Switch } from "@arco-design/web-react";
import { FdContext, quesTypeList } from "@/pages/editor/form-design/FdContextProvider";
import { useContext, useEffect, useState } from "react";
import { crateDefaultQuestion } from "@/pages/editor/form-design/question-service";
import { Set } from "immutable";

export function CommonSetting({id}) {

  const {getQuesDetailByKey, setQuesDetail} = useContext(FdContext);
  const quesDetail = getQuesDetailByKey(id);

  const handleChangeQuesTypeSelect = (type) => {
    setQuesDetail(crateDefaultQuestion(type, id, quesDetail.get('pageKey')));
  }

  return (
    <>
      <SettingItem>
        <Select
          value={quesDetail.get('type')}
          style={{ width: '100%' }}
          onChange={handleChangeQuesTypeSelect}
        >
          {quesTypeList.map(({key, label}) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>
      <SettingItem>
        <Checkbox
          style={{paddingLeft: 0}}
          checked={quesDetail.get('required')}
          onChange={(checked) => setQuesDetail(quesDetail.set('required', checked))}
        >必填答</Checkbox>
      </SettingItem>
    </>
  );
}

/**
 * 选项顺序随机
 */
export function RandomOptionsSetting({id}) {

  const {getQuesDetailByKey, setQuesDetail, getSerialByKey} = useContext(FdContext);
  const  radioDetail =  getQuesDetailByKey(id);
  const additionalInfo = radioDetail.get('additionalInfo');

  const [fixOptionModalVisible, setFixOptionModalVisible] = useState(false);
  const [fixedOptionKeys, setFixedOptionKeys] = useState(additionalInfo.options.filter(e => e.fixed).map(e => e.id));

  return (
    <>
      <SettingItem label="选项顺序随机">
        <Switch
          size="small"
          checked={additionalInfo.random}
          onChange={(checked) => {
            if (checked) {
              setQuesDetail(radioDetail.set('additionalInfo', {...additionalInfo, random: checked}));
            } else {
              setFixedOptionKeys([]);
              setQuesDetail(radioDetail.set(
                'additionalInfo',
                {
                  ...additionalInfo,
                  random: checked,
                  options: additionalInfo.options.map(o => ({...o, fixed: false}))
                }
              ));
            }
          }}
        />
      </SettingItem>
      {
        additionalInfo.random
        && (
          <SettingItem label="固定选项 (使选项不随机)">
            <Link onClick={() => setFixOptionModalVisible(true)}>设置</Link>
          </SettingItem>
        )
      }
      <Modal
        title={`Q${getSerialByKey(id)} 固定选项`}
        visible={fixOptionModalVisible}
        onOk={() => {
          const fixedOptionKeysSet = Set(fixedOptionKeys);
          setQuesDetail(radioDetail.set(
            'additionalInfo',
            {
              ...additionalInfo,
              options: additionalInfo.options.map(o => ({...o, fixed: fixedOptionKeysSet.has(o.id)}))
            }
          ));
          setFixOptionModalVisible(false);
        }}
        onCancel={() => {
          setFixedOptionKeys(additionalInfo.options.filter(e => e.fixed).map(e => e.id));
          setFixOptionModalVisible(false);
        }}
        maskClosable={false}
      >
        <div className="setting-modal-content">
          <ArcoCheckbox.Group
            value={fixedOptionKeys}
            onChange={(e) => setFixedOptionKeys(e)}
            style={{width: '100%'}}
            direction='vertical'
            options={additionalInfo.options.map(o => ({value: o.id, label: o.label.getPlainText()}))}
          />
        </div>
      </Modal>
    </>
  );
}

export function ReferenceOptionSetting({id}) {

  const {getQuesDetailByKey, setQuesDetail, getQuestionBeforeKey} = useContext(FdContext);
  const  radioDetail =  getQuesDetailByKey(id);
  const additionalInfo = radioDetail.get('additionalInfo');
  const {reference, refQuestionKey} = additionalInfo;

  const [referenceParam, setReferenceParam] = useState({reference, refQuestionKey});

  useEffect(() => {
    setReferenceParam({reference, refQuestionKey});
  }, [id, reference, refQuestionKey]);

  return (
    <>
      <SettingItem label="选项引用">
        <Switch
          size="small"
          checked={referenceParam.reference}
          onChange={(checked) => {
            if (!checked) {
              const param = {...referenceParam, reference: checked, refQuestionKey: null};
              setReferenceParam(param);
              setQuesDetail(radioDetail.set(
                'additionalInfo',
                {...additionalInfo, ...param}
              ));
            } else {
              setReferenceParam({...referenceParam, reference: checked});
            }
          }}
        />
      </SettingItem>
      {
        referenceParam.reference
        && (
          <div>
            <Select
              placeholder="请选择题目(多选题)"
              value={referenceParam.refQuestionKey || undefined}
              onChange={(key) => {
                const param = {...referenceParam, refQuestionKey: key};
                setReferenceParam(param);
                setQuesDetail(radioDetail.set(
                  'additionalInfo',
                  {...additionalInfo, ...param}
                ))
              }}
            >
              {
                getQuestionBeforeKey(id, 'CHECKBOX').map(ques => {
                  const questionKey = ques.get('questionKey');
                  const questionTitle = ques.get('title').getPlainText();
                  return (
                    <Select.Option key={questionKey} value={questionKey}>
                      {questionTitle}
                    </Select.Option>
                  );
                })
              }
            </Select>
          </div>
        )
      }
    </>
  );
}