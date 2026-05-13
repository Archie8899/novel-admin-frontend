import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Form, Modal, Popconfirm, message, Row, Col, InputNumber, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

interface Product {
  id: string;
  productId: string;
  name: string;
  type: string;
  typeDisplay: string;
  os: string;
  price: string;
  priceRaw: number;
  coins: number;
  subscriptionDuration: string;
  productIdExternal: string;
  status: string;
  statusDisplay: string;
  createdBy: string;
  createdAt: string;
  durationOrCoins?: string;
}

const ProductList: React.FC = () => {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchOs, setSearchOs] = useState('all');
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchName, searchType, searchOs, searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchType !== 'all') params.type = searchType;
      if (searchOs !== 'all') params.os = searchOs;
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await apiRequest.get('/products', params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
    finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'recharge',
      os: 'H5',
      status: 'active',
      isChargeable: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Product) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      os: record.os,
      price: record.priceRaw / 100,
      coins: record.coins,
      subscriptionDuration: record.subscriptionDuration,
      productIdExternal: record.productIdExternal,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/products/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      if (editingRecord) {
        await apiRequest.put(`/products/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await apiRequest.post('/products', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { title: '商品编号', dataIndex: 'productId', key: 'productId', width: 120 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'typeDisplay', key: 'typeDisplay', width: 80, render: (text: string, record: Product) => (
      <Tag color={record.type === 'recharge' ? 'blue' : 'purple'}>{text}</Tag>
    )},
    { title: '系统', dataIndex: 'os', key: 'os', width: 80 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 80 },
    { title: '规格', dataIndex: 'durationOrCoins', key: 'durationOrCoins', width: 100, render: (_text: string, record: Product) => {
      if (!record.durationOrCoins) {
        return record.type === 'recharge' 
          ? <span>{record.coins || 0}金币</span>
          : <span>{record.subscriptionDuration || '-'}</span>;
      }
      return <span>{record.durationOrCoins}</span>;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '有效' : '无效'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    { title: '操作', key: 'action', width: 150, render: (_: any, record: Product) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>商品管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建商品</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input 
          placeholder="商品名称" 
          value={searchName} 
          onChange={(e) => setSearchName(e.target.value)} 
          style={{ width: 150 }} 
          allowClear 
          prefix={<SearchOutlined />} 
        />
        <Select value={searchType} onChange={(v) => setSearchType(v)} style={{ width: 100 }}>
          <Option value="all">全部类型</Option>
          <Option value="recharge">充值</Option>
          <Option value="subscription">订阅</Option>
        </Select>
        <Select value={searchOs} onChange={(v) => setSearchOs(v)} style={{ width: 100 }}>
          <Option value="all">全部系统</Option>
          <Option value="H5">H5</Option>
          <Option value="iOS">iOS</Option>
          <Option value="Android">Android</Option>
        </Select>
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">有效</Option>
          <Option value="inactive">无效</Option>
        </Select>
        <Button onClick={() => { setSearchName(''); setSearchType('all'); setSearchOs('all'); setSearchStatus('all'); }}>重置</Button>
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

      <Modal
        title={editingRecord ? '编辑商品' : '新建商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input maxLength={40} placeholder="请输入商品名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="商品类型"
                rules={[{ required: true, message: '请选择商品类型' }]}
              >
                <Select placeholder="请选择商品类型">
                  <Option value="recharge">充值</Option>
                  <Option value="subscription">订阅</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="os"
                label="操作系统"
                rules={[{ required: true, message: '请选择操作系统' }]}
              >
                <Select placeholder="请选择操作系统">
                  <Option value="H5">H5</Option>
                  <Option value="iOS">iOS</Option>
                  <Option value="Android">Android</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'recharge' ? (
                <Form.Item
                  name="coins"
                  label="金币数量"
                  rules={[{ required: true, message: '请输入金币数量' }]}
                  extra="充值类商品需要填写金币数量"
                >
                  <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="请输入金币数量（1-9999）" />
                </Form.Item>
              ) : (
                <Form.Item
                  name="subscriptionDuration"
                  label="订阅时长"
                  rules={[{ required: true, message: '请选择订阅时长' }]}
                  extra="订阅类商品需要选择订阅时长"
                >
                  <Select placeholder="请选择订阅时长">
                    <Option value="1week">1周</Option>
                    <Option value="1month">1个月</Option>
                    <Option value="3months">3个月</Option>
                    <Option value="6months">6个月</Option>
                    <Option value="12months">12个月</Option>
                  </Select>
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber 
              min={0.01} 
              max={9999} 
              step={0.01} 
              style={{ width: '100%' }} 
              prefix="$"
              placeholder="请输入价格（$0.01-$9999）"
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.os !== currentValues.os}
          >
            {({ getFieldValue }) =>
              (getFieldValue('os') === 'iOS' || getFieldValue('os') === 'Android') ? (
                <Form.Item
                  name="productIdExternal"
                  label="应用商店商品ID"
                  rules={[{ required: true, message: '请输入应用商店商品ID' }]}
                  extra={`${getFieldValue('os')}平台需要填写App Store/Google Play的商品ID`}
                >
                  <Input placeholder="例如: com.example.product.monthly" />
                </Form.Item>
              ) : null
            }
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

export default ProductList;
