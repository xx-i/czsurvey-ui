import { SettingContainer } from "@/pages/editor/form-design/designer/SettingPanel";
import {
  CommonSetting,
  RandomOptionsSetting,
  ReferenceOptionSetting
} from "@/pages/editor/form-design/designer/settings/Common";

function Radio({id}) {

  return (
    <div>
      <SettingContainer title="题目">
        <CommonSetting id={id}/>
      </SettingContainer>
      <SettingContainer title="选项">
        <RandomOptionsSetting id={id} />
        <ReferenceOptionSetting id={id}/>
      </SettingContainer>
    </div>
  );
}

export default Radio;