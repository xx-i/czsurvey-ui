import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Editor, { createEditorStateWithText } from '@draft-js-plugins/editor';
import {EditorState} from 'draft-js';
import classNames from "classnames";
import createToolbarPlugin from '@draft-js-plugins/static-toolbar'
import '@draft-js-plugins/static-toolbar/lib/plugin.css';

import styles from './style/index.module.less'

import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  CodeButton,
  // HeadlineOneButton,
  // HeadlineTwoButton,
  // HeadlineThreeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from '@draft-js-plugins/buttons';
import { IconClose } from "@arco-design/web-react/icon";

function InlineRichEditor(
  {
    onFocus,
    className,
    editorPrefix,
    contentState,
    placeholder,
    defaultText = '',
    cancellable = false,
    onCancel,
    onBlur
  },
  ref
) {

  const [editorState, setEditorState] = useState(() => {
    if (contentState) {
      return EditorState.createWithContent(contentState);
    }
    return createEditorStateWithText(defaultText)
  });
  const [focusEditor, setFocusEditor] = useState(false);
  const [{plugins, Toolbar}] = useState(() => {
    const staticToolbarPlugin = createToolbarPlugin({theme: {toolbarStyles: styles, buttonStyles: styles}});
    const { Toolbar } = staticToolbarPlugin;
    const plugins = [staticToolbarPlugin];
    return {
      Toolbar,
      plugins
    }
  });

  const editorRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current.editor.focus()
  }));

  useEffect(() => {
    contentState && setEditorState(EditorState.createWithContent(contentState));
  }, [contentState])

  // console.log(editorState.getCurrentContent().getPlainText())
  // console.log(convertToRaw(editorState.getCurrentContent()))
  // ContentState.createFromText("请输入题目标题")
  // console.log(JSON.stringify(convertToRaw(editorState.getCurrentContent())));

  return (
    <div
      className={
      classNames(
        styles['editor-wrapper'],
        focusEditor && styles['focus'],
        cancellable && styles['cancellable'],
        className
      )
    }
    >
      <div className={classNames(styles['editor-container'], 'inline-rich-editor')}>
        {editorPrefix && <div className={styles['editor-prefix']}>{editorPrefix}</div>}
        <div className={styles['editor']}>
          <Editor
            ref={editorRef}
            plugins={plugins}
            editorState={editorState}
            onChange={setEditorState}
            onFocus={() => {
              setFocusEditor(true);
            }}
            onBlur={(e) => {
              onBlur && onBlur(editorState.getCurrentContent());
              setFocusEditor(false);
            }}
            placeholder={placeholder}
          />
        </div>
        {
          cancellable
          && (
            <div className={classNames(styles['cancel-btn'], 'cancel-btn')}>
              <button onClick={() => onCancel && onCancel()}>
                <IconClose />
              </button>
            </div>
          )
        }
        {
          focusEditor &&
          <div className={styles['editor-toolbar']}>
            <Toolbar>
              {
                (externalProps) => (
                  <>
                    <BoldButton {...externalProps} />
                    <ItalicButton {...externalProps} />
                    <UnderlineButton {...externalProps} />
                    <CodeButton {...externalProps} />
                    {/*<Separator {...externalProps} />*/}
                    {/*<HeadlinesButton {...externalProps} />*/}
                    <UnorderedListButton {...externalProps} />
                    <OrderedListButton {...externalProps} />
                    <BlockquoteButton {...externalProps} />
                    <CodeBlockButton {...externalProps} />
                  </>
                )
              }
            </Toolbar>
          </div>
        }
      </div>
    </div>
  )
}

export default forwardRef(InlineRichEditor);