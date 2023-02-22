import { SettingContainer, SettingItem } from "@/pages/editor/form-design/designer/SettingPanel";
import { CommonSetting } from "@/pages/editor/form-design/designer/settings/Common";
import { InputNumber, Select } from "@arco-design/web-react";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { useContext, useEffect, useState } from "react";

function Input({id}) {
  const {getQuesDetailByKey, setQuesDetail} = useContext(FdContext);
  const  inputDetail =  getQuesDetailByKey(id);
  const additionalInfo = inputDetail.get('additionalInfo');
  const [maxLength, setMaxLength] = useState(additionalInfo.maxLength);
  
  useEffect(() => {
    setMaxLength(additionalInfo.maxLength);
  }, [additionalInfo]);

  return (
    <div>
      <SettingContainer title="题目">
        <CommonSetting id={id}/>
      </SettingContainer>
      <SettingContainer title="文本">
        <SettingItem label="文本校验">
          <Select
            placeholder='不限'
            style={{ width: 180 }}
            value={additionalInfo.type}
            onChange={value => setQuesDetail(inputDetail.set('additionalInfo', {...additionalInfo, type: value}))}
          >
            <Select.Option value={null}>不限</Select.Option>
            <Select.Option value="NUMBER">数字</Select.Option>
            <Select.Option value="EMAIL">邮箱</Select.Option>
            <Select.Option value="CHINESE">中文</Select.Option>
            <Select.Option value="ENGLISH">英文</Select.Option>
            <Select.Option value="URL">网址</Select.Option>
            <Select.Option value="ID_CARD">身份证号</Select.Option>
            <Select.Option value="PHONE">手机号</Select.Option>
          </Select>
        </SettingItem>
        <SettingItem label="最多填写">
          <InputNumber
            placeholder='不限'
            min={1}
            max={9999}
            style={{ width: 180 }}
            value={maxLength}
            onChange={value => setMaxLength(value)}
            onBlur={event => {
              const value = event.target.value;
              setQuesDetail(inputDetail.set(
                'additionalInfo',
                {
                  ...additionalInfo,
                  maxLength: value === '' ? null : parseInt(value)
                }
              ))
            }}
          />
        </SettingItem>
      </SettingContainer>
    </div>
  );
}

export default Input;