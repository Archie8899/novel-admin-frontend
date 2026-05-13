import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Tag, Form, Modal, Popconfirm, message, Input, Checkbox, Select, Row, Col, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { userSegmentAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface UserSegment {
  id: string;
  segmentId: string;
  name: string;
  conditions: string[];
  conditionsDisplay: string;
  osCondition: string;
  systemLanguage: string[];
  countryLevels: object;
  status: string;
  statusDisplay: string;
  createdBy: string;
  createdAt: string;
}

const conditionOptions = [
  { value: 'os', label: '操作系统', description: '按操作系统条件筛选用户' },
  { value: 'country_level', label: '国家等级', description: '按国家等级条件筛选用户' },
  { value: 'system_language', label: '系统语言', description: '按系统语言条件筛选用户' },
];

const osOptions = [
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'H5', label: 'H5' },
];

const systemLanguageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
];

const countryLevelOptions = [
  { value: 'T0', label: 'T0国家', description: '印尼、巴西等新兴市场' },
  { value: 'T1', label: 'T1国家', description: '美国、加拿大、英国等' },
  { value: 'T2', label: 'T2国家', description: '澳大利亚、德国、法国等' },
  { value: 'T3', label: 'T3国家', description: '印度、巴基斯坦等' },
];

const t0Countries = [
  { value: 'ID', label: '印度尼西亚 (Indonesia)' },
  { value: 'BR', label: '巴西 (Brazil)' },
  { value: 'MX', label: '墨西哥 (Mexico)' },
  { value: 'TR', label: '土耳其 (Turkey)' },
  { value: 'TH', label: '泰国 (Thailand)' },
  { value: 'VN', label: '越南 (Vietnam)' },
  { value: 'PH', label: '菲律宾 (Philippines)' },
  { value: 'EG', label: '埃及 (Egypt)' },
  { value: 'NG', label: '尼日利亚 (Nigeria)' },
  { value: 'PK', label: '巴基斯坦 (Pakistan)' },
];

const t1Countries = [
  { value: 'US', label: '美国 (United States)' },
  { value: 'CA', label: '加拿大 (Canada)' },
  { value: 'GB', label: '英国 (United Kingdom)' },
  { value: 'AU', label: '澳大利亚 (Australia)' },
  { value: 'NZ', label: '新西兰 (New Zealand)' },
  { value: 'DE', label: '德国 (Germany)' },
  { value: 'FR', label: '法国 (France)' },
  { value: 'JP', label: '日本 (Japan)' },
  { value: 'KR', label: '韩国 (South Korea)' },
];

const t2Countries = [
  { value: 'IT', label: '意大利 (Italy)' },
  { value: 'ES', label: '西班牙 (Spain)' },
  { value: 'NL', label: '荷兰 (Netherlands)' },
  { value: 'BE', label: '比利时 (Belgium)' },
  { value: 'CH', label: '瑞士 (Switzerland)' },
  { value: 'AT', label: '奥地利 (Austria)' },
  { value: 'IE', label: '爱尔兰 (Ireland)' },
];

const t3Countries = [
  { value: 'IN', label: '印度 (India)' },
  { value: 'PK', label: '巴基斯坦 (Pakistan)' },
  { value: 'NG', label: '尼日利亚 (Nigeria)' },
  { value: 'BD', label: '孟加拉国 (Bangladesh)' },
  { value: 'PH', label: '菲律宾 (Philippines)' },
  { value: 'VN', label: '越南 (Vietnam)' },
];

