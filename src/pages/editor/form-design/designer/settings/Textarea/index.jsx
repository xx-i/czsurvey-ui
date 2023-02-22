import { SettingContainer, SettingItem } from "@/pages/editor/form-design/designer/SettingPanel";
import { CommonSetting } from "@/pages/editor/form-design/designer/settings/Common";
import { InputNumber } from "@arco-design/web-react";
import { useContext, useEffect, useState } from "react";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";

function Textarea({id}) {

  const {getQuesDetailByKey, setQuesDetail} = useContext(FdContext);
  const  textareaDetail =  getQuesDetailByKey(id);
  const additionalInfo = textareaDetail.get('additionalInfo');
  const [settingParam, setSettingParam] = useState(additionalInfo);

  useEffect(() => {
    setSettingParam(additionalInfo);
  }, [additionalInfo]);

  return (
    <div>
      <SettingContainer title="题目">
        <CommonSetting id={id}/>
      </SettingContainer>
      <SettingContainer title="文本">
        <SettingItem label="最少填写">
          <InputNumber
            placeholder='不限'
            min={1}
            max={99999}
            style={{ width: 180 }}
            value={settingParam.minLength}
            onChange={value => {
              let minLength = value;
              if (settingParam.maxLength) {
                minLength = value > settingParam.maxLength ? settingParam.maxLength : value;
              }
              setSettingParam({...settingParam, minLength});
            }}
            onBlur={() => {
              const value = settingParam.minLength;
              setQuesDetail(textareaDetail.set(
                'additionalInfo',
                {
                  ...settingParam,
                  minLength: value === '' ? null : parseInt(value)
                }
              ))
            }}
          />
        </SettingItem>
        <SettingItem label="最多填写">
          <InputNumber
            placeholder='不限'
            min={1}
            max={99999}
            style={{ width: 180 }}
            value={settingParam.maxLength}
            onChange={value => {
              let maxLength = value;
              if (settingParam.minLength) {
                maxLength = settingParam.minLength > maxLength ? settingParam.minLength : value;
              }
              setSettingParam({...settingParam, maxLength});
            }}
            onBlur={() => {
              const value = settingParam.maxLength;
              setQuesDetail(textareaDetail.set(
                'additionalInfo',
                {
                  ...settingParam,
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

export default Textarea;