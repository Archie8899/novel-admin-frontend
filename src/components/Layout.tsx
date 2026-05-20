import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  BookOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  PayCircleOutlined,
  GlobalOutlined,
  TagsOutlined,
  LinkOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyOutlined,
  ApartmentOutlined,
  MenuOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const LayoutPage: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/novels',
      icon: <BookOutlined />,
      label: '小说管理',
      children: [
        { key: '/categories', label: '分类管理' },
        { key: '/copyright', label: '版权方管理' },
        { key: '/novels', label: '小说列表' },
      ],
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '充值订阅',
      children: [
        { key: '/products', label: '商品管理' },
        { key: '/payment-walls', label: '支付墙配置' },
      ],
    },
    {
      key: '/landing-pages',
      icon: <GlobalOutlined />,
      label: '投放管理',
      children: [
        { key: '/landing-pages', label: '落地页配置' },
        { key: '/fb-auth', label: 'FB授权管理' },
      ],
    },
    {
      key: '/promo-codes',
      icon: <TagsOutlined />,
      label: '分销管理',
      children: [
        { key: '/promo-codes', label: '口令管理' },
        { key: '/channels', label: '渠道管理' },
      ],
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理',
    },
    {
      key: '/user-segments',
      icon: <SettingOutlined />,
      label: '运营管理',
      children: [
        { key: '/user-segments', label: '用户分层' },
        { key: '/pricing-tiers', label: '分层定价' },
        { key: '/columns', label: '栏目管理' },
        { key: '/homepage-strategies', label: '首页管理' },
      ],
    },
    {
      key: '/system',
      icon: <SafetyOutlined />,
      label: '系统管理',
      children: [
        { key: '/admin-users', label: '用户管理' },
        { key: '/roles', label: '角色管理' },
        { key: '/departments', label: '部门管理' },
        { key: '/menus', label: '菜单管理' },
        { key: '/operation-logs', label: '操作日志' },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleUserMenuClick = (e: { key: string }) => {
    if (e.key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'Novel' : 'Novel Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/novels', '/products', '/landing-pages', '/promo-codes', '/user-segments', '/system']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
              <span>{user?.name || user?.email}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: token.colorBgContainer, borderRadius: token.borderRadius }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutPage;
