import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag } from 'antd';
import { apiRequest } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const UserList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => { fetchData(); }, [pagination.current]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest.get('/app-users', { page: pagination.current, pageSize: pagination.pageSize });
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) { console.error('Failed to fetch:', error); }
    finally { setLoading(false); }
  };

  const columns = [
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 150 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '系统', dataIndex: 'osDisplay', key: 'os', width: 80 },
    { title: '余额', dataIndex: 'coins', key: 'coins', width: 80 },
    { title: '订阅', dataIndex: 'isSubscribedDisplay', key: 'subscribed', width: 80, render: (s: string) => <Tag color={s === '已订阅' ? 'green' : 'default'}>{s}</Tag> },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80 },
    { title: '注册时间', dataIndex: 'registeredAt', key: 'registeredAt', width: 160 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>用户管理</Title>
        <Button>导出用户</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }) }} />
    </div>
  );
};

export default UserList;
