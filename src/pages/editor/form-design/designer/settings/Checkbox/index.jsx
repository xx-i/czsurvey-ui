import { SettingContainer, SettingItem } from "@/pages/editor/form-design/designer/SettingPanel";
import {
  CommonSetting,
  RandomOptionsSetting,
  ReferenceOptionSetting
} from "@/pages/editor/form-design/designer/settings/Common";
import { Checkbox as ArcoCheckbox, Link, Modal, Select } from "@arco-design/web-react";
import { useContext, useState } from "react";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { Set } from "immutable";

function Checkbox({id}) {

  const {getQuesDetailByKey, setQuesDetail, getSerialByKey} = useContext(FdContext);
  const  radioDetail =  getQuesDetailByKey(id);
  const additionalInfo = radioDetail.get('additionalInfo');

  const [exclusiveOptionModalVisible, setExclusiveOptionModalVisible] = useState(false);
  const [exclusiveOptionKeys, setExclusiveOptionKeys] = useState(additionalInfo.options.filter(e => e.exclusive).map(e => e.id))

  const getLengthOption = (optionProvider) => {
    return [
      <Select.Option key="_" value={null}>不限</Select.Option>,
      ...optionProvider()
    ];
  };

  const getMinLengthOptions = () => {
    const optionsLength = additionalInfo.options.length;
    const maxLength = additionalInfo.maxLength;
    return [...Array(optionsLength)].map((_, index) => {
      const i = index + 1;
      return <Select.Option key={i} value={i} disabled={maxLength !== null && i > maxLength}>{`${i}项`}</Select.Option>;
    });
  };

  const getMaxLengthOptions = () => {
    const optionsLength = additionalInfo.options.length;
    const minLength = additionalInfo.minLength;
    return [...Array(optionsLength)].map((_, index) => {
      const i = index + 1;
      return <Select.Option key={i} value={i} disabled={minLength !== null && i < minLength}>{`${i}项`}</Select.Option>;
    });
  };

  return (
    <div>
      <SettingContainer title="题目">
        <CommonSetting id={id}/>
      </SettingContainer>
      <SettingContainer title="选项">
        <RandomOptionsSetting id={id}/>
        <SettingItem label="互斥选项">
          <Link onClick={() => setExclusiveOptionModalVisible(true)}>设置</Link>
        </SettingItem>
        <SettingItem label="最少选择">
          <Select
            value={additionalInfo.minLength}
            onChange={(v) => setQuesDetail(radioDetail.set('additionalInfo', {...additionalInfo, minLength: v}))}
            placeholder='不限'
            style={{ width: 120 }}
          >
            {getLengthOption(getMinLengthOptions)}
          </Select>
        </SettingItem>
        <SettingItem label="最多选择">
          <Select
            value={additionalInfo.maxLength}
            onChange={(v) => setQuesDetail(radioDetail.set('additionalInfo', {...additionalInfo, maxLength: v}))}
            placeholder='不限'
            style={{ width: 120 }}
          >
            {getLengthOption(getMaxLengthOptions)}
          </Select>
        </SettingItem>
        <ReferenceOptionSetting id={id}/>
      </SettingContainer>
      <Modal
        title={`Q${getSerialByKey(id)} 互斥选项`}
        visible={exclusiveOptionModalVisible}
        onOk={() => {
          const exclusiveOptionKeysSet = Set(exclusiveOptionKeys);
          setQuesDetail(radioDetail.set(
            'additionalInfo',
            {
              ...additionalInfo,
              options: additionalInfo.options.map(o => ({...o, exclusive: exclusiveOptionKeysSet.has(o.id)}))
            }
          ));
          setExclusiveOptionModalVisible(false);
        }}
        onCancel={() => {
          setExclusiveOptionKeys(additionalInfo.options.filter(e => e.exclusive).map(e => e.id));
          setExclusiveOptionModalVisible(false);
        }}
        maskClosable={false}
      >
        <div className="setting-modal-content">
          <ArcoCheckbox.Group
            value={exclusiveOptionKeys}
            onChange={(e) => setExclusiveOptionKeys(e)}
            style={{ width: '100%' }}
            direction='vertical'
            options={additionalInfo.options.map(o => ({value: o.id, label: o.label.getPlainText()}))}
          />
        </div>
      </Modal>
    </div>
  );
}

export default Checkbox;