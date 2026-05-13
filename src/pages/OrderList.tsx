import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrderList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // 搜索筛选状态
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchStatus, setSearchStatus] = useState<string | undefined>();
  const [searchPaymentMethod, setSearchPaymentMethod] = useState<string | undefined>();
  const [searchTimeRange, setSearchTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待支付' },
    paid: { color: 'green', text: '已支付' },
    failed: { color: 'red', text: '支付失败' },
    closed: { color: 'gray', text: '已关闭' },
  };

  const paymentMethodMap: Record<string, string> = {
    paypal: 'PayPal',
    stripe: 'Stripe',
    apple: 'Apple Pay',
    google: 'Google Pay',
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchOrderId, searchUserId, searchProductName, searchStatus, searchPaymentMethod, searchTimeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchOrderId) params.orderId = searchOrderId;
      if (searchUserId) params.userId = searchUserId;
      if (searchProductName) params.productName = searchProductName;
      if (searchStatus) params.status = searchStatus;
      if (searchPaymentMethod) params.paymentMethod = searchPaymentMethod;
      if (searchTimeRange) {
        params.startDate = searchTimeRange[0].format('YYYY-MM-DD');
        params.endDate = searchTimeRange[1].format('YYYY-MM-DD');
      }
      const res: any = await apiRequest.get('/orders', params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) { 
      console.error('Failed to fetch:', error); 
    }
    finally { setLoading(false); }
  };

  const resetFilters = () => {
    setSearchOrderId('');
    setSearchUserId('');
    setSearchProductName('');
    setSearchStatus(undefined);
    setSearchPaymentMethod(undefined);
    setSearchTimeRange(null);
  };

  const columns = [
    { title: '订单编号', dataIndex: 'orderId', key: 'orderId', width: 150 },
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 150 },
    { title: '商品类型', dataIndex: 'productTypeDisplay', key: 'type', width: 80 },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '金额', dataIndex: 'productPrice', key: 'productPrice', width: 80 },
    { title: '支付方式', dataIndex: 'paymentMethod', key: 'payment', width: 100, render: (v: string) => paymentMethodMap[v] || v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>订单管理</Title>
        <Button>导出订单</Button>
      </div>

      {/* 搜索筛选区域 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input 
          placeholder="订单编号" 
          value={searchOrderId} 
          onChange={(e) => setSearchOrderId(e.target.value)} 
          style={{ width: 150 }} 
          allowClear 
          prefix={<SearchOutlined />} 
        />
        <Input 
          placeholder="用户ID" 
          value={searchUserId} 
          onChange={(e) => setSearchUserId(e.target.value)} 
          style={{ width: 150 }} 
          allowClear 
        />
        <Input 
          placeholder="商品名称" 
          value={searchProductName} 
          onChange={(e) => setSearchProductName(e.target.value)} 
          style={{ width: 140 }} 
          allowClear 
        />
        <Select 
          placeholder="支付状态" 
          value={searchStatus} 
          onChange={(v) => setSearchStatus(v)} 
          style={{ width: 110 }}
          allowClear
        >
          <Option value="pending">待支付</Option>
          <Option value="paid">已支付</Option>
          <Option value="failed">支付失败</Option>
          <Option value="closed">已关闭</Option>
        </Select>
        <Select 
          placeholder="支付方式" 
          value={searchPaymentMethod} 
          onChange={(v) => setSearchPaymentMethod(v)} 
          style={{ width: 120 }}
          allowClear
        >
          <Option value="paypal">PayPal</Option>
          <Option value="stripe">Stripe</Option>
          <Option value="apple">Apple Pay</Option>
          <Option value="google">Google Pay</Option>
        </Select>
        <RangePicker 
          value={searchTimeRange}
          onChange={(dates) => setSearchTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          style={{ width: 240 }}
        />
        <Button onClick={resetFilters}>重置</Button>
      </Space>

      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
        pagination={{ 
          ...pagination, 
          showSizeChanger: true, 
          showTotal: (total) => `共 ${total} 条`, 
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }) 
        }} 
      />
    </div>
  );
};

export default OrderList;
