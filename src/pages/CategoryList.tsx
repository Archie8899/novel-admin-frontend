import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, Modal, Popconfirm, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

interface Category {
  id: string;
  categoryId: string;
  name: string;
  chineseName: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

const CategoryList: React.FC = () => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const [searchCategoryId, setSearchCategoryId] = useState('');
  const [searchCategoryName, setSearchCategoryName] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchCategoryId, searchCategoryName, searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (searchCategoryId) params.categoryId = searchCategoryId;
      if (searchCategoryName) params.categoryName = searchCategoryName;
      if (searchStatus !== 'all') params.status = searchStatus;

      const res: any = await apiRequest.get('/categories', params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Category) => {
    setEditingCategory(record);
    form.setFieldsValue({
      categoryName: record.name,
      chineseName: record.chineseName,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/categories/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
      console.error('Failed to delete category:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await apiRequest.put(`/categories/${editingCategory.id}`, values);
        message.success('更新成功');
      } else {
        await apiRequest.post('/categories', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '提交失败');
      console.error('Failed to submit:', error);
    }
  };

  const handleReset = () => {
    setSearchCategoryId('');
    setSearchCategoryName('');
    setSearchStatus('all');
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const columns = [
    { title: '分类编号', dataIndex: 'categoryId', key: 'categoryId', width: 120 },
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '中文名称', dataIndex: 'chineseName', key: 'chineseName' },
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
      render: (_: any, record: Category) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该分类?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>分类管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建分类
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="分类编号"
          value={searchCategoryId}
          onChange={(e) => setSearchCategoryId(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Input
          placeholder="分类名称"
          value={searchCategoryName}
          onChange={(e) => setSearchCategoryName(e.target.value)}
          style={{ width: 150 }}
          allowClear
          prefix={<SearchOutlined />}
        />
        <Select
          value={searchStatus}
          onChange={(value) => setSearchStatus(value)}
          style={{ width: 120 }}
        >
          <Option value="all">全部</Option>
          <Option value="active">有效</Option>
          <Option value="inactive">无效</Option>
        </Select>
        <Button onClick={handleReset}>重置</Button>
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
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />

      <Modal
        title={editingCategory ? '编辑分类' : '新建分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="categoryName"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input maxLength={40} placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="chineseName"
            label="中文名称"
            rules={[{ required: true, message: '请输入中文名称' }]}
          >
            <Input maxLength={40} placeholder="请输入中文名称" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">有效</Option>
              <Option value="inactive">无效</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryList;
