import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, Modal, Popconfirm, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

interface CopyrightCompany {
  id: string;
  companyId: string;
  name: string;
  status: string;
  createdAt: string;
}

const CopyrightList: React.FC = () => {
  const [data, setData] = useState<CopyrightCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CopyrightCompany | null>(null);
  const [form] = Form.useForm();

  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchName, searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.companyName = searchName;
      if (searchStatus !== 'all') params.status = searchStatus;

      const res: any = await apiRequest.get('/copyright-companies', params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: CopyrightCompany) => {
    setEditingRecord(record);
    form.setFieldsValue({ companyName: record.name, status: record.status });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/copyright-companies/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await apiRequest.put(`/copyright-companies/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await apiRequest.post('/copyright-companies', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const handleReset = () => {
    setSearchName('');
    setSearchStatus('all');
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const columns = [
    { title: '公司编号', dataIndex: 'companyId', key: 'companyId', width: 120 },
    { title: '公司名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '有效' : '无效'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CopyrightCompany) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>版权方管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建版权方</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="公司名称" value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ width: 150 }} allowClear prefix={<SearchOutlined />} />
        <Select value={searchStatus} onChange={(value) => setSearchStatus(value)} style={{ width: 120 }}>
          <Option value="all">全部</Option>
          <Option value="active">有效</Option>
          <Option value="inactive">无效</Option>
        </Select>
        <Button onClick={handleReset}>重置</Button>
      </Space>

      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{
        ...pagination, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`,
        onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
      }} />

      <Modal title={editingRecord ? '编辑版权方' : '新建版权方'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} okText="确认" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="companyName" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input maxLength={40} placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select><Option value="active">有效</Option><Option value="inactive">无效</Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CopyrightList;
