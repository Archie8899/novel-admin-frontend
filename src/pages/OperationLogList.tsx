import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Modal, Card, Descriptions, DatePicker, Drawer } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface OperationLog {
  id: string;
  userId: string;
  username: string;
  user: { id: string; name: string; email: string } | null;
  module: string;
  action: string;
  method: string;
  url: string;
  params: string;
  ip: string;
  userAgent: string;
  status: string;
  statusDisplay: string;
  errorMsg: string;
  createdAt: string;
}

interface LoginLog {
  id: string;
  userId: string;
  username: string;
  user: { id: string; name: string; email: string } | null;
  ip: string;
  userAgent: string;
  status: string;
  statusDisplay: string;
  message: string;
  createdAt: string;
}

const OperationLogList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('operation');
  const [operationData, setOperationData] = useState<any[]>([]);
  const [loginData, setLoginData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OperationLog | null>(null);

  const [searchUsername, setSearchUsername] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');
  const [dateRange, setDateRange] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'operation') {
      fetchOperationData();
    } else {
      fetchLoginData();
    }
  }, [pagination.current, pagination.pageSize, searchUsername, searchStatus, dateRange, activeTab]);

  const fetchOperationData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchUsername) params.username = searchUsername;
      if (searchStatus !== 'all') params.status = searchStatus;
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await apiRequest.get('/operation-logs', params);
      setOperationData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch operation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchUsername) params.username = searchUsername;
      if (searchStatus !== 'all') params.status = searchStatus;
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await apiRequest.get('/operation-logs/login', params);
      setLoginData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch login logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: OperationLog) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  // @ts-ignore
  const operationColumns: any[] = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '操作模块', dataIndex: 'module', key: 'module', width: 120 },
    { title: '操作动作', dataIndex: 'action', key: 'action', width: 100 },
    { title: '请求方法', dataIndex: 'method', key: 'method', width: 80, render: (m: string) => <Tag color={m === 'POST' ? 'green' : m === 'PUT' ? 'blue' : m === 'DELETE' ? 'red' : 'default'}>{m}</Tag> },
    { title: '请求URL', dataIndex: 'url', key: 'url', width: 200, ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 120 },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80, render: (s: string, r: any) => <Tag color={r.status === 'success' ? 'green' : 'red'}>{s}</Tag> },
    { title: '操作时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
      ),
    },
  ];

  const loginColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 120 },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80, render: (s: string, r: LoginLog) => <Tag color={r.status === 'success' ? 'green' : 'red'}>{s}</Tag> },
    { title: '消息', dataIndex: 'message', key: 'message', width: 150 },
    { title: 'User-Agent', dataIndex: 'userAgent', key: 'userAgent', width: 200, ellipsis: true },
    { title: '登录时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss') },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination({ current: 1, pageSize: 20, total: 0 });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>日志管理</Title>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type={activeTab === 'operation' ? 'primary' : 'default'} onClick={() => handleTabChange('operation')}>
            操作日志
          </Button>
          <Button type={activeTab === 'login' ? 'primary' : 'default'} onClick={() => handleTabChange('login')}>
            登录日志
          </Button>
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="用户名"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="success">成功</Option>
          <Option value="failed">失败</Option>
        </Select>
        <RangePicker onChange={(dates) => setDateRange(dates)} />
        <Button onClick={() => { setSearchUsername(''); setSearchStatus('all'); setDateRange(null); }}>重置</Button>
      </Space>

      <Table
        dataSource={activeTab === 'operation' ? operationData : loginData as any}
        columns={activeTab === 'operation' ? operationColumns : loginColumns as any}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />

      {/* 操作日志详情 */}
      <Drawer
        title="操作日志详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={600}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="用户名">{currentRecord.username}</Descriptions.Item>
            <Descriptions.Item label="操作模块">{currentRecord.module}</Descriptions.Item>
            <Descriptions.Item label="操作动作">{currentRecord.action}</Descriptions.Item>
            <Descriptions.Item label="请求方法">{currentRecord.method}</Descriptions.Item>
            <Descriptions.Item label="请求URL">{currentRecord.url}</Descriptions.Item>
            <Descriptions.Item label="请求参数">
              <pre style={{ maxHeight: 200, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
                {currentRecord.params || '-'}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentRecord.ip || '-'}</Descriptions.Item>
            <Descriptions.Item label="User-Agent">
              <div style={{ wordBreak: 'break-all' }}>{currentRecord.userAgent || '-'}</div>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentRecord.status === 'success' ? 'green' : 'red'}>
                {currentRecord.statusDisplay}
              </Tag>
            </Descriptions.Item>
            {currentRecord.errorMsg && (
              <Descriptions.Item label="错误信息">
                <span style={{ color: 'red' }}>{currentRecord.errorMsg}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="操作时间">{dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default OperationLogList;
