import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { useContext } from "react";
import styles from './style/index.module.less'
import classNames from "classnames";

function OutlineTab() {

  const {
    quesOrder: {itemOrder},
    pageOrder,
    getQuesDetailByKey,
    getQuesTypeByKey,
    surveySettings,
    getSerialByKey
  } = useContext(FdContext);

  return (
    <div className={styles['outline-tab']}>
      {
        pageOrder.map((pageKey, index) => {
          return (
            <div key={pageKey} className={styles['page-item']}>
              <div className={classNames(styles['outline-item'], styles['page-title'])}>
                第{index + 1}页
              </div>
              <div>
                {
                  itemOrder[pageKey].map(quesKey => {
                    const question = getQuesDetailByKey(quesKey);
                    const type = question.get('type');
                    let title = question.get('title').getPlainText();
                    const typeDetail = getQuesTypeByKey(type);
                    if (surveySettings?.displayQuestionNo) {
                      const serial = getSerialByKey(quesKey);
                      let serialText;
                      if (serial) {
                        serialText = serial < 10 ? `0${serial}. ` : `${serial.toString()}. `;
                        title = serialText + title;
                      }
                    }
                    return (
                      <div key={quesKey} className={styles['outline-item']}>
                        <span className={styles['item-icon']}>{typeDetail.icon}</span>
                        <span className={styles['ques-title-text']}>{title}</span>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )
        })
      }
    </div>
  );
}

export default OutlineTab;