const UserSegmentList: React.FC = () => {
  const [data, setData] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserSegment | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedCountryLevels, setSelectedCountryLevels] = useState<string[]>([]);
  const [selectedSystemLanguages, setSelectedSystemLanguages] = useState<string[]>([]);

  // 搜索相关
  const [searchName, setSearchName] = useState('');
  const [searchCondition, setSearchCondition] = useState('all');
  const [searchStatus, setSearchStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchName, searchCondition, searchStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchCondition !== 'all') params.condition = searchCondition;
      if (searchStatus !== 'all') params.status = searchStatus;
      const res: any = await userSegmentAPI.list(params);
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
    setSelectedConditions([]);
    setSelectedCountryLevels([]);
    setSelectedSystemLanguages([]);
    form.setFieldsValue({
      status: 'active',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: UserSegment) => {
    setEditingRecord(record);
    setSelectedConditions(record.conditions || []);
    setSelectedCountryLevels(Object.keys(record.countryLevels || {}));
    setSelectedSystemLanguages(record.systemLanguage || []);
    form.setFieldsValue({
      name: record.name,
      conditions: record.conditions,
      osCondition: record.osCondition,
      countryLevels: Object.keys(record.countryLevels || {}),
      systemLanguage: record.systemLanguage,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userSegmentAPI.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      // 构建提交数据
      const submitData: any = {
        name: values.name,
        conditions: selectedConditions,
        status: values.status,
      };

      // 如果选择了操作系统条件
      if (selectedConditions.includes('os')) {
        if (!values.osCondition) {
          message.error('请选择操作系统条件');
          setSubmitLoading(false);
          return;
        }
        submitData.osCondition = values.osCondition;
      }

      // 如果选择了系统语言条件
      if (selectedConditions.includes('system_language')) {
        if (selectedSystemLanguages.length === 0) {
          message.error('请选择至少一个系统语言');
          setSubmitLoading(false);
          return;
        }
        submitData.systemLanguage = selectedSystemLanguages;
      }

      // 如果选择了国家等级条件
      if (selectedConditions.includes('country_level')) {
        if (selectedCountryLevels.length === 0) {
          message.error('请选择至少一个国家等级');
          setSubmitLoading(false);
          return;
        }
        const countryLevels: Record<string, any> = {};
        selectedCountryLevels.forEach(level => {
          if (level.startsWith('T0-')) {
            if (!countryLevels['T0']) countryLevels['T0'] = [];
            (countryLevels['T0'] as string[]).push(level.replace('T0-', ''));
          } else if (level.startsWith('T1-')) {
            if (!countryLevels['T1']) countryLevels['T1'] = [];
            (countryLevels['T1'] as string[]).push(level.replace('T1-', ''));
          } else if (level.startsWith('T2-')) {
            if (!countryLevels['T2']) countryLevels['T2'] = [];
            (countryLevels['T2'] as string[]).push(level.replace('T2-', ''));
          } else if (level.startsWith('T3-')) {
            if (!countryLevels['T3']) countryLevels['T3'] = [];
            (countryLevels['T3'] as string[]).push(level.replace('T3-', ''));
          } else {
            // 纯等级选择（如 T0、T1、T2、T3）
            countryLevels[level] = true;
          }
        });
        submitData.countryLevels = countryLevels;
      }

      if (editingRecord) {
        await userSegmentAPI.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await userSegmentAPI.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
      message.error('提交失败，请检查表单');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 处理分层条件选择变化
  const handleConditionsChange = (checkedValues: string[]) => {
    setSelectedConditions(checkedValues);
  };

  // 处理系统语言选择变化
  const handleSystemLanguageChange = (checkedValues: string[]) => {
    setSelectedSystemLanguages(checkedValues);
  };

  // 处理国家等级选择变化
  const handleCountryLevelChange = (checkedValues: string[]) => {
    setSelectedCountryLevels(checkedValues);
  };

  const columns = [
    { title: '分层ID', dataIndex: 'segmentId', key: 'segmentId', width: 120 },
    { title: '分层名称', dataIndex: 'name', key: 'name' },
    { title: '分层条件', dataIndex: 'conditionsDisplay', key: 'conditions', width: 200, render: (text: string) => text || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '有效' : '无效'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: UserSegment) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此分层?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>用户分层</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建分层</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="分层名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchCondition} onChange={(v) => setSearchCondition(v)} style={{ width: 150 }}>
          <Option value="all">全部条件</Option>
          <Option value="os">操作系统</Option>
          <Option value="country_level">国家等级</Option>
        </Select>
        <Select value={searchStatus} onChange={(v) => setSearchStatus(v)} style={{ width: 100 }}>
          <Option value="all">全部状态</Option>
          <Option value="active">有效</Option>
          <Option value="inactive">无效</Option>
        </Select>
        <Button onClick={() => { setSearchName(''); setSearchCondition('all'); setSearchStatus('all'); }}>重置</Button>
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

      {/* 新建/编辑用户分层弹窗 */}
      <Modal
        title={editingRecord ? '编辑用户分层' : '新建用户分层'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        okText="确认"
        cancelText="取消"
        destroyOnClose
        width={650}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分层名称"
            rules={[{ required: true, message: '请输入分层名称' }]}
            extra="用于标识此用户分层的名称"
          >
            <Input maxLength={40} placeholder="请输入分层名称" />
          </Form.Item>

          <Form.Item
            label="分层条件"
            required
            extra={
              <div style={{ fontSize: 12, color: '#999' }}>
                选择此分层需要满足的条件类型。可以选择多个条件，条件之间为"且"的关系。
              </div>
            }
          >
            <Checkbox.Group
              options={conditionOptions}
              value={selectedConditions}
              onChange={(values) => handleConditionsChange(values as string[])}
            />
          </Form.Item>

          {selectedConditions.includes('os') && (
            <Form.Item
              name="osCondition"
              label="操作系统条件"
              rules={[{ required: true, message: '请选择操作系统' }]}
              extra="选择此分层适用的操作系统"
            >
              <Select placeholder="请选择操作系统" allowClear>
                {osOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {selectedConditions.includes('country_level') && (
            <Form.Item
              label="国家等级条件"
              required
              extra={
                <div style={{ fontSize: 12, color: '#999' }}>
                  选择此分层适用的国家等级。可以展开选择具体国家。
                </div>
              }
            >
              <Checkbox.Group
                value={selectedCountryLevels.filter(v => !v.includes('-'))}
                onChange={(values) => {
                  // 保留已有的具体国家选择，只更新等级
                  const currentSpecific = selectedCountryLevels.filter(v => v.includes('-'));
                  handleCountryLevelChange([...values as string[], ...currentSpecific]);
                }}
              >
                <Row gutter={[16, 8]}>
                  {countryLevelOptions.map((opt) => (
                    <Col key={opt.value} span={12}>
                      <Checkbox value={opt.value}>
                        {opt.label}
                        <div style={{ fontSize: 12, color: '#999', marginLeft: 20 }}>{opt.description}</div>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>

              {/* T0国家二级选择 */}
              {selectedCountryLevels.includes('T0') && (
                <div style={{ marginTop: 12, paddingLeft: 20 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, color: '#666' }}>T0 具体国家（可选，不选则包含全部T0国家）</div>
                  <Checkbox.Group
                    value={selectedCountryLevels.filter(v => v.startsWith('T0-')).map(v => v.replace('T0-', ''))}
                    onChange={(values) => {
                      const otherLevels = selectedCountryLevels.filter(v => !v.startsWith('T0-'));
                      const t0Specific = (values as string[]).map(v => `T0-${v}`);
                      handleCountryLevelChange([...otherLevels, ...t0Specific]);
                    }}
                  >
                    <Row gutter={[16, 8]}>
                      {t0Countries.map((c) => (
                        <Col key={c.value} span={12}>
                          <Checkbox value={c.value}>{c.label}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </div>
              )}

              {/* T1国家二级选择 */}
              {selectedCountryLevels.includes('T1') && (
                <div style={{ marginTop: 12, paddingLeft: 20 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, color: '#666' }}>T1 具体国家（可选，不选则包含全部T1国家）</div>
                  <Checkbox.Group
                    value={selectedCountryLevels.filter(v => v.startsWith('T1-')).map(v => v.replace('T1-', ''))}
                    onChange={(values) => {
                      const otherLevels = selectedCountryLevels.filter(v => !v.startsWith('T1-'));
                      const t1Specific = (values as string[]).map(v => `T1-${v}`);
                      handleCountryLevelChange([...otherLevels, ...t1Specific]);
                    }}
                  >
                    <Row gutter={[16, 8]}>
                      {t1Countries.map((c) => (
                        <Col key={c.value} span={12}>
                          <Checkbox value={c.value}>{c.label}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </div>
              )}

              {/* T2国家二级选择 */}
              {selectedCountryLevels.includes('T2') && (
                <div style={{ marginTop: 12, paddingLeft: 20 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, color: '#666' }}>T2 具体国家（可选，不选则包含全部T2国家）</div>
                  <Checkbox.Group
                    value={selectedCountryLevels.filter(v => v.startsWith('T2-')).map(v => v.replace('T2-', ''))}
                    onChange={(values) => {
                      const otherLevels = selectedCountryLevels.filter(v => !v.startsWith('T2-'));
                      const t2Specific = (values as string[]).map(v => `T2-${v}`);
                      handleCountryLevelChange([...otherLevels, ...t2Specific]);
                    }}
                  >
                    <Row gutter={[16, 8]}>
                      {t2Countries.map((c) => (
                        <Col key={c.value} span={12}>
                          <Checkbox value={c.value}>{c.label}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </div>
              )}

              {/* T3国家二级选择 */}
              {selectedCountryLevels.includes('T3') && (
                <div style={{ marginTop: 12, paddingLeft: 20 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, color: '#666' }}>T3 具体国家（可选，不选则包含全部T3国家）</div>
                  <Checkbox.Group
                    value={selectedCountryLevels.filter(v => v.startsWith('T3-')).map(v => v.replace('T3-', ''))}
                    onChange={(values) => {
                      const otherLevels = selectedCountryLevels.filter(v => !v.startsWith('T3-'));
                      const t3Specific = (values as string[]).map(v => `T3-${v}`);
                      handleCountryLevelChange([...otherLevels, ...t3Specific]);
                    }}
                  >
                    <Row gutter={[16, 8]}>
                      {t3Countries.map((c) => (
                        <Col key={c.value} span={12}>
                          <Checkbox value={c.value}>{c.label}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </div>
              )}
            </Form.Item>
          )}

          {selectedConditions.includes('system_language') && (
            <Form.Item
              label="系统语言条件"
              required
              extra={
                <div style={{ fontSize: 12, color: '#999' }}>
                  选择此分层适用的系统语言。可以选择多种语言。
                </div>
              }
            >
              <Checkbox.Group
                value={selectedSystemLanguages}
                onChange={(values) => handleSystemLanguageChange(values as string[])}
              >
                <Row gutter={[16, 8]}>
                  {systemLanguageOptions.map((opt) => (
                    <Col key={opt.value} span={8}>
                      <Checkbox value={opt.value}>{opt.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          )}

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">有效</Option>
              <Option value="inactive">无效</Option>
            </Select>
          </Form.Item>

          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, marginTop: 16 }}>
            <Title level={5} style={{ marginBottom: 8 }}>条件说明</Title>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#666' }}>
              <li><strong>操作系统：</strong>按用户的访问设备操作系统进行筛选</li>
              <li><strong>国家等级：</strong>按用户所在国家的经济发展水平进行筛选（T0/T1/T2/T3）</li>
              <li><strong>系统语言：</strong>按用户的系统语言进行筛选</li>
              <li><strong>注意：</strong>选择了条件后，必须配置对应的筛选参数</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserSegmentList;
