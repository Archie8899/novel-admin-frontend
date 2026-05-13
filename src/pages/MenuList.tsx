import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Form, Modal, Popconfirm, message, TreeSelect, Row, Col, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Menu {
  id: string;
  menuId: string;
  name: string;
  path: string;
  icon: string;
  component: string;
  parent: { id: string; name: string } | null;
  sort: number;
  type: string;
  typeDisplay: string;
  status: string;
  statusDisplay: string;
  children: Menu[];
}

const MenuList: React.FC = () => {
  const [data, setData] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Menu | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [menuOptions, setMenuOptions] = useState<any[]>([]);
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await apiRequest.get('/menus', params);
      setData(res.data || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取扁平化的菜单列表用于下拉选择
  const fetchMenuOptions = async () => {
    try {
      const res: any = await apiRequest.get('/menus/options');
      setMenuOptions(res.data || []);
    } catch (error) {
      console.error('Failed to fetch menu options:', error);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', sort: 0, type: 'menu' });
    setModalVisible(true);
  };

  const handleEdit = (record: Menu) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      path: record.path,
      icon: record.icon,
      component: record.component,
      parentId: record.parent?.id,
      sort: record.sort,
      type: record.type,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/menus/${id}`);
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
        await apiRequest.put(`/menus/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await apiRequest.post('/menus', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('提交失败:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 将扁平列表转换为TreeSelect需要的格式
  const convertToTreeSelectOptions = (menus: any[], excludeId?: string): any[] => {
    return menus
      .filter(m => m.id !== excludeId && m.type === 'menu')
      .map(m => ({
        value: m.id,
        title: m.name,
        children: m.children ? convertToTreeSelectOptions(m.children, excludeId) : undefined,
      }));
  };

  // 将树形数据扁平化用于表格展示
  const flattenData = (menus: Menu[], level = 0): (Menu & { level: number })[] => {
    const result: (Menu & { level: number })[] = [];
    menus.forEach(menu => {
      result.push({ ...menu, level });
      if (menu.children && menu.children.length > 0) {
        result.push(...flattenData(menu.children, level + 1));
      }
    });
    return result;
  };

  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Menu & { level: number }) => (
        <span style={{ paddingLeft: record.level * 20 }}>
          {record.level > 0 && '└ '}{name}
          {record.type === 'button' && <Tag color="orange" style={{ marginLeft: 8 }}>按钮</Tag>}
        </span>
      ),
    },
    { title: '菜单ID', dataIndex: 'menuId', key: 'menuId', width: 100 },
    { title: '路由路径', dataIndex: 'path', key: 'path', width: 150, render: (p: string) => p || '-' },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 100, render: (i: string) => i || '-' },
    { title: '组件', dataIndex: 'component', key: 'component', width: 150, render: (c: string) => c || '-' },
    { title: '上级菜单', dataIndex: ['parent', 'name'], key: 'parent', width: 120, render: (name: string) => name || '-' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
    { title: '类型', dataIndex: 'typeDisplay', key: 'type', width: 80 },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80, render: (s: string, r: Menu) => <Tag color={r.status === 'active' ? 'green' : 'red'}>{s}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Menu) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const flattenedData = flattenData(data);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>菜单管理</Title>
        <Space>
          <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
            <Option value="all">全部状态</Option>
            <Option value="active">正常</Option>
            <Option value="inactive">禁用</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { fetchMenuOptions(); handleAdd(); }}>新建菜单</Button>
        </Space>
      </div>

      <Table
        dataSource={flattenedData}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      {/* 新建/编辑菜单弹窗 */}
      <Modal
        title={editingRecord ? '编辑菜单' : '新建菜单'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="菜单名称"
                rules={[{ required: true, message: '请输入菜单名称' }]}
              >
                <Input placeholder="请输入菜单名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" initialValue="menu">
                <Select onChange={() => form.resetFields(['path', 'component', 'parentId'])}>
                  <Option value="menu">菜单</Option>
                  <Option value="button">按钮</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {form.getFieldValue('type') === 'menu' ? (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="path" label="路由路径" rules={[{ required: true, message: '请输入路由路径' }]}>
                    <Input placeholder="如：/users" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="component" label="组件路径">
                    <Input placeholder="如：pages/UserList" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="parentId" label="上级菜单">
                    <TreeSelect
                      placeholder="请选择上级菜单（不选则为顶级菜单）"
                      allowClear
                      treeData={convertToTreeSelectOptions(data, editingRecord?.id)}
                      treeDefaultExpandAll
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="icon" label="图标">
                    <Input placeholder="Ant Design图标名，如：UserOutlined" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <Form.Item
              name="parentId"
              label="所属菜单"
              rules={[{ required: true, message: '请选择所属菜单' }]}
            >
              <TreeSelect
                placeholder="请选择所属菜单"
                treeData={convertToTreeSelectOptions(data, editingRecord?.id)}
                treeDefaultExpandAll
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sort" label="排序" initialValue={0}>
                <Input type="number" placeholder="数值越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="inactive">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuList;
