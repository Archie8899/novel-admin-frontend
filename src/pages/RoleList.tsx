import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Form, Modal, Popconfirm, message, Tree, Row, Col, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Role {
  id: string;
  roleId: string;
  name: string;
  code: string;
  description: string;
  status: string;
  statusDisplay: string;
  menuCount: number;
  userCount: number;
  createdAt: string;
}

interface Menu {
  id: string;
  menuId: string;
  name: string;
  path: string;
  parentId: string | null;
  type: string;
  children?: Menu[];
}

const RoleList: React.FC = () => {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [menuOptions, setMenuOptions] = useState<Menu[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
    fetchMenuOptions();
  }, [pagination.current, pagination.pageSize, searchName, searchStatus]);

  const fetchMenuOptions = async () => {
    try {
      const res: any = await apiRequest.get('/menus');
      setMenuOptions(res.data || []);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await apiRequest.get('/roles', params);
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
    form.setFieldsValue({ status: 'active' });
    setSelectedMenus([]);
    setModalVisible(true);
  };

  const handleEdit = async (record: Role) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      status: record.status,
    });
    // 获取角色详情以获取权限
    try {
      const res: any = await apiRequest.get(`/roles/${record.id}`);
      setSelectedMenus(res.data?.menus?.map((m: any) => m.menuId) || []);
    } catch (error) {
      console.error('Failed to fetch role detail:', error);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/roles/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const submitData = {
        ...values,
        menus: selectedMenus.map(menuId => ({ menuId })),
      };

      if (editingRecord) {
        await apiRequest.put(`/roles/${editingRecord.id}`, submitData);
        message.success('更新成功');
      } else {
        await apiRequest.post('/roles', submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('提交失败:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMenuSelect = (checkedKeys: any) => {
    setSelectedMenus(checkedKeys);
  };

  // 将菜单列表转换为Tree数据
  const convertToTreeData = (menus: any[]): any[] => {
    return menus.map(menu => ({
      title: menu.name,
      key: menu.id,
      children: menu.children ? convertToTreeData(menu.children) : undefined,
    }));
  };

  const columns = [
    { title: '角色ID', dataIndex: 'roleId', key: 'roleId', width: 100 },
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色编码', dataIndex: 'code', key: 'code', width: 150 },
    { title: '描述', dataIndex: 'description', key: 'description', render: (d: string) => d || '-' },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80, render: (s: string, r: Role) => <Tag color={r.status === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Role) => (
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
        <Title level={3} style={{ margin: 0 }}>角色管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建角色</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="角色名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">正常</Option>
          <Option value="inactive">禁用</Option>
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

      {/* 新建/编辑角色弹窗 */}
      <Modal
        title={editingRecord ? '编辑角色' : '新建角色'}
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
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="角色编码"
                rules={[
                  { required: true, message: '请输入角色编码' },
                  { pattern: /^[A-Z_]+$/, message: '编码只能包含大写字母和下划线' },
                ]}
                extra="用于程序中权限判断，如：ADMIN, EDITOR"
              >
                <Input placeholder="如：ADMIN" disabled={!!editingRecord} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入角色描述" rows={2} />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="菜单权限"
            extra="勾选该角色可访问的菜单"
          >
            <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #d9d9d9', padding: 8, borderRadius: 4 }}>
              <Tree
                checkable
                checkedKeys={selectedMenus}
                onCheck={handleMenuSelect}
                treeData={convertToTreeData(menuOptions)}
                defaultExpandAll
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleList;
