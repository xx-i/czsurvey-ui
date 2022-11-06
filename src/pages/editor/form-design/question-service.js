import { IconCodeSquare, IconSettings } from "@arco-design/web-react/icon";

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