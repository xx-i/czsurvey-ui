import { IconLeft, IconMore, IconMoreVertical, IconRight } from "@arco-design/web-react/icon";
import styles from './style/index.module.less'
import classNames from "classnames";
import { Menu, Popover } from "@arco-design/web-react";
import React, { useEffect, useState } from "react";
import { Scrollbar } from 'react-scrollbars-custom';

const getActiveIndex = (pageKeys, activeKey) => {
  const keyIndex = pageKeys.indexOf(activeKey);
  return keyIndex !== -1 ? keyIndex : 0;
}

function Pagination(
  {
    className,
    pageKeys,
    renderPopover,
    activeKey,
    onChangeActive,
    children
  }
) {

  const [activeIndex, setActiveIndex] = useState(getActiveIndex(pageKeys, activeKey));
  const [popupVisible, setPropuVisble] = useState(false);
  const [activeMoreBtn, setActiveMorBtn] = useState(null);

  useEffect(() => {
    setActiveIndex(getActiveIndex(pageKeys, activeKey));
  }, [pageKeys, activeKey]);

  const handleTurnPage = (index) => {
    setActiveIndex(index);
    setPropuVisble(false);
    onChangeActive && onChangeActive(index);
  };

  const handleMoreBtnPopVisibleChange = (index) => {
    return (visible) => {
      if (visible) {
        setActiveMorBtn(index)
      } else if (index === activeMoreBtn) {
        setActiveMorBtn(null);
      }
    }
  };

  const getMoreBtnPopoverContent = (index) => (
    <div onClick={() => setActiveMorBtn(null)}>
      {renderPopover && renderPopover(index)}
    </div>
  );

  const PageButton = ({index}) => {
    return (
      <div
        className={
          classNames(
            styles['page-button'],
            activeIndex === index && styles['active'],
            activeMoreBtn === index && styles['active-more-btn'],
            className
          )
        }
      >
        <button
          className={styles['page-num-btn']}
          onClick={() => handleTurnPage(index)}
        >
          {index + 1}
        </button>
        <Popover
          className={styles['page-pop']}
          position='bottom'
          trigger='click'
          popupVisible={activeMoreBtn === index}
          onVisibleChange={handleMoreBtnPopVisibleChange(index)}
          content={getMoreBtnPopoverContent(index)}
        >
          <button className={styles['more-btn']}>
            <IconMoreVertical />
          </button>
        </Popover>
      </div>
    );
  };

  const renderPageButtons = () => {
    const keyWithIndex = pageKeys.map((key, index) => ({key, index}));
    if (pageKeys.length <= 8) {
       return keyWithIndex.map(e => <PageButton key={e.key} index={e.index}/>);
    } else if (pageKeys.length - activeIndex <= 8) {
      const backKeys = [...keyWithIndex.slice(-8)];
      return backKeys.map(e => <PageButton key={e.key} index={e.index}/>);
    } else {
      const frontKeys = [...keyWithIndex.slice(activeIndex, activeIndex + 4)];
      const middleKeys = [...keyWithIndex.slice(activeIndex + 4, -4)];
      const backKeys = [...keyWithIndex.slice(-4)];
      const middlePageContent = (
        <Scrollbar
          translateContentSizeYToHolder
          disableTrackYWidthCompensation
          style={{maxHeight: "280px", width: "44px"}}
          trackYProps={{
            renderer: (props) => {
              const { elementRef, ...restProps } = props;
              return <span {...restProps} ref={elementRef} className={styles['scroll-bar-track']} />;
            },
          }}
          thumbYProps={{
            renderer: (props) => {
              const { elementRef, ...restProps } = props;
              return <div {...restProps} ref={elementRef} className={styles['scroll-bar-thumb']} />;
            },
          }}
        >
          <Menu className={styles['collapse-page-menu']}>
            {middleKeys.map(e => (<Menu.Item onClick={() => handleTurnPage(e.index) } key={e.key}>{e.index + 1}</Menu.Item>))}
          </Menu>
        </Scrollbar>
      );
      return (
        <>
          {frontKeys.map(e => <PageButton key={e.key} index={e.index}/>)}
          <Popover
            className={styles['page-pop']}
            position='bottom'
            trigger='click'
            popupVisible={popupVisible}
            onVisibleChange={e => setPropuVisble(e)} content={middlePageContent}>
            <button className={styles['collapse-page-btn']}>
              <IconMore />
            </button>
          </Popover>
          {backKeys.map(e => <PageButton key={e.key} index={e.index}/>)}
        </>
      );
    }
  }

  const handleClickNextPage = (step) => {
    const nextPage = activeIndex + step;
    setActiveIndex(nextPage);
    onChangeActive(nextPage);
  }

  return (
    <div className={styles['pagination']}>
      <div className={classNames(styles['page-turner'], styles['pre-btn'])}>
        <button
          disabled={activeIndex <= 0}
          onClick={() => handleClickNextPage(-1)}
        >
          <IconLeft />
        </button>
      </div>
      {renderPageButtons()}
      <div className={styles['page-turner']}>
        <button
          disabled={activeIndex >= pageKeys.length - 1}
          onClick={() => handleClickNextPage(1)}
        >
          <IconRight />
        </button>
      </div>
      {children}
    </div>
  );
}

export default Pagination;