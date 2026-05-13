import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Typography, Tag, Form, Modal, Popconfirm, message, Row, Col, InputNumber, Drawer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';
import { apiRequest, landingPageAPI, novelAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface LandingPage {
  id: string;
  name: string;
  novelId: string;
  novel: { novelId: string; name: string; chineseName: string };
  os: string;
  openChapter: number;
  mediaChannel: string;
  mediaChannelDisplay: string;
  language: string;
  createdBy: string;
  createdAt: string;
}

const LandingPageList: React.FC = () => {
  const [data, setData] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LandingPage | null>(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  // 预览和链接相关
  const [previewDrawerVisible, setPreviewDrawerVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [copyLink, setCopyLink] = useState('');

  // 搜索相关
  const [searchName, setSearchName] = useState('');
  const [searchNovel, setSearchNovel] = useState('');
  const [searchChannel, setSearchChannel] = useState('all');

  // 可选小说列表
  const [novelList, setNovelList] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    loadNovels();
  }, [pagination.current, pagination.pageSize, searchName, searchNovel, searchChannel]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.current, pageSize: pagination.pageSize };
      if (searchName) params.name = searchName;
      if (searchNovel) params.novelName = searchNovel;
      if (searchChannel !== 'all') params.mediaChannel = searchChannel;
      const res: any = await apiRequest.get('/landing-pages', params);
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
    finally {
      setLoading(false);
    }
  };

  const loadNovels = async () => {
    try {
      const res: any = await apiRequest.get('/novels', { pageSize: 100 });
      setNovelList(res.data || []);
    } catch (error) {
      console.error('Failed to fetch novels:', error);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      os: 'H5',
      mediaChannel: 'Google',
      language: 'english',
      openChapter: 1,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: LandingPage) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      mediaChannel: record.mediaChannel,
      language: record.language,
      os: record.os,
      selectNovel: record.novelId,
      openChapter: record.openChapter,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await landingPageAPI.delete(id);
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
        await landingPageAPI.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await landingPageAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 预览落地页
  const handlePreview = async (record: LandingPage) => {
    try {
      const res: any = await landingPageAPI.getLink(record.id);
      setPreviewUrl(res.data?.link || '');
      setCopyLink(res.data?.copyText || '');
      setPreviewDrawerVisible(true);
    } catch (error) {
      message.error('获取预览链接失败');
    }
  };

  // 复制链接
  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      message.success('链接已复制到剪贴板');
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => id.substring(0, 8) + '...' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '小说', dataIndex: ['novel', 'name'], key: 'novel', width: 150, render: (name: string, record: LandingPage) => (
      <span>{name || '-'} {record.novel?.chineseName && <span style={{ color: '#999' }}>({record.novel.chineseName})</span>}</span>
    )},
    { title: '媒体渠道', dataIndex: 'mediaChannelDisplay', key: 'channel', width: 100 },
    { title: '操作系统', dataIndex: 'os', key: 'os', width: 80, render: (os: string) => (
      <Tag>{os}</Tag>
    )},
    { title: '打开章节', dataIndex: 'openChapter', key: 'openChapter', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: LandingPage) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => handlePreview(record)}>链接</Button>
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
        <Title level={3} style={{ margin: 0 }}>落地页配置</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建落地页</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="落地页名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Input
          placeholder="小说名称"
          value={searchNovel}
          onChange={(e) => setSearchNovel(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Select value={searchChannel} onChange={(v) => setSearchChannel(v)} style={{ width: 120 }}>
          <Option value="all">全部渠道</Option>
          <Option value="Google">Google</Option>
          <Option value="Facebook">Facebook</Option>
          <Option value="Apple">Apple Search Ads</Option>
          <Option value="Tiktok">TikTok</Option>
          <Option value="Applovin">AppLovin</Option>
        </Select>
        <Button onClick={() => { setSearchName(''); setSearchNovel(''); setSearchChannel('all'); }}>重置</Button>
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

      {/* 新建/编辑落地页弹窗 */}
      <Modal
        title={editingRecord ? '编辑落地页' : '新建落地页'}
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
            label="落地页名称"
            rules={[{ required: true, message: '请输入落地页名称' }]}
          >
            <Input maxLength={40} placeholder="请输入落地页名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mediaChannel"
                label="媒体渠道"
                rules={[{ required: true, message: '请选择媒体渠道' }]}
              >
                <Select placeholder="请选择媒体渠道">
                  <Option value="Google">Google</Option>
                  <Option value="Facebook">Facebook</Option>
                  <Option value="Apple">Apple Search Ads</Option>
                  <Option value="Tiktok">TikTok</Option>
                  <Option value="Applovin">AppLovin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="os"
                label="操作系统"
                rules={[{ required: true, message: '请选择操作系统' }]}
              >
                <Select placeholder="请选择操作系统">
                  <Option value="H5">H5</Option>
                  <Option value="iOS">iOS</Option>
                  <Option value="Android">Android</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="selectNovel"
            label="选择小说"
            rules={[{ required: true, message: '请选择小说' }]}
          >
            <Select
              placeholder="请选择小说"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {novelList.map((novel) => (
                <Option key={novel.id} value={novel.id}>
                  {novel.name} {novel.chineseName && `(${novel.chineseName})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="openChapter"
                label="打开章节"
                rules={[{ required: true, message: '请输入打开章节号' }]}
                extra="用户点击推广链接后打开的章节号"
              >
                <InputNumber min={1} max={99} style={{ width: '100%' }} placeholder="请输入章节号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="language"
                label="页面语言"
                initialValue="english"
              >
                <Select>
                  <Option value="english">English</Option>
                  <Option value="chinese">中文</Option>
                  <Option value="japanese">日本語</Option>
                  <Option value="korean">한국어</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 预览/链接抽屉 */}
      <Drawer
        title="落地页预览与推广链接"
        placement="right"
        width={500}
        onClose={() => setPreviewDrawerVisible(false)}
        open={previewDrawerVisible}
      >
        {previewUrl && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>推广链接</Title>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={copyLink} readOnly style={{ flex: 1 }} />
                <Button icon={<CopyOutlined />} onClick={() => handleCopyLink(copyLink)}>复制</Button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>预览</Title>
              <Button type="primary" onClick={() => window.open(previewUrl, '_blank')}>
                在新窗口打开预览
              </Button>
            </div>

            <div>
              <Title level={5}>UTM参数说明</Title>
              <ul style={{ color: '#666', fontSize: 12 }}>
                <li>utm_source: 流量来源标识</li>
                <li>utm_medium: 营销媒介</li>
                <li>utm_campaign: 推广活动标识</li>
              </ul>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default LandingPageList;
