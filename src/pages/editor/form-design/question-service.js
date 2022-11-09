import { IconCodeSquare, IconSettings } from "@arco-design/web-react/icon";
import { Map } from "immutable";
import { ContentState, convertFromRaw, convertToRaw } from "draft-js";

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
        label: '下拉'
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
        label: '量表/NPS'
      },
      {
        key: 'UPLOAD',
        icon: <IconCodeSquare />,
        label: '文件/图片'
      },
      {
        key: 'DATETIME',
        icon: <IconCodeSquare />,
        label: '时间日期'
      },
      {
        key: 'SIGN',
        icon: <IconCodeSquare />,
        label: '手写签名'
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
        label: '备注说明'
      }
    ]
  }
];

function convertQuesDataToDetail(question) {
  const extra = {
    titleText: convertFromRaw(question.title).getPlainText()
  };
  return Map({...question, extra});
}

export function crateDefaultQuestion(type, questionKey) {
  const common = {
    questionKey,
    title: convertToRaw(ContentState.createFromText('请输入题目标题')),
    description: null,
    type,
    required: true,
  };
  let additionalInfo = null;
  switch (type) {
    case 'INPUT': {
      additionalInfo = {inputType: null, maxLength: null};
      break;
    }
    case 'TEXTAREA': {
      additionalInfo = {maxLength: null, minLength: null};
      break;
    }
    default: {
      throw new Error(`类型${type}不存在`);
    }
  }
  return convertQuesDataToDetail({...common, additionalInfo});
}