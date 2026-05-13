import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Divider,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { pricingTierAPI, userSegmentAPI, novelAPI } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Title } = Typography;

// ============ 类型定义 ============
interface PricingTier {
  id: string;
  pricingTierId: string;
  name: string;
  userSegment: {
    id?: string;
    segmentId: string;
    name: string;
  };
  defaultChapterPrice: number;
  sort: number;
  status: string;
  createdBy?: string;
  createdAt: string;
}

interface NovelConfig {
  id: string;
  novelId: string;
  novel?: {
    novelId: string;
    name: string;
    chineseName?: string;
  };
  uniformChapterPrice: number;
  ranges: PricingTierNovelRange[];
  createdBy?: string;
  createdAt: string;
}

interface PricingTierNovelRange {
  id?: string;
  startChapter: number;
  endChapter: number;
  price: number;
}

interface UserSegment {
  id: string;
  segmentId: string;
  name: string;
}

interface Novel {
  id: string;
  novelId: string;
  name: string;
  chineseName?: string;
}

// ============ 主组件 ============
const PricingTierList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PricingTier[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  
  // 搜索条件
  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // 分层定价弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PricingTier | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();
  
  // 用户分层选择弹窗
  const [segmentModalVisible, setSegmentModalVisible] = useState(false);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<UserSegment | null>(null);

  // 小说配置弹窗状态
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [currentTier, setCurrentTier] = useState<PricingTier | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configData, setConfigData] = useState<NovelConfig[]>([]);
  const [configPagination, setConfigPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  
  // 小说配置搜索
  const [configSearchId, setConfigSearchId] = useState('');
  const [configSearchName, setConfigSearchName] = useState('');

  // 新建/编辑小说配置弹窗
  const [novelConfigModalVisible, setNovelConfigModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NovelConfig | null>(null);
  const [configForm] = Form.useForm();
  const [novelModalVisible, setNovelModalVisible] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [novelLoading, setNovelLoading] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [ranges, setRanges] = useState<PricingTierNovelRange[]>([]);
  const [configSubmitLoading, setConfigSubmitLoading] = useState(false);

  // ============ 数据获取 ============
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (searchName) params.name = searchName;
      if (searchStatus !== 'all') params.status = searchStatus;
      if (dateRange) {
        params.startDate = dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = dateRange[1]?.format('YYYY-MM-DD');
      }

      const res: any = await pricingTierAPI.list(params);
      // 修正数据解析
      const resultData = res.data?.data || res.data || [];
      setData(resultData);
      setPagination((prev) => ({
        ...prev,
        total: res.data?.total || res.total || 0,
      }));
    } catch (error: any) {
      message.error(error?.message || '加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSegments = async () => {
    try {
      const res: any = await userSegmentAPI.getOptions();
      const segments = (res.data || []).map((s: any) => ({
        id: s.id,
        segmentId: s.segmentId,
        name: s.name,
      }));
      setUserSegments(segments);
    } catch (error) {
      console.error('获取用户分层列表失败:', error);
    }
  };

  // ============ 搜索处理 ============
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setSearchName('');
    setSearchStatus('all');
    setDateRange(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  // ============ 分层定价弹窗 ============
  const openModal = (record?: PricingTier) => {
    fetchUserSegments();
    if (record) {
      setEditingRecord(record);
      setSelectedSegment({
        id: record.userSegment?.id || '',
        segmentId: record.userSegment?.segmentId || '',
        name: record.userSegment?.name || '',
      });
      form.setFieldsValue({
        name: record.name,
        defaultChapterPrice: record.defaultChapterPrice,
        sort: record.sort,
        status: record.status,
      });
    } else {
      setEditingRecord(null);
      setSelectedSegment(null);
      form.resetFields();
      form.setFieldsValue({
        sort: 0,
        status: 'active',
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      // 先触发表单验证
      const values = await form.validateFields();
      
      // 业务逻辑验证
      if (!selectedSegment) {
        message.error('请选择用户分层');
        return;
      }
      
      setSubmitLoading(true);
      const submitData = {
        ...values,
        userSegmentId: selectedSegment.id,  // 使用 id 而不是 segmentId
      };

      if (editingRecord) {
        await pricingTierAPI.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await pricingTierAPI.create(submitData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      // 在 catch 中也显示错误消息，确保用户能看到
      const errorMsg = error?.message || '操作失败';
      if (errorMsg && errorMsg !== '操作失败') {
        message.error(errorMsg);
      }
      console.error('提交失败:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 删除分层定价
  const handleDelete = async (id: string) => {
    try {
      await pricingTierAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
      console.error('删除失败:', error);
    }
  };

  // 打开用户分层选择弹窗
  const openSegmentModal = () => {
    setSegmentModalVisible(true);
  };

  // 选择用户分层
  const selectSegment = (segment: UserSegment) => {
    setSelectedSegment(segment);
    setSegmentModalVisible(false);
  };

  // 删除已选用户分层
  const removeSegment = () => {
    setSelectedSegment(null);
  };

  // ============ 小说配置弹窗 ============
  const openConfigModal = async (record: PricingTier) => {
    setCurrentTier(record);
    setConfigSearchId('');
    setConfigSearchName('');
    setConfigPagination({ current: 1, pageSize: 20, total: 0 });
    await fetchConfigData(record.id);
    setConfigModalVisible(true);
  };

  const fetchConfigData = async (tierId: string, novelId?: string, novelName?: string) => {
    setConfigLoading(true);
    try {
      const res: any = await pricingTierAPI.getNovelConfigs(tierId, {
        novelId,
        novelName,
        page: configPagination.current,
        pageSize: configPagination.pageSize,
      });
      const resultData = res.data?.data || res.data || [];
      setConfigData(resultData);
      setConfigPagination((prev) => ({
        ...prev,
        total: res.data?.total || res.total || 0,
      }));
    } catch (error: any) {
      message.error(error?.message || '加载数据失败');
      console.error('加载小说配置失败:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleConfigSearch = () => {
    if (currentTier) {
      setConfigPagination((prev) => ({ ...prev, current: 1 }));
      fetchConfigData(currentTier.id, configSearchId, configSearchName);
    }
  };

  const handleConfigReset = () => {
    setConfigSearchId('');
    setConfigSearchName('');
    if (currentTier) {
      setConfigPagination((prev) => ({ ...prev, current: 1 }));
      fetchConfigData(currentTier.id);
    }
  };

  // 删除小说配置
  const handleDeleteConfig = async (configId: string) => {
    if (!currentTier) return;
    try {
      await pricingTierAPI.deleteNovelConfig(currentTier.id, configId);
      message.success('删除成功');
      fetchConfigData(currentTier.id, configSearchId, configSearchName);
    } catch (error: any) {
      message.error(error?.message || '删除失败');
      console.error('删除失败:', error);
    }
  };

  // ============ 小说配置编辑弹窗 ============
  const openNovelConfigModal = (config?: NovelConfig) => {
    if (config) {
      setEditingConfig(config);
      setSelectedNovel({
        id: config.novelId,
        novelId: config.novel?.novelId || '',
        name: config.novel?.name || config.novel?.chineseName || '',
        chineseName: config.novel?.chineseName || '',
      });
      configForm.setFieldsValue({
        uniformChapterPrice: config.uniformChapterPrice,
      });
      setRanges(config.ranges || []);
    } else {
      setEditingConfig(null);
      setSelectedNovel(null);
      configForm.resetFields();
      configForm.setFieldsValue({ uniformChapterPrice: 1 });
      setRanges([]);
    }
    setNovelConfigModalVisible(true);
  };

  // 打开小说选择弹窗
  const openNovelModal = () => {
    setNovelModalVisible(true);
    fetchNovels();
  };

  const fetchNovels = async (name?: string) => {
    setNovelLoading(true);
    try {
      const res: any = await novelAPI.getOptions();
      let novels = res.data || [];
      if (name) {
        novels = novels.filter((n: any) => 
          n.name.toLowerCase().includes(name.toLowerCase()) ||
          n.chineseName?.toLowerCase().includes(name.toLowerCase())
        );
      }
      setNovels(novels);
    } catch (error) {
      console.error('获取小说列表失败:', error);
    } finally {
      setNovelLoading(false);
    }
  };

  const selectNovel = (novel: Novel) => {
    setSelectedNovel(novel);
    setNovelModalVisible(false);
  };

  // 添加范围定价组
  const addRange = () => {
    if (ranges.length >= 5) {
      message.warning('最大支持5条配置');
      return;
    }
    setRanges([...ranges, { startChapter: 1, endChapter: 10, price: 1 }]);
  };

  // 删除范围定价组
  const removeRange = (index: number) => {
    const newRanges = [...ranges];
    newRanges.splice(index, 1);
    setRanges(newRanges);
  };

  // 更新范围定价
  const updateRange = (index: number, field: keyof PricingTierNovelRange, value: number) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setRanges(newRanges);
  };

  // 校验范围定价
  const validateRanges = (): boolean => {
    // 检查必填
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!r.startChapter || !r.endChapter || !r.price) {
        message.error('范围定价所有字段均为必填');
        return false;
      }
      if (r.startChapter < 1 || r.startChapter > 99) {
        message.error('起始章节必须在1-99之间');
        return false;
      }
      if (r.endChapter < 1 || r.endChapter > 99) {
        message.error('结束章节必须在1-99之间');
        return false;
      }
      if (r.endChapter <= r.startChapter) {
        message.error('结束章节必须大于起始章节');
        return false;
      }
      if (r.price < 1 || r.price > 9999) {
        message.error('范围定价价格必须在1-9999之间');
        return false;
      }
    }

    // 检查重复
    const rangesStr = ranges.map(r => `${r.startChapter}-${r.endChapter}`);
    const uniqueStr = [...new Set(rangesStr)];
    if (rangesStr.length !== uniqueStr.length) {
      message.error('范围定价重复，请重新输入');
      return false;
    }

    return true;
  };

  // 提交小说配置
  const handleSubmitNovelConfig = async () => {
    if (!currentTier || !selectedNovel) {
      message.error('请选择小说');
      return;
    }

    try {
      const values = await configForm.validateFields();
      
      // 校验统一定价
      if (!values.uniformChapterPrice || values.uniformChapterPrice < 1 || values.uniformChapterPrice > 9999) {
        message.error('章节价格必须在1-9999之间');
        return;
      }

      // 校验范围定价
      if (!validateRanges()) {
        return;
      }

      setConfigSubmitLoading(true);
      
      const submitData = {
        selectNovel: selectedNovel.id,
        uniformChapterPrice: values.uniformChapterPrice,
        ranges: ranges.length > 0 ? ranges : undefined,
      };

      if (editingConfig) {
        await pricingTierAPI.updateNovelConfig(currentTier.id, editingConfig.id, submitData);
        message.success('更新成功');
      } else {
        await pricingTierAPI.createNovelConfig(currentTier.id, submitData);
        message.success('创建成功');
      }

      setNovelConfigModalVisible(false);
      fetchConfigData(currentTier.id, configSearchId, configSearchName);
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error?.message || '提交失败');
      console.error('提交失败:', error);
    } finally {
      setConfigSubmitLoading(false);
    }
  };

  // ============ 表格列 ============
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 100,
      render: (id: string) => id.slice(0, 8),
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '用户分层',
      dataIndex: 'userSegment',
      width: 120,
      render: (segment: any) => segment?.name || '-',
    },
    {
      title: '章节价格',
      dataIndex: 'defaultChapterPrice',
      width: 100,
      render: (price: number) => `${price} 分`,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '有效' : '无效'}
        </Tag>
      ),
    },
    {
      title: '创建用户',
      dataIndex: 'createdBy',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: PricingTier) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => openConfigModal(record)}
          >
            小说配置
          </Button>
        </Space>
      ),
    },
  ];

  // 小说配置表格列
  const configColumns = [
    {
      title: '小说编号',
      dataIndex: ['novel', 'novelId'],
      width: 120,
      render: (novelId: string) => novelId || '-',
    },
    {
      title: '小说名称',
      dataIndex: ['novel', 'name'],
      width: 150,
      render: (name: string, record: NovelConfig) => 
        record.novel?.chineseName || name || '-',
    },
    {
      title: '付费章节',
      dataIndex: 'uniformChapterPrice',
      width: 100,
      render: (price: number) => `${price} 分`,
    },
    {
      title: '范围定价章节',
      dataIndex: 'ranges',
      width: 120,
      render: (ranges: PricingTierNovelRange[]) => {
        if (!ranges || ranges.length === 0) return '-';
        return ranges.map(r => `${r.startChapter}-${r.endChapter}`).join(', ');
      },
    },
    {
      title: '范围定价价格',
      dataIndex: 'ranges',
      width: 120,
      render: (ranges: PricingTierNovelRange[]) => {
        if (!ranges || ranges.length === 0) return '-';
        return ranges.map(r => `${r.price}分`).join(', ');
      },
    },
    {
      title: '创建用户',
      dataIndex: 'createdBy',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: NovelConfig) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openNovelConfigModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此小说配置？"
            onConfirm={() => handleDeleteConfig(record.id)}
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

  // 用户分层表格列
  const segmentColumns = [
    { title: 'ID', dataIndex: 'id', width: 200, ellipsis: true },
    { title: '名称', dataIndex: 'name', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: UserSegment) => (
        <Button type="link" size="small" onClick={() => selectSegment(record)}>
          选择
        </Button>
      ),
    },
  ];

  // 小说表格列
  const novelColumns = [
    { title: '小说编号', dataIndex: 'novelId', width: 120 },
    { title: '小说名称', dataIndex: 'name', width: 150 },
    { title: '中文名称', dataIndex: 'chineseName', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Novel) => (
        <Button type="link" size="small" onClick={() => selectNovel(record)}>
          选择
        </Button>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>分层定价管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新建分层定价
        </Button>
      </div>

      {/* 搜索区域 */}
      <Space wrap size="middle" style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 200 }}
          allowClear
          onPressEnter={handleSearch}
        />
        <Select
          value={searchStatus}
          onChange={(value) => setSearchStatus(value)}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'active', label: '有效' },
            { value: 'inactive', label: '无效' },
          ]}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          placeholder={['开始日期', '结束日期']}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </Space>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
          },
        }}
      />

      {/* ============ 新建/编辑分层定价弹窗 ============ */}
      <Modal
        title={editingRecord ? '编辑分层定价' : '新建分层定价'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        okText="确定"
        cancelText="取消"
        width={520}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)} disabled={submitLoading}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            确定
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 40, message: '名称不能超过40个字符' },
            ]}
          >
            <Input placeholder="请输入分层定价名称" maxLength={40} />
          </Form.Item>

          <Form.Item label="用户分层">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={selectedSegment ? `${selectedSegment.id} - ${selectedSegment.name}` : ''}
                placeholder="请点击选择用户分层"
                readOnly
                style={{ flex: 1 }}
              />
              <Button onClick={openSegmentModal}>选择</Button>
              {selectedSegment && (
                <Button icon={<CloseOutlined />} onClick={removeSegment} />
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="defaultChapterPrice"
            label="章节价格"
            rules={[
              { required: true, message: '请输入章节价格' },
              { type: 'number', min: 1, max: 9999, message: '章节价格必须在1-9999之间' },
            ]}
          >
            <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="请输入章节价格（1-9999）" />
          </Form.Item>

          <Form.Item
            name="sort"
            label="排序"
            rules={[
              { required: true, message: '请输入排序值' },
              { type: 'number', min: 0, max: 999, message: '排序值必须在0-999之间' },
            ]}
          >
            <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="越小优先级越高（0-999）" />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 'active', label: '有效' },
                { value: 'inactive', label: '无效' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ 用户分层选择弹窗 ============ */}
      <Modal
        title="选择用户分层"
        open={segmentModalVisible}
        onCancel={() => setSegmentModalVisible(false)}
        footer={null}
        width={500}
      >
        <Table
          dataSource={userSegments}
          columns={segmentColumns}
          rowKey="id"
          loading={segmentLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>

      {/* ============ 小说配置弹窗 ============ */}
      <Modal
        title={`小说配置 - ${currentTier?.name || ''}`}
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setConfigModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openNovelConfigModal()}
          >
            新建小说配置
          </Button>,
        ]}
      >
        {/* 搜索 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap size="middle">
            <Input
              placeholder="小说编号(精确)"
              value={configSearchId}
              onChange={(e) => setConfigSearchId(e.target.value)}
              style={{ width: 150 }}
              allowClear
            />
            <Input
              placeholder="小说名称(模糊)"
              value={configSearchName}
              onChange={(e) => setConfigSearchName(e.target.value)}
              style={{ width: 150 }}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleConfigSearch}>
              搜索
            </Button>
            <Button onClick={handleConfigReset}>重置</Button>
          </Space>
        </div>

        <Table
          columns={configColumns}
          dataSource={configData}
          loading={configLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: configPagination.current,
            pageSize: configPagination.pageSize,
            total: configPagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setConfigPagination({ current: page, pageSize, total: configPagination.total });
              if (currentTier) {
                fetchConfigData(currentTier.id, configSearchId, configSearchName);
              }
            },
          }}
        />
      </Modal>

      {/* ============ 新建/编辑小说配置弹窗 ============ */}
      <Modal
        title={editingConfig ? '编辑小说配置' : '新建小说配置'}
        open={novelConfigModalVisible}
        onOk={handleSubmitNovelConfig}
        onCancel={() => setNovelConfigModalVisible(false)}
        confirmLoading={configSubmitLoading}
        width={600}
        destroyOnClose
      >
        <Form form={configForm} layout="vertical">
          {/* 选择小说 */}
          <Form.Item label="选择小说">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={selectedNovel ? `${selectedNovel.novelId} - ${selectedNovel.name}` : ''}
                placeholder="请点击选择小说"
                readOnly
                style={{ flex: 1 }}
              />
              <Button onClick={openNovelModal} disabled={!!editingConfig}>选择</Button>
            </div>
          </Form.Item>

          {/* 统一定价 */}
          <Form.Item
            name="uniformChapterPrice"
            label="章节价格"
            rules={[
              { required: true, message: '请输入章节价格' },
              { type: 'number', min: 1, max: 9999, message: '章节价格必须在1-9999之间' },
            ]}
          >
            <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="统一定价（1-9999）" />
          </Form.Item>

          {/* 范围定价 */}
          <Divider orientation="left">
            范围定价
            <Button type="link" size="small" onClick={addRange} style={{ marginLeft: 8 }}>
              <PlusOutlined /> 添加
            </Button>
          </Divider>

          {ranges.length === 0 ? (
            <Text type="secondary">暂无范围定价，点击"添加"增加</Text>
          ) : (
            ranges.map((range, index) => (
              <Card key={index} size="small" style={{ marginBottom: 8 }} bodyStyle={{ padding: 12 }}>
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space wrap size="small">
                    <InputNumber
                      value={range.startChapter}
                      onChange={(value) => updateRange(index, 'startChapter', value || 1)}
                      min={1}
                      max={99}
                      placeholder="起始章节"
                      style={{ width: 100 }}
                    />
                    <span>至</span>
                    <InputNumber
                      value={range.endChapter}
                      onChange={(value) => updateRange(index, 'endChapter', value || 1)}
                      min={1}
                      max={99}
                      placeholder="结束章节"
                      style={{ width: 100 }}
                    />
                    <span>章节, 价格</span>
                    <InputNumber
                      value={range.price}
                      onChange={(value) => updateRange(index, 'price', value || 1)}
                      min={1}
                      max={9999}
                      placeholder="价格"
                      style={{ width: 100 }}
                    />
                    <span>分</span>
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => removeRange(index)}
                  />
                </Space>
              </Card>
            ))
          )}

          {ranges.length > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              范围定价说明：最多5组，区间不可重复
            </Text>
          )}
        </Form>
      </Modal>

      {/* ============ 小说选择弹窗 ============ */}
      <Modal
        title="选择小说"
        open={novelModalVisible}
        onCancel={() => setNovelModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索小说名称"
            onChange={(e) => fetchNovels(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        </div>
        <Table
          dataSource={novels}
          columns={novelColumns}
          rowKey="id"
          loading={novelLoading}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  );
};

export default PricingTierList;
