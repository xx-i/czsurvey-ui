import styles from './style/index.module.less'
import InlineRichEditor from "@/components/InlineRichEditor";
import React, { useContext, useRef, useState } from "react";
import classNames from "classnames";
import SettingPanel from "@/pages/editor/form-design/designer/SettingPanel";
import Input from "@/pages/editor/form-design/designer/questions/Input";
import Textarea from "@/pages/editor/form-design/designer/questions/Textarea";
import { FdContext } from "@/pages/editor/form-design/FdContextProvider";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Indicator from "@/pages/editor/form-design/designer/Indicator";
import Pagination from "@/components/Pagination";
import { Divider, Menu, Message } from "@arco-design/web-react";
import { IconCreateRecord } from "@arco-iconbox/react-cz-icon"
import Radio from "@/pages/editor/form-design/designer/questions/Radio";
import CheckBox from "@/pages/editor/form-design/designer/questions/CheckBox";
import Description from "@/pages/editor/form-design/designer/questions/Description";

function Designer() {
  const titleRef = useRef();
  const instructionRef = useRef();
  const {
    quesOrder: {itemOrder},
    getQuesDetailByKey,
    activeQuestionKey,
    setActiveQuestionKey,
    currentPage,
    setCurrentPage,
    pageOrder,
    setPageOrder,
    createPage,
    surveySummary,
    updateSurveySummary,
    deletePage
  } = useContext(FdContext);
  const [surveySummaryParam, setSurveySummaryParam] = useState(surveySummary);

  const handleTitleInputBlur = (e) => {
    if (e.target.value === '') {
      Message.warning('请输入问卷标题');
      setSurveySummaryParam({...surveySummaryParam, title: surveySummary.title});
    } else {
      if (surveySummary.title !== surveySummaryParam.title) {
        updateSurveySummary(surveySummaryParam);
      }
    }
  }

  const handleInstructionEditorBlur = (content) => {
      updateSurveySummary({...surveySummaryParam, instruction: content});
  }

  // eslint-disable-next-line
  const moveForwardPage = (index) => {
    if (index > 0) {
      setPageOrder(arrayMove(pageOrder, index, index - 1))
      setCurrentPage(pageOrder[index]);
    }
  }

  // eslint-disable-next-line
  const moveBackPage = (index) => {
    if (index < pageOrder.length - 1) {
      setPageOrder(arrayMove(pageOrder, index, index + 1));
      setCurrentPage(pageOrder[index]);
    }
  }

  const renderPaginationPopover = (index) => {
    return (
      <Menu className={styles['pagination-menu']}>
        {/*{*/}
        {/*  index !== 0*/}
        {/*  && (*/}
        {/*    <Menu.Item key='1' onClick={() => moveForwardPage(index)}>*/}
        {/*      前移一页*/}
        {/*    </Menu.Item>*/}
        {/*  )*/}
        {/*}*/}
        {/*{*/}
        {/*  index < pageOrder.length - 1*/}
        {/*  && (*/}
        {/*    <Menu.Item*/}
        {/*      key='2'*/}
        {/*      onClick={() => moveBackPage(index)}*/}
        {/*    >*/}
        {/*      后移一页*/}
        {/*    </Menu.Item>*/}
        {/*  )*/}
        {/*}*/}
        <Menu.Item key='3' disabled={pageOrder.length === 1} onClick={() => deletePage(index)}>删除</Menu.Item>
      </Menu>
    )
  };

  return (
    <div className={styles['designer-wrapper']} onClick={() => setActiveQuestionKey(null)}>
      <div className={styles['survey-bg']}/>
      <div className={styles['pagination']}>
        <Pagination
          activeKey={currentPage}
          pageKeys={pageOrder}
          renderPopover={renderPaginationPopover}
          onChangeActive={(index) => setCurrentPage(pageOrder[index])}
        >
          <Divider type='vertical' style={{margin: '0 8px 0 6px'}} />
          <button className={styles['add-page-btn']} onClick={() => createPage()}><IconCreateRecord /></button>
        </Pagination>
      </div>
      <div className={styles['designer-container']}>
        {
          currentPage && pageOrder[0] === currentPage
          && (
            <>
              <div className={classNames(activeQuestionKey === 'TITLE' && styles['active'], styles['content-card-wrapper'])}>
                <div
                  className={classNames(styles['su-title-container'], styles['su-content-card'])}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeQuestionKey !== 'TITLE') {
                      titleRef.current.focus();
                      setActiveQuestionKey('TITLE');
                    }
                  }}
                >
                  <input
                    ref={titleRef}
                    type='text'
                    value={surveySummaryParam.title}
                    onBlur={handleTitleInputBlur}
                    onChange={(e) => {setSurveySummaryParam({...surveySummaryParam, title: e.target.value})}}
                  />
                </div>
              </div>
              <div className={classNames(activeQuestionKey === 'INSTRUCTION' && styles['active'], styles['content-card-wrapper'])}>
                <div
                  className={classNames(styles['su-desc-container'], styles['su-content-card'])}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeQuestionKey !== 'INSTRUCTION') {
                      instructionRef.current.focus();
                      setActiveQuestionKey('INSTRUCTION');
                    }
                  }}
                >
                  <InlineRichEditor
                    className={styles['su-desc-editor']}
                    ref={instructionRef}
                    contentState={surveySummary.instruction}
                    onBlur={handleInstructionEditorBlur}
                  />
                </div>
              </div>
            </>
          )
        }
        <div className={styles['sortable-container']}>
          {
            currentPage && itemOrder[currentPage]
            && (
              <SortableContext items={itemOrder[currentPage]} strategy={verticalListSortingStrategy}>
                {
                  itemOrder[currentPage].map(key => {
                    if (!key.startsWith('q_')) {
                      return <Indicator key={key} id={key} type='quesIndicator' style={{height: '3px', width: '100%', background: '#0F6BFF'}} />
                    }
                    const ques = getQuesDetailByKey(key);
                    const type = ques.get('type');
                    if (type === 'INPUT') {
                      return <Input key={key} id={key} />
                    } else if (type === 'RADIO') {
                      return <Radio key={key} id={key} />
                    } else if (type === 'CHECKBOX') {
                      return <CheckBox key={key} id={key} />
                    } else if (type === 'DESCRIPTION') {
                      return <Description key={key} id={key}/>
                    } else if (type === 'TEXTAREA') {
                      return <Textarea key={key} id={key} />
                    } else {
                      return undefined;
                    }
                  })
                }
              </SortableContext>
            )
          }
        </div>
      </div>
      <SettingPanel/>
    </div>
  );
}

export default Designer;