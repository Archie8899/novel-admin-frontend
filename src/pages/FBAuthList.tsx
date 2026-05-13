import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Tag, message, Alert } from 'antd';
import { LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface FBAuthorization {
  id: string;
  userId: string;
  tokenExpiry: string;
  adAccounts: string;
  createdBy?: string;
  createdByUser?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

const FBAuthList: React.FC = () => {
  const [data, setData] = useState<FBAuthorization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiRequest.get('/fb-authorizations', {
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      // API返回结构: { success, data: { data: [], total, page, pageSize } }
      const resultData = res.data?.data || res.data || [];
      const resultTotal = res.data?.total || 0;
      setData(resultData);
      setPagination((prev) => ({ ...prev, total: resultTotal }));
    } catch (error: any) {
      message.error(error?.message || '加载数据失败');
      console.error('Failed to fetch:', error);
      setError('加载数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    // 跳转至FB账号授权登录页面（新窗口打开）
    // 使用当前域名的后端端口
    const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
    window.open(`${apiBaseUrl}/api/fb-authorizations/facebook`, '_blank');
  };

  const handleRetry = () => {
    fetchData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => id.slice(0, 8) },
    { title: '用户ID(FB)', dataIndex: 'userId', key: 'userId', width: 150 },
    {
      title: 'Token有效期',
      dataIndex: 'tokenExpiry',
      key: 'tokenExpiry',
      width: 180,
      render: (date: string) => {
        const expiry = dayjs(date);
        const now = dayjs();
        const isExpired = expiry.isBefore(now);
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
            {expiry.format('YYYY-MM-DD HH:mm')}
            {isExpired && <Tag color="red" style={{ marginLeft: 8 }}>已过期</Tag>}
          </span>
        );
      },
    },
    {
      title: '广告账号列表',
      dataIndex: 'adAccounts',
      key: 'adAccounts',
      render: (accounts: string) => {
        try {
          const parsed = JSON.parse(accounts);
          if (Array.isArray(parsed)) {
            return (
              <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                {parsed.map((acc: any, idx: number) => (
                  <div key={idx} style={{ fontSize: 12, padding: '2px 0' }}>
                    {acc.name || acc.id} ({acc.id})
                  </div>
                ))}
              </div>
            );
          }
        } catch (e) {
          // 如果不是JSON，直接显示
        }
        return <span style={{ fontSize: 12 }}>{accounts}</span>;
      },
    },
    {
      title: '最后操作用户',
      key: 'createdByUser',
      width: 120,
      render: (_: any, record: FBAuthorization) => record.createdByUser?.name || record.createdByUser?.email || '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>FB授权管理</Title>
        <Button type="primary" icon={<LinkOutlined />} onClick={handleAdd}>新建授权</Button>
      </div>

      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={handleRetry}>
              重试
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: loading ? '加载中...' : '暂无数据' }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />
    </div>
  );
};

export default FBAuthList;
