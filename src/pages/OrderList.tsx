import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag } from 'antd';
import { apiRequest } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const OrderList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => { fetchData(); }, [pagination.current]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest.get('/orders', { page: pagination.current, pageSize: pagination.pageSize });
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) { console.error('Failed to fetch:', error); }
    finally { setLoading(false); }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待支付' },
    paid: { color: 'green', text: '已支付' },
    failed: { color: 'red', text: '支付失败' },
    closed: { color: 'gray', text: '已关闭' },
  };

  const columns = [
    { title: '订单编号', dataIndex: 'orderId', key: 'orderId', width: 150 },
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 150 },
    { title: '商品类型', dataIndex: 'productTypeDisplay', key: 'type', width: 80 },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '金额', dataIndex: 'productPrice', key: 'productPrice', width: 80 },
    { title: '支付方式', dataIndex: 'paymentMethod', key: 'payment', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>订单管理</Title>
        <Button>导出订单</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }) }} />
    </div>
  );
};

export default OrderList;
