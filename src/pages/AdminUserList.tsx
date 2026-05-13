import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Form, Modal, Popconfirm, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface AdminUser {
  id: string;
  userId: string;
  username: string;
  email: string;
  name: string;
  phone: string;
  dept: { id: string; name: string } | null;
  role: { id: string; name: string; code: string } | null;
  status: string;
  statusDisplay: string;
  lastLoginAt: string;
  createdAt: string;
}

const AdminUserList: React.FC = () => {
  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<AdminUser | null>(null);
  const [resetPwdForm] = Form.useForm();
  const [deptOptions, setDeptOptions] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<any[]>([]);

  const [searchUsername, setSearchUsername] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [pagination.current, pagination.pageSize, searchUsername, searchStatus]);

  const fetchOptions = async () => {
    try {
      const [deptRes, roleRes] = await Promise.all([
        apiRequest.get('/departments/options'),
        apiRequest.get('/roles/options'),
      ]);
      setDeptOptions(deptRes.data || []);
      setRoleOptions(roleRes.data || []);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchUsername) params.username = searchUsername;
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await apiRequest.get('/admin-users', params);
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
    setModalVisible(true);
  };

  const handleEdit = (record: AdminUser) => {
    setEditingRecord(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      name: record.name,
      phone: record.phone,
      deptId: record.dept?.id,
      roleId: record.role?.id,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/admin-users/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      if (editingRecord) {
        await apiRequest.put(`/admin-users/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await apiRequest.post('/admin-users', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '提交失败');
      console.error('提交失败:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResetPwd = (record: AdminUser) => {
    setResetPwdUser(record);
    resetPwdForm.resetFields();
    setResetPwdModalVisible(true);
  };

  const handleResetPwdSubmit = async () => {
    try {
      const values = await resetPwdForm.validateFields();
      await apiRequest.post(`/admin-users/${resetPwdUser!.id}/reset-password`, { password: values.password });
      message.success('密码重置成功');
      setResetPwdModalVisible(false);
    } catch (error: any) {
      message.error(error?.message || '操作失败');
      console.error('操作失败:', error);
    }
  };

  const columns = [
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 100 },
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, render: (name: string) => name || '-' },
    { title: '部门', dataIndex: ['dept', 'name'], key: 'dept', width: 100, render: (name: string) => name || '-' },
    { title: '角色', dataIndex: ['role', 'name'], key: 'role', width: 100, render: (name: string) => name ? <Tag color="blue">{name}</Tag> : '-' },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80, render: (s: string, r: AdminUser) => <Tag color={r.status === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: '最后登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 160, render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: AdminUser) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPwd(record)}>重置密码</Button>
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
        <Title level={3} style={{ margin: 0 }}>管理员用户</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建用户</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="用户名/邮箱"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">正常</Option>
          <Option value="inactive">禁用</Option>
        </Select>
        <Button onClick={() => { setSearchUsername(''); setSearchStatus('all'); }}>重置</Button>
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

      {/* 新建/编辑用户弹窗 */}
      <Modal
        title={editingRecord ? '编辑用户' : '新建用户'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label={editingRecord ? '新密码' : '密码'}
                rules={editingRecord ? [] : [{ required: true, message: '请输入密码' }]}
                extra={editingRecord ? '留空则不修改密码' : '至少6位字符'}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名">
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deptId" label="部门">
                <Select placeholder="请选择部门" allowClear>
                  {deptOptions.map((d: any) => (
                    <Option key={d.id} value={d.id}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roleId" label="角色">
                <Select placeholder="请选择角色" allowClear>
                  {roleOptions.map((r: any) => (
                    <Option key={r.id} value={r.id}>{r.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title="重置密码"
        open={resetPwdModalVisible}
        onOk={handleResetPwdSubmit}
        onCancel={() => setResetPwdModalVisible(false)}
        okText="确认"
        cancelText="取消"
        destroyOnClose
      >
        <p>将为用户 <strong>{resetPwdUser?.username}</strong> 重置密码</p>
        <Form form={resetPwdForm} layout="vertical">
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserList;
