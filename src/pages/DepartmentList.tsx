import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Form, Modal, Popconfirm, message, TreeSelect, Row, Col, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Department {
  id: string;
  deptId: string;
  name: string;
  parent: { id: string; name: string } | null;
  sort: number;
  status: string;
  statusDisplay: string;
  userCount: number;
  children: Department[];
}

const DepartmentList: React.FC = () => {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deptOptions, setDeptOptions] = useState<any[]>([]);
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await apiRequest.get('/departments', params);
      setData(res.data || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取扁平化的部门列表用于下拉选择
  const fetchDeptOptions = async () => {
    try {
      const res: any = await apiRequest.get('/departments/options');
      setDeptOptions(res.data || []);
    } catch (error) {
      console.error('Failed to fetch dept options:', error);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', sort: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: Department) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      parentId: record.parent?.id,
      sort: record.sort,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/departments/${id}`);
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
        await apiRequest.put(`/departments/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await apiRequest.post('/departments', values);
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
  const convertToTreeSelectOptions = (depts: any[], excludeId?: string): any[] => {
    return depts
      .filter(d => d.id !== excludeId)
      .map(d => ({
        value: d.id,
        title: d.name,
        children: d.children ? convertToTreeSelectOptions(d.children, excludeId) : undefined,
      }));
  };

  // 将树形数据扁平化用于表格展示
  const flattenData = (depts: Department[], level = 0): (Department & { level: number })[] => {
    const result: (Department & { level: number })[] = [];
    depts.forEach(dept => {
      result.push({ ...dept, level });
      if (dept.children && dept.children.length > 0) {
        result.push(...flattenData(dept.children, level + 1));
      }
    });
    return result;
  };

  const columns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Department & { level: number }) => (
        <span style={{ paddingLeft: record.level * 20 }}>
          {record.level > 0 && '└ '}{name}
        </span>
      ),
    },
    { title: '部门ID', dataIndex: 'deptId', key: 'deptId', width: 100 },
    { title: '上级部门', dataIndex: ['parent', 'name'], key: 'parent', width: 120, render: (name: string) => name || '-' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 80 },
    { title: '状态', dataIndex: 'statusDisplay', key: 'status', width: 80, render: (s: string, r: Department) => <Tag color={r.status === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Department) => (
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
        <Title level={3} style={{ margin: 0 }}>部门管理</Title>
        <Space>
          <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
            <Option value="all">全部状态</Option>
            <Option value="active">正常</Option>
            <Option value="inactive">禁用</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { fetchDeptOptions(); handleAdd(); }}>新建部门</Button>
        </Space>
      </div>

      <Alert
        message="部门管理说明"
        description="部门支持多级树形结构。删除部门时，该部门下不能有子部门和用户。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={flattenedData}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      {/* 新建/编辑部门弹窗 */}
      <Modal
        title={editingRecord ? '编辑部门' : '新建部门'}
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
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>

          <Form.Item name="parentId" label="上级部门">
            <TreeSelect
              placeholder="请选择上级部门（不选则为顶级部门）"
              allowClear
              treeData={convertToTreeSelectOptions(data, editingRecord?.id)}
              treeDefaultExpandAll
              style={{ width: '100%' }}
            />
          </Form.Item>

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

export default DepartmentList;
