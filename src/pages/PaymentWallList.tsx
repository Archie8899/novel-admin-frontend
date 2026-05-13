import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Tabs, Form, Modal, Popconfirm, message, Row, Col, InputNumber, Switch, Drawer, AutoComplete } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { apiRequest, paymentWallAPI, userSegmentAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface PaymentWall {
  id: string;
  paymentWallId: string;
  name: string;
  userSegment: { segmentId: string; name: string };
  sort: number;
  status: string;
  statusDisplay: string;
  productCount: number;
  createdBy: string;
  createdAt: string;
}

interface PaymentWallProduct {
  id: string;
  paymentWallId: string;
  sort: number;
  product: {
    id: string;
    productId: string;
    name: string;
    os: string;
    price: string;
    coins: number;
    subscriptionDuration: string;
  };
  bonusCoins: number;
  isDefaultSelected: boolean;
  showBadge: boolean;
  marketingText: string;
  subscriptionText: string;
  createdBy: string;
  createdAt: string;
}

interface ProductOption {
  id: string;
  name: string;
  os: string;
  price: number;
  coins: number;
  subscriptionDuration: string;
  type: string;
}

const PaymentWallList: React.FC = () => {
  const [data, setData] = useState<PaymentWall[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PaymentWall | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [userSegmentOptions, setUserSegmentOptions] = useState<any[]>([]);

  // 商品配置相关状态
  const [selectedPaymentWall, setSelectedPaymentWall] = useState<PaymentWall | null>(null);
  const [productDrawerVisible, setProductDrawerVisible] = useState(false);
  const [rechargeProductList, setRechargeProductList] = useState<PaymentWallProduct[]>([]);
  const [subscriptionProductList, setSubscriptionProductList] = useState<PaymentWallProduct[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PaymentWallProduct | null>(null);
  const [editingProductType, setEditingProductType] = useState<'recharge' | 'subscription'>('recharge');
  const [productForm] = Form.useForm();
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductOption | null>(null);
  const [productSearchOptions, setProductSearchOptions] = useState<{ value: string; label: any }[]>([]);

  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
    fetchUserSegmentOptions();
  }, [pagination.current, pagination.pageSize, searchName, searchStatus]);

  const fetchUserSegmentOptions = async () => {
    try {
      const res: any = await userSegmentAPI.getOptions();
      setUserSegmentOptions(res.data || []);
    } catch (error) {
      console.error('Failed to fetch user segment options:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await apiRequest.get('/payment-walls', params);
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
    form.setFieldsValue({ sort: 0, status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (record: PaymentWall) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      userSegmentId: record.userSegment?.segmentId,
      sort: record.sort,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await paymentWallAPI.delete(id);
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
        await paymentWallAPI.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await paymentWallAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('Failed to submit:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 打开商品配置
  const handleOpenProducts = async (record: PaymentWall) => {
    setSelectedPaymentWall(record);
    setProductDrawerVisible(true);
    await fetchAllProducts(record.id);
  };

  // 获取所有商品
  const fetchAllProducts = async (paymentWallId: string) => {
    setProductLoading(true);
    try {
      const [rechargeRes, subscriptionRes] = await Promise.all([
        paymentWallAPI.getProducts(paymentWallId, { type: 'recharge' }) as any,
        paymentWallAPI.getProducts(paymentWallId, { type: 'subscription' }) as any,
      ]);
      setRechargeProductList(rechargeRes.data || []);
      setSubscriptionProductList(subscriptionRes.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setProductLoading(false);
    }
  };

  // 加载可选商品
  const loadAvailableProducts = async (type: 'recharge' | 'subscription') => {
    try {
      const res: any = await apiRequest.get('/products/options', { type });
      setAvailableProducts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch available products:', error);
    }
  };

  // 打开新增商品弹窗
  const handleAddProduct = async (type: 'recharge' | 'subscription') => {
    setEditingProductType(type);
    await loadAvailableProducts(type);
    setEditingProduct(null);
    setSelectedProductDetail(null);
    productForm.resetFields();
    productForm.setFieldsValue({
      isDefaultSelected: false,
      showBadge: false,
      sort: 0,
    });
    setProductModalVisible(true);
  };

  // 打开编辑商品弹窗
  const handleEditProduct = (record: PaymentWallProduct, type: 'recharge' | 'subscription') => {
    setEditingProductType(type);
    setEditingProduct(record);
    setSelectedProductDetail(null);
    productForm.setFieldsValue({
      bonusCoins: record.bonusCoins,
      isDefaultSelected: record.isDefaultSelected,
      showBadge: record.showBadge,
      marketingText: record.marketingText,
      subscriptionText: record.subscriptionText,
      sort: record.sort,
    });
    setProductModalVisible(true);
  };

  // 选择商品
  const handleSelectProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProductDetail(product);
      productForm.setFieldsValue({
        productId: product.id,
        productName: product.name,
        productOs: product.os,
        productPrice: product.price,
        productCoins: product.coins,
        productDuration: product.subscriptionDuration,
      });
    }
  };

  // 处理商品搜索
  const handleProductSearch = (value: string) => {
    if (!value) {
      setProductSearchOptions([]);
      return;
    }
    const options = availableProducts
      .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
      .map(p => ({
        value: p.id,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{p.name}</span>
            <span style={{ color: '#999', fontSize: 12 }}>{p.os} | ${(p.price / 100).toFixed(2)}</span>
          </div>
        ),
      }));
    setProductSearchOptions(options);
  };

  // 提交商品配置
  const handleProductSubmit = async () => {
    if (!selectedPaymentWall) return;

    try {
      const values = await productForm.validateFields();
      setSubmitLoading(true);

      // 检查默认勾选
      if (values.isDefaultSelected) {
        const currentList = editingProductType === 'recharge' ? rechargeProductList : subscriptionProductList;
        const existingDefault = currentList.find(p => p.isDefaultSelected && p.id !== editingProduct?.id);
        if (existingDefault) {
          message.error('已有默认勾选商品，请先取消其他商品的默认勾选');
          setSubmitLoading(false);
          return;
        }
      }

      const submitData: any = {
        productId: values.productId,
        sort: values.sort,
        isDefaultSelected: values.isDefaultSelected,
        showBadge: values.showBadge,
        marketingText: values.marketingText || '',
        subscriptionText: values.subscriptionText || '',
      };

      if (editingProductType === 'recharge') {
        submitData.bonusCoins = values.bonusCoins || 0;
      }

      if (editingProduct) {
        await paymentWallAPI.updateProduct(selectedPaymentWall.id, editingProduct.id, submitData);
        message.success('更新成功');
      } else {
        await paymentWallAPI.createProduct(selectedPaymentWall.id, submitData);
        message.success('创建成功');
      }
      setProductModalVisible(false);
      fetchAllProducts(selectedPaymentWall.id);
    } catch (error) {
      console.error('Failed to submit product:', error);
      message.error('提交失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 删除商品配置
  const handleDeleteProduct = async (productConfigId: string) => {
    if (!selectedPaymentWall) return;

    try {
      await paymentWallAPI.deleteProduct(selectedPaymentWall.id, productConfigId);
      message.success('删除成功');
      fetchAllProducts(selectedPaymentWall.id);
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('删除失败:', error);
    }
  };

  // 主列表列定义
  const columns = [
    { title: '支付墙ID', dataIndex: 'paymentWallId', key: 'paymentWallId', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '用户分层', dataIndex: ['userSegment', 'name'], key: 'segment', width: 120, render: (name: string) => name || '-' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '商品数', dataIndex: 'productCount', key: 'productCount', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '有效' : '无效'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: PaymentWall) => (
        <Space>
          <Button type="link" size="small" icon={<ShoppingCartOutlined />} onClick={() => handleOpenProducts(record)}>商品配置</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 充值商品列表列定义
  const rechargeColumns = [
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
    { title: '商品名称', dataIndex: ['product', 'name'], key: 'productName', width: 150 },
    { title: '操作系统', dataIndex: ['product', 'os'], key: 'os', width: 80 },
    { title: '价格', dataIndex: ['product', 'price'], key: 'price', width: 80, render: (p: number) => `$${(p / 100).toFixed(2)}` },
    { title: '金币数量', dataIndex: ['product', 'coins'], key: 'coins', width: 80 },
    { title: '赠送数量', dataIndex: 'bonusCoins', key: 'bonusCoins', width: 80, render: (val: number) => val ? `+${val}` : '-' },
    { title: '默认勾选', dataIndex: 'isDefaultSelected', key: 'isDefaultSelected', width: 80, render: (val: boolean) => val ? <Tag color="gold">默认</Tag> : '-' },
    { title: '是否角标', dataIndex: 'showBadge', key: 'showBadge', width: 80, render: (val: boolean) => <Tag color={val ? 'blue' : 'default'}>{val ? '是' : '否'}</Tag> },
    { title: '营销文案', dataIndex: 'marketingText', key: 'marketingText', width: 100, render: (text: string) => text || '-' },
    { title: '创建用户', dataIndex: 'createdBy', key: 'createdBy', width: 100, render: (u: string) => u || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: PaymentWallProduct) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditProduct(record, 'recharge')}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDeleteProduct(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 订阅商品列表列定义
  const subscriptionColumns = [
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
    { title: '商品名称', dataIndex: ['product', 'name'], key: 'productName', width: 150 },
    { title: '操作系统', dataIndex: ['product', 'os'], key: 'os', width: 80 },
    { title: '价格', dataIndex: ['product', 'price'], key: 'price', width: 80, render: (p: number) => `$${(p / 100).toFixed(2)}` },
    { title: '订阅时长', dataIndex: ['product', 'subscriptionDuration'], key: 'duration', width: 100 },
    { title: '默认勾选', dataIndex: 'isDefaultSelected', key: 'isDefaultSelected', width: 80, render: (val: boolean) => val ? <Tag color="gold">默认</Tag> : '-' },
    { title: '是否角标', dataIndex: 'showBadge', key: 'showBadge', width: 80, render: (val: boolean) => <Tag color={val ? 'blue' : 'default'}>{val ? '是' : '否'}</Tag> },
    { title: '营销文案', dataIndex: 'subscriptionText', key: 'subscriptionText', width: 100, render: (text: string) => text || '-' },
    { title: '创建用户', dataIndex: 'createdBy', key: 'createdBy', width: 100, render: (u: string) => u || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: PaymentWallProduct) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditProduct(record, 'subscription')}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDeleteProduct(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>支付墙配置</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建支付墙</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="支付墙名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">有效</Option>
          <Option value="inactive">无效</Option>
        </Select>
        <Button onClick={() => { setSearchName(''); setSearchStatus('all'); }}>重置</Button>
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

      {/* 新建/编辑支付墙弹窗 */}
      <Modal
        title={editingRecord ? '编辑支付墙' : '新建支付墙'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="支付墙名称"
            rules={[{ required: true, message: '请输入支付墙名称' }]}
          >
            <Input maxLength={40} placeholder="请输入支付墙名称" />
          </Form.Item>

          <Form.Item
            name="userSegmentId"
            label="用户分层"
            rules={[{ required: true, message: '请选择用户分层' }]}
          >
            <Select placeholder="请选择用户分层" loading={userSegmentOptions.length === 0}>
              {userSegmentOptions.map((seg: any) => (
                <Option key={seg.id} value={seg.id}>{seg.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sort"
            label="排序"
            initialValue={0}
          >
            <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="请输入排序值（0-999）" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">有效</Option>
              <Option value="inactive">无效</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 商品配置抽屉 */}
      <Drawer
        title={`${selectedPaymentWall?.name || ''} - 商品配置`}
        open={productDrawerVisible}
        onClose={() => { setProductDrawerVisible(false); setSelectedPaymentWall(null); }}
        width={1000}
        destroyOnClose
      >
        <Tabs defaultActiveKey="recharge">
          <TabPane tab="充值商品" key="recharge">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddProduct('recharge')}>添加商品</Button>
            </div>
            <Table
              dataSource={rechargeProductList}
              columns={rechargeColumns}
              rowKey="id"
              loading={productLoading}
              pagination={false}
              size="small"
            />
          </TabPane>
          <TabPane tab="订阅商品" key="subscription">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddProduct('subscription')}>添加商品</Button>
            </div>
            <Table
              dataSource={subscriptionProductList}
              columns={subscriptionColumns}
              rowKey="id"
              loading={productLoading}
              pagination={false}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Drawer>

      {/* 添加/编辑商品配置弹窗 */}
      <Modal
        title={editingProduct ? '编辑商品配置' : `添加${editingProductType === 'recharge' ? '充值' : '订阅'}商品`}
        open={productModalVisible}
        onOk={handleProductSubmit}
        onCancel={() => setProductModalVisible(false)}
        confirmLoading={submitLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={600}
      >
        <Form form={productForm} layout="vertical">
          {!editingProduct && (
            <Form.Item
              name="productId"
              label="选择商品"
              rules={[{ required: true, message: '请选择商品' }]}
            >
              <AutoComplete
                style={{ width: '100%' }}
                options={productSearchOptions}
                onSearch={handleProductSearch}
                onSelect={handleSelectProduct}
                placeholder="输入商品名称搜索并选择"
                filterOption={false}
                notFoundContent="未找到匹配的商品"
              />
            </Form.Item>
          )}

          {/* 商品详情展示 */}
          {selectedProductDetail && (
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999' }}>商品名称</div>
                  <div>{selectedProductDetail.name}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999' }}>操作系统</div>
                  <div>{selectedProductDetail.os}</div>
                </Col>
                <Col span={12} style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: '#999' }}>价格</div>
                  <div>${(selectedProductDetail.price / 100).toFixed(2)}</div>
                </Col>
                {editingProductType === 'recharge' ? (
                  <Col span={12} style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>金币数量</div>
                    <div>{selectedProductDetail.coins}</div>
                  </Col>
                ) : (
                  <Col span={12} style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>订阅时长</div>
                    <div>{selectedProductDetail.subscriptionDuration}</div>
                  </Col>
                )}
              </Row>
            </div>
          )}

          {editingProductType === 'recharge' && (
            <Form.Item name="bonusCoins" label="赠送数量" extra="整数1-9999">
              <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="请输入赠送数量" />
            </Form.Item>
          )}

          {editingProductType === 'subscription' && (
            <Form.Item
              name="subscriptionText"
              label="订阅文本"
              rules={[{ required: true, message: '请输入订阅文本' }]}
              extra="最长10字符"
            >
              <Input maxLength={10} placeholder="如：最受欢迎" />
            </Form.Item>
          )}

          <Form.Item name="isDefaultSelected" label="默认勾选" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item name="showBadge" label="角标显示" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.showBadge !== currentValues.showBadge}>
            {({ getFieldValue }) =>
              getFieldValue('showBadge') ? (
                <Form.Item
                  name="marketingText"
                  label="营销文案"
                  rules={[{ required: true, message: '请输入营销文案' }]}
                  extra="角标开启时必填，最长10字符"
                >
                  <Input maxLength={10} placeholder="如：限时特惠" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="sort" label="排序" rules={[{ required: true, message: '请输入排序值' }]} extra="整数0-999">
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentWallList;
