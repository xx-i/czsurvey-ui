import styles from './style/index.module.less'
import { Empty, Tabs, Typography } from '@arco-design/web-react';
const TabPane = Tabs.TabPane;
const style = {
  textAlign: 'center',
  marginTop: 20,
};

function SettingPanel() {
  return (
    <div className={styles['setting-panel']}>
      <Tabs defaultActiveTab='1' className={styles['setting-tabs-container']}>
        <TabPane key='1' title='整卷设置'>
          <Typography.Paragraph style={style}>
            <Empty/>
          </Typography.Paragraph>
        </TabPane>
        <TabPane key='3' title='题目设置'>
          <Typography.Paragraph style={style}>
            <Empty/>
          </Typography.Paragraph>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default SettingPanel;