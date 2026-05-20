import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Typography, Tag, Form, Modal, Popconfirm,
  message, Input, Select, InputNumber, Transfer, Card, List, Avatar
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { homepageStrategyAPI, userSegmentAPI, columnAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface HomepageStrategy {
  id: string;
  strategyId: string;
  name: string;
  terminal: string;
  userSegmentId: string;
  userSegmentName: string;
  priority: number;
  status: string;
  statusDisplay: string;
  columnsCount: number;
  columns: any[];
  createdBy: string;
  createdAt: string;
}

const terminalOptions = [
  { value: 'app', label: 'App端' },
  { value: 'h5', label: 'H5端' },
];

const HomepageStrategyList: React.FC = () => {
  const [data, setData] = useState<HomepageStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HomepageStrategy | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 搜索相关
  const [searchName, setSearchName] = useState('');
  const [searchTerminal, setSearchTerminal] = useState('all');
  const [searchUserSegment, setSearchUserSegment] = useState('all');
  const [searchStatus, setSearchStatus] = useState('all');

  // 用户分层选项
  const [segmentOptions, setSegmentOptions] = useState<any[]>([]);
  const [segmentLoading, setSegmentLoading] = useState(false);

  // 栏目配置相关
  const [columnModalVisible, setColumnModalVisible] = useState(false);
  const [currentStrategyId, setCurrentStrategyId] = useState<string>('');
  const [availableColumns, setAvailableColumns] = useState<any[]>([]);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [columnConfigLoading, setColumnConfigLoading] = useState(false);
  
  // 新建/编辑时临时存储配置的栏目
  const [tempSelectedColumnIds, setTempSelectedColumnIds] = useState<string[]>([]);
  const [tempColumnModalVisible, setTempColumnModalVisible] = useState(false);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchTerminal !== 'all') params.terminal = searchTerminal;
      if (searchUserSegment !== 'all') params.userSegmentId = searchUserSegment;
      if (searchStatus !== 'all') params.status = searchStatus;

      const res: any = await homepageStrategyAPI.list(params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchName, searchTerminal, searchUserSegment, searchStatus]);

  // 获取用户分层选项
  const fetchSegmentOptions = async () => {
    setSegmentLoading(true);
    try {
      const res: any = await userSegmentAPI.getOptions();
      // API返回 { success: true, data: [...] }
      setSegmentOptions(Array.isArray(res) ? res : (res?.data || []));
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      setSegmentOptions([]);
    } finally {
      setSegmentLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      priority: 0,
    });
    setTempSelectedColumnIds([]); // 清空临时栏目配置
    setModalVisible(true);
  };

  const handleEdit = (record: HomepageStrategy) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      terminal: record.terminal,
      userSegmentId: record.userSegmentId,
      priority: record.priority,
      status: record.status,
    });
    // 加载已配置的栏目
    if (record.columns && record.columns.length > 0) {
      setTempSelectedColumnIds(record.columns.map((c: any) => c.columnId || c.id));
    } else {
      setTempSelectedColumnIds([]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await homepageStrategyAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
      console.error('删除失败:', error);
    }
  };

  const handlePreview = (record: HomepageStrategy) => {
    message.info(`预览功能待实现：${record.name}`);
  };

  // 打开新建/编辑时的栏目配置弹窗
  const handleOpenColumnConfig = async () => {
    try {
      const values = await form.validateFields(['terminal']);
      const terminal = values.terminal;
      
      if (!terminal) {
        message.warning('请先选择适用终端');
        return;
      }
      
      setTempColumnModalVisible(true);
      setColumnConfigLoading(true);
      setTempSelectedColumnIds(prev => [...prev]); // 保持当前的选中状态
      
      // 获取可用栏目列表
      const columnRes: any = await columnAPI.getOptions({
        terminal: terminal,
        language: 'en'
      });
      setAvailableColumns(Array.isArray(columnRes) ? columnRes : (columnRes?.data || []));
    } catch (error) {
      console.error('Failed to open column config:', error);
      message.error('请先填写完整表单（至少选择适用终端）');
    } finally {
      setColumnConfigLoading(false);
    }
  };

  // 保存临时栏目配置
  const handleSaveTempColumns = () => {
    setTempColumnModalVisible(false);
    message.success('栏目配置已保存');
  };

  // 临时栏目配置弹窗中的选择变化
  const handleTempColumnChange = (targetKeys: React.Key[]) => {
    setTempSelectedColumnIds(targetKeys as string[]);
  };

  // 配置栏目（编辑模式下从列表点击）
  const handleConfigColumns = async (record: HomepageStrategy) => {
    setCurrentStrategyId(record.id);
    setColumnModalVisible(true);
    setColumnConfigLoading(true);
    setSelectedColumnIds([]);

    try {
      // 获取可用栏目列表
      const columnRes: any = await columnAPI.getOptions({
        terminal: record.terminal,
        language: 'en'
      });
      setAvailableColumns(Array.isArray(columnRes) ? columnRes : (columnRes?.data || []));

      // 获取当前策略已配置的栏目
      const strategyRes: any = await homepageStrategyAPI.getOne(record.id);
      if (strategyRes?.columns) {
        setSelectedColumnIds(strategyRes.columns.map((c: any) => c.columnId || c.id));
      }
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      message.error('获取栏目列表失败');
    } finally {
      setColumnConfigLoading(false);
    }
  };

  const handleColumnChange = (targetKeys: React.Key[]) => {
    setSelectedColumnIds(targetKeys as string[]);
  };

  const handleSaveColumns = async () => {
    try {
      const columns = selectedColumnIds.map((columnId, index) => ({
        columnId,
        sort: index
      }));

      await homepageStrategyAPI.update(currentStrategyId, {
        columns
      });

      message.success('栏目配置保存成功');
      setColumnModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save columns:', error);
      message.error('保存失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const submitData: any = {
        name: values.name,
        terminal: values.terminal,
        userSegmentId: values.userSegmentId,
        priority: values.priority || 0,
        status: values.status,
      };

      let strategyId = editingRecord?.id || '';
      
      if (editingRecord) {
        await homepageStrategyAPI.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        const result: any = await homepageStrategyAPI.create(submitData);
        message.success('创建成功');
        strategyId = result?.data?.id || '';
      }
      
      // 保存栏目配置
      if (strategyId && tempSelectedColumnIds.length > 0) {
        const columns = tempSelectedColumnIds.map((columnId, index) => ({
          columnId,
          sort: index
        }));
        
        try {
          await homepageStrategyAPI.update(strategyId, { columns });
          message.success(`已保存${tempSelectedColumnIds.length}个栏目配置`);
        } catch (err) {
          console.error('Failed to save columns:', err);
          message.error('栏目配置保存失败');
        }
      }
      
      setModalVisible(false);
      setTempSelectedColumnIds([]); // 清空临时栏目配置
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
      message.error('提交失败，请检查表单');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { title: '策略ID', dataIndex: 'strategyId', key: 'strategyId', width: 120 },
    { title: '策略名称', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: '适用终端', dataIndex: 'terminal', key: 'terminal', width: 100,
      render: (terminal: string) => {
        const found = terminalOptions.find(o => o.value === terminal);
        return <Tag>{found ? found.label : terminal}</Tag>;
      }
    },
    { title: '用户分层', dataIndex: 'userSegmentName', key: 'userSegmentName', width: 150 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, sorter: (a: any, b: any) => a.priority - b.priority },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag> },
    { title: '栏目数', dataIndex: 'columnsCount', key: 'columnsCount', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_: any, record: HomepageStrategy) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleConfigColumns(record)}>
            配置栏目
          </Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此策略?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>首页管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建策略</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="策略名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select
          value={searchTerminal}
          onChange={(v) => setSearchTerminal(v)}
          style={{ width: 120 }}
          loading={segmentLoading}
        >
          <Option value="all">全部终端</Option>
          {terminalOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
        </Select>
        <Select
          value={searchUserSegment}
          onChange={(v) => setSearchUserSegment(v)}
          style={{ width: 150 }}
          loading={segmentLoading}
        >
          <Option value="all">全部分层</Option>
          {segmentOptions.map(opt => (
            <Option key={opt.id} value={opt.id}>{opt.name}</Option>
          ))}
        </Select>
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">启用</Option>
          <Option value="inactive">禁用</Option>
        </Select>
        <Button onClick={() => {
          setSearchName('');
          setSearchTerminal('all');
          setSearchUserSegment('all');
          setSearchStatus('all');
        }}>重置</Button>
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

      {/* 新建/编辑策略弹窗 */}
      <Modal
        title={editingRecord ? '编辑首页策略' : '新建首页策略'}
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
            label="策略名称"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input maxLength={40} placeholder="请输入策略名称" />
          </Form.Item>

          <Form.Item
            name="terminal"
            label="适用终端"
            rules={[{ required: true, message: '请选择终端' }]}
          >
            <Select
              placeholder="请选择终端"
              loading={segmentLoading}
            >
              {terminalOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="userSegmentId"
            label="用户分层"
            rules={[{ required: true, message: '请选择用户分层' }]}
          >
            <Select
              placeholder="请选择用户分层"
              loading={segmentLoading}
            >
              {segmentOptions.map(opt => (
                <Option key={opt.id} value={opt.id}>{opt.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            extra="数字越小优先级越高"
          >
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>

          {/* 栏目配置部分 */}
          <Form.Item label="栏目配置">
            <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8 }}>
              <Button 
                type="dashed" 
                onClick={handleOpenColumnConfig}
                icon={<SettingOutlined />}
                style={{ marginBottom: 16 }}
              >
                配置栏目
              </Button>
              
              {/* 显示已配置的栏目列表 */}
              {tempSelectedColumnIds.length > 0 && (
                <div>
                  <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
                    已配置的栏目（{tempSelectedColumnIds.length}个）
                  </div>
                  <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {tempSelectedColumnIds.map((columnId, index) => {
                      const col = availableColumns.find(c => (c.columnId || c.id) === columnId);
                      return (
                        <div key={columnId} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ marginRight: 8, color: '#999' }}>{index + 1}.</span>
                            <span style={{ fontWeight: 500 }}>{col ? (col.nameDisplay || col.name) : columnId}</span>
                          </div>
                          <Button 
                            type="link" 
                            danger 
                            size="small"
                            onClick={() => {
                              setTempSelectedColumnIds(prev => prev.filter(id => id !== columnId));
                            }}
                          >
                            移除
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 配置栏目弹窗 */}
      <Modal
        title="配置首页栏目"
        open={columnModalVisible}
        onOk={handleSaveColumns}
        onCancel={() => setColumnModalVisible(false)}
        confirmLoading={columnConfigLoading}
        okText="保存"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666' }}>选择该策略要展示的栏目（可拖拽调整顺序）</p>
        </div>

        <Transfer
          dataSource={availableColumns.map(col => ({
            key: col.id,
            title: col.nameDisplay || col.name,
            description: `ID: ${col.columnId}`,
          }))}
          targetKeys={selectedColumnIds}
          onChange={handleColumnChange}
          render={item => item.title || ''}
          titles={['可用栏目', '已选栏目']}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            (item.title || '').toLowerCase().includes(inputValue.toLowerCase())
          }
        />

        <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          说明：已选栏目的顺序即为在首页展示的顺序，可拖拽调整
        </div>
      </Modal>

      {/* 新建/编辑时的栏目配置弹窗 */}
      <Modal
        title="配置首页栏目"
        open={tempColumnModalVisible}
        onOk={handleSaveTempColumns}
        onCancel={() => setTempColumnModalVisible(false)}
        confirmLoading={columnConfigLoading}
        okText="保存"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666' }}>选择该策略要展示的栏目（可拖拽调整顺序）</p>
        </div>

        <Transfer
          dataSource={availableColumns.map(col => ({
            key: col.id,
            title: col.nameDisplay || col.name,
            description: `ID: ${col.columnId}`,
          }))}
          targetKeys={tempSelectedColumnIds}
          onChange={handleTempColumnChange}
          render={item => item.title || ''}
          titles={['可用栏目', '已选栏目']}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            (item.title || '').toLowerCase().includes(inputValue.toLowerCase())
          }
        />

        <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          说明：已选栏目的顺序即为在首页展示的顺序，可拖拽调整
        </div>
      </Modal>
    </div>
  );
};

export default HomepageStrategyList;
