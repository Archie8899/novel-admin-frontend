import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Typography, Tag, Switch } from 'antd';
import { apiRequest } from '../services/api';

const { Title } = Typography;

const PromoCodeList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => { fetchData(); }, [pagination.current]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest.get('/promo-codes', { page: pagination.current, pageSize: pagination.pageSize });
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) { console.error('Failed to fetch:', error); }
    finally { setLoading(false); }
  };

  const columns = [
    { title: '口令编号', dataIndex: 'codeId', key: 'codeId', width: 120 },
    { title: '小说', dataIndex: ['novel', 'name'], key: 'novel' },
    { title: '渠道名称', dataIndex: 'channelName', key: 'channelName', width: 120 },
    { title: '口令', dataIndex: 'code', key: 'code', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '有效' : '无效'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>口令管理</Title>
        <Space><Button type="primary">新建口令</Button><Button>导出口令</Button></Space>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }) }} />
    </div>
  );
};

export default PromoCodeList;
