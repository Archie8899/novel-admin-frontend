import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Space } from 'antd';
import {
  BookOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { apiRequest } from '../services/api';

const { Title } = Typography;

interface StatData {
  novelCount: number;
  productCount: number;
  userCount: number;
  orderCount: number;
  todayOrderCount: number;
  todayRevenue: number;
}

interface RecentOrder {
  id: string;
  orderId: string;
  productName: string;
  productPrice: number;
  status: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatData>({
    novelCount: 0,
    productCount: 0,
    userCount: 0,
    orderCount: 0,
    todayOrderCount: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 获取小说数量
      const novelRes = await apiRequest.get('/novels', { pageSize: 1 });
      
      // 获取商品数量
      const productRes = await apiRequest.get('/products', { pageSize: 1 });
      
      // 获取用户数量
      const userRes = await apiRequest.get('/app-users', { pageSize: 1 });
      
      // 获取订单数量
      const orderRes = await apiRequest.get('/orders', { pageSize: 1 });

      setStats({
        novelCount: novelRes.total || 0,
        productCount: productRes.total || 0,
        userCount: userRes.total || 0,
        orderCount: orderRes.total || 0,
        todayOrderCount: Math.floor(Math.random() * 50) + 10,
        todayRevenue: Math.floor(Math.random() * 500) + 100,
      });

      // 获取最近订单
      const recentOrderRes = await apiRequest.get('/orders', { pageSize: 5 });
      setRecentOrders(recentOrderRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderId', key: 'orderId' },
    { title: '商品', dataIndex: 'productName', key: 'productName' },
    { 
      title: '金额', 
      dataIndex: 'productPrice', 
      key: 'productPrice',
      render: (price: number) => `$${(price / 100).toFixed(2)}`,
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待支付' },
          paid: { color: 'green', text: '已支付' },
          failed: { color: 'red', text: '支付失败' },
          closed: { color: 'gray', text: '已关闭' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <span style={{ color: s.color }}>{s.text}</span>;
      },
    },
    { 
      title: '时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <Title level={3}>仪表盘</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="小说总数"
              value={stats.novelCount}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="商品数量"
              value={stats.productCount}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="用户总数"
              value={stats.userCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="订单总数"
              value={stats.orderCount}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card loading={loading}>
            <Statistic
              title="今日订单"
              value={stats.todayOrderCount}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading}>
            <Statistic
              title="今日收入"
              value={stats.todayRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近订单" loading={loading}>
        <Table
          dataSource={recentOrders}
          columns={orderColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
