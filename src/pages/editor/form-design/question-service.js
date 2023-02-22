import { IconCodeSquare, IconSettings } from "@arco-design/web-react/icon";
import { Map } from "immutable";
import { ContentState } from "draft-js";
import { randomStrArr } from "@/utils/random";

export const questionTypes = [
  {
    id: '1',
    label: '选择',
    types: [
      {
        key: 'RADIO',
        icon: <IconSettings />,
        label: '单选'
      },
      {
        key: 'CHECKBOX',
        icon: <IconCodeSquare />,
        label: '多选'
      },
      {
        key: 'SELECT',
        icon: <IconCodeSquare />,
        label: '下拉',
        disabled: true
      },
    ]
  },
  {
    id: '2',
    label: '文本输入',
    types: [
      {
        key: 'INPUT',
        icon: <IconSettings />,
        label: '单行文本'
      },
      {
        key: 'TEXTAREA',
        icon: <IconCodeSquare />,
        label: '多行文本'
      },
    ]
  },
  {
    id: '3',
    label: '高级题型',
    types: [
      {
        key: 'RATE',
        icon: <IconSettings />,
        label: '量表/NPS',
        disabled: true
      },
      {
        key: 'UPLOAD',
        icon: <IconCodeSquare />,
        label: '文件/图片',
        disabled: true
      },
      {
        key: 'DATETIME',
        icon: <IconCodeSquare />,
        label: '时间日期',
        disabled: true,
      },
      {
        key: 'SIGN',
        icon: <IconCodeSquare />,
        label: '手写签名',
        disabled: true
      },
    ]
  },
  {
    id: '4',
    label: '备注说明',
    types: [
      {
        key: 'DESCRIPTION',
        icon: <IconCodeSquare />,
        label: '文本说明'
      }
    ]
  }
];

export function isInputModeQuestionType(type) {
  return type !== 'DESCRIPTION';
}

export function isChoiceQuestion(type) {
  return ['RADIO', 'CHECKBOX', 'SELECT'].indexOf(type) !== -1;
}

export function crateDefaultQuestion(type, questionKey, pageKey) {
  let common = {
    questionKey,
    title: ContentState.createFromText('请输入题目标题'),
    description: null,
    type,
    pageKey,
    required: true,
  };
  let additionalInfo = null;
  switch (type) {
    case 'INPUT': {
      additionalInfo = {type: null, maxLength: null};
      break;
    }
    case 'TEXTAREA': {
      additionalInfo = {maxLength: null, minLength: null};
      break;
    }
    case 'RADIO': {
      const getRadioOptions = () => {
        const radioKeys = randomStrArr(4, 2);
        return radioKeys.map(key => ({
          id: 'ro_' + key,
          label: ContentState.createFromText('选项'),
          fixed: false,
          otherOption: false
        }));
      };
      additionalInfo = {
        options: getRadioOptions(),
        random: false,
        reference: false,
        refQuestionKey: null
      }
      break
    }
    case 'CHECKBOX': {
      const getCheckboxOptions = () => {
        const checkboxKeys = randomStrArr(4, 2);
        return checkboxKeys.map(key => ({
          id: 'co_' + key,
          label: ContentState.createFromText('选项'),
          fixed: false,
          otherOption: false,
          exclusive: false
        }));
      }
      additionalInfo = {
        options: getCheckboxOptions(),
        random: false,
        minLength: null,
        maxLength: null,
        reference: false,
        refQuestionKey: null
      }
      break;
    }
    case 'DESCRIPTION': {
      common = {...common, title: ContentState.createFromText('请输入文本描述'), required: false};
      break;
    }
    default: {
      throw new Error(`类型${type}不存在`);
    }
  }
  return Map({...common, additionalInfo});
}