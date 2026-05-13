import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Typography, Tag, Form, Modal, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiRequest } from '../services/api';

const { Title } = Typography;

const ChannelList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest.get('/channels', { pageSize: 100 });
      setData(res.data || []);
    } catch (error: any) {
      message.error(error?.message || '加载数据失败');
      console.error('Failed to fetch:', error);
    }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) { await apiRequest.put(`/channels/${editingRecord.id}`, values); message.success('更新成功'); }
      else { await apiRequest.post('/channels', values); message.success('创建成功'); }
      setModalVisible(false); fetchData();
    } catch (error: any) {
      message.error(error?.message || '提交失败');
      console.error('Failed to submit:', error);
    }
  };

  const columns = [
    { title: '渠道编号', dataIndex: 'channelId', key: 'channelId', width: 120 },
    { title: '渠道名称', dataIndex: 'name', key: 'name' },
    { title: '渠道Secret', dataIndex: 'secret', key: 'secret' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    { title: '操作', key: 'action', width: 150, render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</Button>
        <Popconfirm title="确定删除?" onConfirm={async () => { await apiRequest.delete(`/channels/${record.id}`); message.success('删除成功'); fetchData(); }}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>渠道管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalVisible(true); }}>新建渠道</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} />
      <Modal title={editingRecord ? '编辑渠道' : '新建渠道'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="channelName" label="渠道名称" rules={[{ required: true }]}><Input maxLength={40} /></Form.Item>
          <Form.Item name="channelSecret" label="渠道Secret" rules={[{ required: true }]}><Input maxLength={80} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChannelList;
