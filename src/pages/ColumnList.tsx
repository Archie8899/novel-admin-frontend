import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Typography, Tag, Form, Modal, Popconfirm, message,
  Input, Checkbox, Select, Switch, Radio, Table as AntTable, Transfer
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { columnAPI, novelAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Column {
  id: string;
  columnId: string;
  name: any;
  nameDisplay: string;
  terminal: any;
  language: string;
  style: string;
  recommendMode: string;
  recommendRules: any;
  status: string;
  statusDisplay: string;
  createdBy: string;
  createdAt: string;
}

interface ColumnNovel {
  id: string;
  novelId: string;
  novelName: string;
  coverImage: string;
  author: string;
  sort: number;
}

const terminalOptions = [
  { value: 'app', label: 'App端' },
  { value: 'h5', label: 'H5端' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

const styleOptions = [
  { value: 'horizontal_list', label: '横向列表' },
  { value: 'vertical_list', label: '竖向列表' },
  { value: 'banner', label: 'Banner轮播' },
];

const recommendModeOptions = [
  { value: 'auto', label: '自动推荐' },
  { value: 'manual', label: '手工配置' },
];

// 自动推荐规则配置
const ruleTypeOptions = [
  { value: 'views', label: '阅读量' },
  { value: 'createdAt', label: '上架时间' },
  { value: 'rating', label: '评分' },
  { value: 'wordCount', label: '字数' },
];

const orderTypeOptions = [
  { value: 'desc', label: '降序（从高到低）' },
  { value: 'asc', label: '升序（从低到高）' },
];

const ColumnList: React.FC = () => {
  const [data, setData] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Column | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 搜索相关
  const [searchName, setSearchName] = useState('');
  const [searchTerminal, setSearchTerminal] = useState('all');
  const [searchLanguage, setSearchLanguage] = useState('all');
  const [searchStyle, setSearchStyle] = useState('all');
  const [searchRecommendMode, setSearchRecommendMode] = useState('all');
  const [searchStatus, setSearchStatus] = useState('all');

  // 配置小说相关
  const [novelModalVisible, setNovelModalVisible] = useState(false);
  const [currentColumnId, setCurrentColumnId] = useState<string>('');
  const [columnNovels, setColumnNovels] = useState<ColumnNovel[]>([]);
  const [novelLoading, setNovelLoading] = useState(false);
  const [novelSearchLoading, setNovelSearchLoading] = useState(false);
  const [allNovels, setAllNovels] = useState<any[]>([]);
  const [selectedNovelKeys, setSelectedNovelKeys] = useState<React.Key[]>([]);
  
  // 新建时临时存储配置的小说
  const [tempNovels, setTempNovels] = useState<Array<{novelId: string, novelName: string, author: string, coverImage: string, sort: number}>>([]);
  const [tempNovelModalVisible, setTempNovelModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchName, searchTerminal, searchLanguage, searchStyle, searchRecommendMode, searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchTerminal !== 'all') params.terminal = searchTerminal;
      if (searchLanguage !== 'all') params.language = searchLanguage;
      if (searchStyle !== 'all') params.style = searchStyle;
      if (searchRecommendMode !== 'all') params.recommendMode = searchRecommendMode;
      if (searchStatus !== 'all') params.status = searchStatus;

      const res: any = await columnAPI.list(params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // 解析 terminal 字段
  const parseTerminal = (terminal: any): string[] => {
    if (Array.isArray(terminal)) return terminal;
    if (typeof terminal === 'string') {
      try { return JSON.parse(terminal); } catch { return []; }
    }
    return [];
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      recommendMode: 'manual',
      terminal: [],
      style: 'horizontal_list',
      name: { en: '', zh: '' },
    });
    setTempNovels([]); // 清空临时小说列表
    setModalVisible(true);
  };

  const handleEdit = (record: Column) => {
    setEditingRecord(record);
    // 解析 recommendRules
    let rules = null;
    if (record.recommendRules) {
      try {
        rules = typeof record.recommendRules === 'string'
          ? JSON.parse(record.recommendRules)
          : record.recommendRules;
      } catch { rules = null; }
    }

    form.setFieldsValue({
      name: record.name,
      terminal: parseTerminal(record.terminal),
      language: record.language,
      style: record.style,
      recommendMode: record.recommendMode,
      recommendRules: rules,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleCopy = (record: Column) => {
    setEditingRecord(null);
    form.resetFields();

    let rules = null;
    if (record.recommendRules) {
      try {
        rules = typeof record.recommendRules === 'string'
          ? JSON.parse(record.recommendRules)
          : record.recommendRules;
      } catch { rules = null; }
    }

    form.setFieldsValue({
      name: record.name,
      terminal: parseTerminal(record.terminal),
      language: record.language,
      style: record.style,
      recommendMode: record.recommendMode,
      recommendRules: rules,
      status: 'active',
    });
    setTempNovels([]); // 清空临时小说列表
    setModalVisible(true);
  };

  // 打开新建时的小说配置弹窗
  const handleOpenTempNovelModal = () => {
    setTempNovelModalVisible(true);
    setAllNovels([]); // 清空搜索结果
  };

  // 在新建时添加小说到临时列表
  const handleAddTempNovel = (novel: any) => {
    const exists = tempNovels.find(n => n.novelId === novel.novelId || n.novelId === novel.id);
    if (exists) {
      message.warning('该小说已添加');
      return;
    }
    setTempNovels(prev => [...prev, {
      novelId: novel.novelId || novel.id,
      novelName: novel.name,
      author: novel.author || '',
      coverImage: novel.coverImage || '',
      sort: prev.length,
    }]);
    message.success('添加成功');
  };

  // 从临时列表移除小说
  const handleRemoveTempNovel = (novelId: string) => {
    setTempNovels(prev => prev.filter(n => n.novelId !== novelId));
    message.success('移除成功');
  };

  const handleDelete = async (id: string) => {
    try {
      await columnAPI.delete(id);
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

      // 处理栏目名称
      let nameValue = values.name;
      if (typeof values.name === 'object') {
        nameValue = values.name;
      }

      // 处理推荐规则
      let recommendRules = null;
      if (values.recommendMode === 'auto' && values.recommendRules) {
        recommendRules = values.recommendRules;
      }

      const submitData: any = {
        name: typeof nameValue === 'string' ? nameValue : JSON.stringify(nameValue),
        terminal: JSON.stringify(values.terminal || []),
        language: values.language,
        style: values.style,
        recommendMode: values.recommendMode,
        recommendRules: recommendRules ? JSON.stringify(recommendRules) : null,
        status: values.status,
      };

      if (editingRecord) {
        await columnAPI.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        const result: any = await columnAPI.create(submitData);
        message.success('创建成功');
        
        // 如果有临时配置的小说，批量添加到新创建的栏目
        if (tempNovels.length > 0 && result?.data?.id) {
          const newColumnId = result.data.id;
          for (const novel of tempNovels) {
            try {
              await columnAPI.addNovel(newColumnId, { novelId: novel.novelId });
            } catch (err) {
              console.error('Failed to add novel:', err);
            }
          }
          message.success(`已添加${tempNovels.length}本小说到栏目`);
        }
      }
      setModalVisible(false);
      setTempNovels([]); // 清空临时小说列表
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
      message.error('提交失败，请检查表单');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 配置小说相关方法
  const handleConfigNovels = async (record: Column) => {
    setCurrentColumnId(record.id);
    setNovelModalVisible(true);
    setNovelLoading(true);
    setSelectedNovelKeys([]);

    try {
      // 获取栏目已有的小说
      const res: any = await columnAPI.getNovels(record.id, { page: 1, pageSize: 100 });
      const novels = res.data || [];
      setColumnNovels(novels);
      setSelectedNovelKeys(novels.map((n: any) => n.novelId));
    } catch (error) {
      console.error('Failed to fetch column novels:', error);
      message.error('获取栏目小说失败');
    } finally {
      setNovelLoading(false);
    }
  };

  const handleSearchNovels = async (value: string) => {
    if (!value || value.length < 1) {
      setAllNovels([]);
      return;
    }
    setNovelSearchLoading(true);
    try {
      const res: any = await novelAPI.getOptions();
      // 过滤匹配的小说
      const filtered = (res || []).filter((novel: any) =>
        novel.name.toLowerCase().includes(value.toLowerCase()) ||
        novel.novelId.toLowerCase().includes(value.toLowerCase())
      );
      setAllNovels(filtered);
    } catch (error) {
      console.error('Failed to search novels:', error);
    } finally {
      setNovelSearchLoading(false);
    }
  };

  const handleAddNovels = async (targetKeys: React.Key[]) => {
    try {
      // 获取需要添加的小说ID
      const toAdd = targetKeys.filter(key => !selectedNovelKeys.includes(key));

      for (const novelId of toAdd) {
        await columnAPI.addNovel(currentColumnId, { novelId: novelId as string });
      }

      // 刷新小说列表
      const res: any = await columnAPI.getNovels(currentColumnId, { page: 1, pageSize: 100 });
      setColumnNovels(res.data || []);
      setSelectedNovelKeys(res.data?.map((n: any) => n.novelId) || []);
      message.success('添加成功');
    } catch (error) {
      console.error('Failed to add novels:', error);
      message.error('添加失败');
    }
  };

  const handleRemoveNovel = async (novelId: string) => {
    try {
      await columnAPI.removeNovel(currentColumnId, novelId);
      setColumnNovels(prev => prev.filter(n => n.novelId !== novelId));
      setSelectedNovelKeys(prev => prev.filter(key => key !== novelId));
      message.success('移除成功');
    } catch (error) {
      console.error('Failed to remove novel:', error);
      message.error('移除失败');
    }
  };

  const handleSortChange = async (novelId: string, newSort: number) => {
    try {
      await columnAPI.updateNovel(currentColumnId, novelId, { sort: newSort });
      setColumnNovels(prev =>
        prev.map(n => n.novelId === novelId ? { ...n, sort: newSort } : n)
      );
    } catch (error) {
      console.error('Failed to update sort:', error);
      message.error('排序更新失败');
    }
  };

  const columns = [
    { title: '栏目ID', dataIndex: 'columnId', key: 'columnId', width: 120 },
    { title: '栏目名称', dataIndex: 'nameDisplay', key: 'nameDisplay', width: 200 },
    {
      title: '终端', dataIndex: 'terminal', key: 'terminal', width: 120,
      render: (terminal: any) => {
        const arr = parseTerminal(terminal);
        return arr.map((t: string) => <Tag key={t}>{t === 'app' ? 'App端' : 'H5端'}</Tag>);
      }
    },
    { title: '语言', dataIndex: 'language', key: 'language', width: 80 },
    {
      title: '样式', dataIndex: 'style', key: 'style', width: 100,
      render: (style: string) => {
        const found = styleOptions.find(o => o.value === style);
        return found ? found.label : style;
      }
    },
    {
      title: '推荐模式', dataIndex: 'recommendMode', key: 'recommendMode', width: 100,
      render: (mode: string) => mode === 'auto' ? '自动推荐' : '手工配置'
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: Column) => (
        <Space size="small">
          {record.recommendMode === 'manual' && (
            <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleConfigNovels(record)}>
              配置小说
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleCopy(record)}>复制</Button>
          <Popconfirm title="确定删除此栏目?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 推荐规则表单组件
  const RecommendRulesForm: React.FC = () => {
    const [rules, setRules] = useState<any[]>([{ field: 'views', order: 'desc', limit: 10 }]);

    useEffect(() => {
      const values = form.getFieldsValue();
      if (values.recommendRules) {
        setRules(values.recommendRules);
      }
    }, []);

    const addRule = () => {
      const newRules = [...rules, { field: 'views', order: 'desc', limit: 10 }];
      setRules(newRules);
      form.setFieldsValue({ recommendRules: newRules });
    };

    const removeRule = (index: number) => {
      const newRules = rules.filter((_, i) => i !== index);
      setRules(newRules);
      form.setFieldsValue({ recommendRules: newRules });
    };

    const updateRule = (index: number, field: string, value: any) => {
      const newRules = rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      );
      setRules(newRules);
      form.setFieldsValue({ recommendRules: newRules });
    };

    return (
      <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, color: '#666' }}>推荐规则配置</div>
        {rules.map((rule, index) => (
          <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="start">
            <span style={{ width: 30, textAlign: 'right' }}>{index + 1}.</span>
            <Select
              value={rule.field}
              onChange={(value) => updateRule(index, 'field', value)}
              style={{ width: 120 }}
              options={ruleTypeOptions}
            />
            <Select
              value={rule.order}
              onChange={(value) => updateRule(index, 'order', value)}
              style={{ width: 150 }}
              options={orderTypeOptions}
            />
            <span>取</span>
            <Input
              type="number"
              value={rule.limit}
              onChange={(e) => updateRule(index, 'limit', parseInt(e.target.value) || 10)}
              style={{ width: 80 }}
              min={1}
              max={100}
            />
            <span>本小说</span>
            {rules.length > 1 && (
              <Button type="link" danger onClick={() => removeRule(index)}>删除</Button>
            )}
          </Space>
        ))}
        <Button type="link" onClick={addRule}>+ 添加规则</Button>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          说明：按选定字段排序后取指定数量的推荐小说，支持组合多个规则
        </div>
      </div>
    );
  };

  // 多语言名称输入组件
  const MultilingualNameInput: React.FC = () => {
    const [names, setNames] = useState<Record<string, string>>({ en: '', zh: '' });

    const commonLocales = [
      { value: 'en', label: 'English' },
      { value: 'zh', label: '中文' },
      { value: 'es', label: 'Español' },
      { value: 'pt', label: 'Português' },
      { value: 'fr', label: 'Français' },
      { value: 'de', label: 'Deutsch' },
      { value: 'ja', label: '日本語' },
      { value: 'ko', label: '한국어' },
      { value: 'id', label: 'Bahasa Indonesia' },
    ];

    const updateName = (locale: string, value: string) => {
      const newNames = { ...names, [locale]: value };
      setNames(newNames);
      form.setFieldsValue({ name: newNames });
    };

    return (
      <div>
        {commonLocales.slice(0, 4).map(locale => (
          <Form.Item key={locale.value} label={locale.label} style={{ marginBottom: 8 }}>
            <Input
              value={names[locale.value] || ''}
              onChange={(e) => updateName(locale.value, e.target.value)}
              placeholder={`请输入${locale.label}名称`}
            />
          </Form.Item>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>栏目管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建栏目</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="栏目名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchTerminal} onChange={(v) => setSearchTerminal(v)} style={{ width: 120 }}>
          <Option value="all">全部终端</Option>
          {terminalOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
        </Select>
        <Select value={searchLanguage} onChange={(v) => setSearchLanguage(v)} style={{ width: 120 }}>
          <Option value="all">全部语言</Option>
          {languageOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
        </Select>
        <Select value={searchStyle} onChange={(v) => setSearchStyle(v)} style={{ width: 120 }}>
          <Option value="all">全部样式</Option>
          {styleOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
        </Select>
        <Select value={searchRecommendMode} onChange={(v) => setSearchRecommendMode(v)} style={{ width: 120 }}>
          <Option value="all">全部模式</Option>
          {recommendModeOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
        </Select>
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">启用</Option>
          <Option value="inactive">禁用</Option>
        </Select>
        <Button onClick={() => {
          setSearchName('');
          setSearchTerminal('all');
          setSearchLanguage('all');
          setSearchStyle('all');
          setSearchRecommendMode('all');
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

      {/* 新建/编辑栏目弹窗 */}
      <Modal
        title={editingRecord ? '编辑栏目' : '新建栏目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setTempNovels([]); // 清空临时小说列表
        }}
        confirmLoading={submitLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>栏目名称（多语言）</div>
            <MultilingualNameInput />
          </div>

          <Form.Item
            name="terminal"
            label="适用终端"
            rules={[{ required: true, message: '请选择至少一个终端' }]}
          >
            <Checkbox.Group options={terminalOptions} />
          </Form.Item>

          <Form.Item
            name="language"
            label="默认语言"
            rules={[{ required: true, message: '请选择语言' }]}
          >
            <Select placeholder="请选择语言">
              {languageOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item
            name="style"
            label="展示样式"
            rules={[{ required: true, message: '请选择样式' }]}
          >
            <Radio.Group options={styleOptions} optionType="button" />
          </Form.Item>

          <Form.Item
            name="recommendMode"
            label="推荐模式"
            rules={[{ required: true, message: '请选择推荐模式' }]}
          >
            <Radio.Group options={recommendModeOptions} />
          </Form.Item>

          {/* 自动推荐模式显示规则配置 */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.recommendMode !== curr.recommendMode}>
            {({ getFieldValue }) =>
              getFieldValue('recommendMode') === 'auto' ? <RecommendRulesForm /> : null
            }
          </Form.Item>

          {/* 手工配置模式显示小说配置按钮和已配置列表 */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.recommendMode !== curr.recommendMode}>
            {({ getFieldValue }) =>
              getFieldValue('recommendMode') === 'manual' ? (
                <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, color: '#666' }}>小说配置</div>
                  <Button 
                    type="dashed" 
                    onClick={editingRecord ? () => handleConfigNovels(editingRecord) : handleOpenTempNovelModal}
                    icon={<SettingOutlined />}
                  >
                    {editingRecord ? '配置小说' : '配置小说'}
                  </Button>
                  
                  {/* 显示已配置的小说列表 */}
                  {(editingRecord ? columnNovels : tempNovels).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>已配置的小说（{editingRecord ? columnNovels.length : tempNovels.length}本）</div>
                      <div style={{ maxHeight: 200, overflow: 'auto' }}>
                        {(editingRecord ? columnNovels : tempNovels).map((novel: any, index: number) => (
                          <div key={novel.novelId || novel.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
                          }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ marginRight: 8, color: '#999' }}>{index + 1}.</span>
                              <span style={{ fontWeight: 500 }}>{novel.novelName || novel.name}</span>
                              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>({novel.novelId || novel.id})</span>
                            </div>
                            <Button 
                              type="link" 
                              danger 
                              size="small"
                              onClick={() => editingRecord ? handleRemoveNovel(novel.novelId) : handleRemoveTempNovel(novel.novelId)}
                            >
                              移除
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            }
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
        </Form>
      </Modal>

      {/* 新建时配置小说弹窗（临时） */}
      <Modal
        title="配置栏目小说"
        open={tempNovelModalVisible}
        onCancel={() => setTempNovelModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              showSearch
              placeholder="搜索小说名称或ID"
              loading={novelSearchLoading}
              onSearch={async (value) => {
                if (!value || value.length < 1) {
                  setAllNovels([]);
                  return;
                }
                setNovelSearchLoading(true);
                try {
                  const res: any = await novelAPI.getOptions();
                  const filtered = (res || []).filter((novel: any) =>
                    novel.name.toLowerCase().includes(value.toLowerCase()) ||
                    novel.novelId.toLowerCase().includes(value.toLowerCase())
                  );
                  setAllNovels(filtered);
                } catch (error) {
                  console.error('Failed to search novels:', error);
                } finally {
                  setNovelSearchLoading(false);
                }
              }}
              filterOption={false}
              style={{ width: 300 }}
              onChange={(value) => {
                if (value) {
                  const novel = allNovels.find(n => n.id === value || n.novelId === value);
                  if (novel) {
                    handleAddTempNovel(novel);
                  }
                }
              }}
              notFoundContent={novelSearchLoading ? '加载中...' : '请输入关键词搜索'}
            >
              {allNovels.map(novel => (
                <Option key={novel.id} value={novel.id}>
                  {novel.name} ({novel.novelId})
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        <div style={{ color: '#666', marginBottom: 8 }}>已选择的小说（点击"移除"可删除）</div>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {tempNovels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无选择小说，请从上方搜索添加</div>
          ) : (
            tempNovels.map((novel, index) => (
              <div key={novel.novelId} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ marginRight: 8, color: '#999' }}>{index + 1}.</span>
                  <span style={{ fontWeight: 500 }}>{novel.novelName}</span>
                  <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>({novel.novelId})</span>
                </div>
                <Button 
                  type="link" 
                  danger 
                  size="small"
                  onClick={() => handleRemoveTempNovel(novel.novelId)}
                >
                  移除
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* 配置小说弹窗（编辑模式） */}
      <Modal
        title="配置栏目小说"
        open={novelModalVisible}
        onCancel={() => setNovelModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              showSearch
              placeholder="搜索小说名称或ID"
              loading={novelSearchLoading}
              onSearch={handleSearchNovels}
              filterOption={false}
              style={{ width: 300 }}
              onChange={(value) => {
                if (value && !selectedNovelKeys.includes(value)) {
                  handleAddNovels([...selectedNovelKeys, value]);
                }
              }}
              notFoundContent={novelSearchLoading ? '加载中...' : '请输入关键词搜索'}
            >
              {allNovels.map(novel => (
                <Option key={novel.id} value={novel.id}>
                  {novel.name} ({novel.novelId})
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        <div style={{ color: '#666', marginBottom: 8 }}>已配置的小说（拖拽可调整排序）</div>
        <Table
          dataSource={columnNovels}
          rowKey="novelId"
          loading={novelLoading}
          pagination={false}
          size="small"
          columns={[
            { title: '排序', dataIndex: 'sort', key: 'sort', width: 80, render: (_, record) => (
              <Input
                type="number"
                value={record.sort}
                onChange={(e) => handleSortChange(record.novelId, parseInt(e.target.value) || 0)}
                style={{ width: 60 }}
                min={0}
              />
            )},
            { title: '小说ID', dataIndex: 'novelId', key: 'novelId', width: 120 },
            { title: '小说名称', dataIndex: 'novelName', key: 'novelName', width: 200 },
            { title: '作者', dataIndex: 'author', key: 'author', width: 120 },
            {
              title: '操作',
              key: 'action',
              width: 80,
              render: (_, record) => (
                <Button type="link" danger size="small" onClick={() => handleRemoveNovel(record.novelId)}>
                  移除
                </Button>
              )
            },
          ]}
          locale={{ emptyText: '暂无配置小说，请从上方搜索添加' }}
        />
      </Modal>
    </div>
  );
};

export default ColumnList;
