import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Editor, { createEditorStateWithText } from '@draft-js-plugins/editor';
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

function InlineRichEditor({onFocus, className, editorPrefix, defaultText = ''}, ref) {

  const [editorState, setEditorState] = useState(() => createEditorStateWithText(defaultText));
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

  // console.log(editorState.getCurrentContent().getPlainText())
  // console.log(convertToRaw(editorState.getCurrentContent()))
  // ContentState.createFromText("请输入题目标题")
  // console.log(JSON.stringify(convertToRaw(editorState.getCurrentContent())));

  return (
    <div className={classNames(styles['editor-wrapper'], focusEditor && styles['focus'], className)}>
      <div className={styles['editor-container']}>
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
            onBlur={() => setFocusEditor(false)}
          />
        </div>
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