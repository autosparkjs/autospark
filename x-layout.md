/grill-with-docs

参考ant.design 的Layout组件。实现 x-layout 指令

import React from 'react';
import { Flex, Layout } from 'antd';

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
textAlign: 'center',
color: '#fff',
height: 64,
paddingInline: 48,
lineHeight: '64px',
backgroundColor: '#4096ff',
};

const contentStyle: React.CSSProperties = {
textAlign: 'center',
minHeight: 120,
lineHeight: '120px',
color: '#fff',
backgroundColor: '#0958d9',
};

const siderStyle: React.CSSProperties = {
textAlign: 'center',
lineHeight: '120px',
color: '#fff',
backgroundColor: '#1677ff',
};

const footerStyle: React.CSSProperties = {
textAlign: 'center',
color: '#fff',
backgroundColor: '#4096ff',
};

const layoutStyle = {
borderRadius: 8,
overflow: 'hidden',
width: 'calc(50% - 8px)',
maxWidth: 'calc(50% - 8px)',
};

const App: React.FC = () => (
<Flex gap="medium" wrap>
<Layout style={layoutStyle}>
<Header style={headerStyle}>Header</Header>
<Content style={contentStyle}>Content</Content>
<Footer style={footerStyle}>Footer</Footer>
</Layout>

    <Layout style={layoutStyle}>
      <Header style={headerStyle}>Header</Header>
      <Layout>
        <Sider width="25%" style={siderStyle}>
          Sider
        </Sider>
        <Content style={contentStyle}>Content</Content>
      </Layout>
      <Footer style={footerStyle}>Footer</Footer>
    </Layout>

    <Layout style={layoutStyle}>
      <Header style={headerStyle}>Header</Header>
      <Layout>
        <Content style={contentStyle}>Content</Content>
        <Sider width="25%" style={siderStyle}>
          Sider
        </Sider>
      </Layout>
      <Footer style={footerStyle}>Footer</Footer>
    </Layout>

    <Layout style={layoutStyle}>
      <Sider width="25%" style={siderStyle}>
        Sider
      </Sider>
      <Layout>
        <Header style={headerStyle}>Header</Header>
        <Content style={contentStyle}>Content</Content>
        <Footer style={footerStyle}>Footer</Footer>
      </Layout>
    </Layout>

  </Flex>
);

export default App;

x-layout组件：

    <div x-layout >
      <div x-slot:header>Header</div>
      <div x-slot:content>Content</div>
      <div x-slot:sidebar.left>Left Sidebar</div>
      <div x-slot:sidebar.right>Right Sidebar</div>
      <div x-slot:footer>Footer</div>
    </div>

- 支持嵌套以形成复杂的布局

- x-layout-options={
  gap: number | padding // 间隔  
  }

- 是否显示取决是否具有对应的x-slot,如果有才显示，如果没有则不显示
- 对于x-layout内部非x-slot均忽略
-
