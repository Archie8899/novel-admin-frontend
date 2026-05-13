import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Form, Modal, Popconfirm, message, Tag, Typography, Image, Switch, DatePicker, InputNumber, Row, Col, Upload, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiRequest, default as api } from '../services/api';
import dayjs from 'dayjs';
import type { UploadProps } from 'antd';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface Novel {
  id: string;
  novelId: string;
  name: string;
  chineseName: string;
  language: string;
  author: string;
  description: string;
  chapterCount: number;
  views: string;
  category: any;
  copyrightCompany: any;
  isChargeable: boolean;
  status: string;
  coverImage: string;
  authStartTime: string;
  authEndTime: string;
  wordCount: number;
  createdAt: string;
}

const NovelList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [coverType, setCoverType] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);

  // 封面上传 props
  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    beforeUpload: async (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
        return false;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res: any = await api.post('/upload/cover', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.success && res.data?.url) {
          form.setFieldsValue({ coverImage: res.data.url });
          message.success('上传成功');
        } else {
          message.error(res.message || '上传失败');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        message.error('上传失败');
      } finally {
        setUploading(false);
      }
      return false;
    },
  };

  const columns = [
    { title: '小说编号', dataIndex: 'novelId', key: 'novelId', width: 100 },
    { title: '封面', dataIndex: 'coverImage', key: 'coverImage', width: 80, render: (url: string) => url ? <Image src={url} width={50} height={60} style={{ objectFit: 'cover' }} /> : '-' },
    { title: '小说名称', dataIndex: 'name', key: 'name', width: 150, render: (name: string, record: Novel) => <><div>{name}</div><div style={{ color: '#999', fontSize: 12 }}>{record.chineseName}</div></> },
    { title: '分类', dataIndex: ['category', 'name'], key: 'category', width: 100 },
    { title: '版权方', dataIndex: ['copyrightCompany', 'name'], key: 'company', width: 120 },
    { title: '章节数', dataIndex: 'chapterCount', key: 'chapterCount', width: 80 },
    { title: '浏览量', dataIndex: 'views', key: 'views', width: 80 },
    { title: '收费', dataIndex: 'isChargeable', key: 'isChargeable', width: 80, render: (val: boolean) => <Tag color={val ? 'blue' : 'default'}>{val ? '是' : '否'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => <Tag color={status === 'online' ? 'green' : 'red'}>{status === 'online' ? '上架' : '下架'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Novel) => (
        <Space direction="vertical" size="small">
          <Space>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
            <Button type="link" size="small" icon={<UnorderedListOutlined />} onClick={() => navigate(`/novels/${record.id}/chapters`)}>章节</Button>
          </Space>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [catRes, compRes] = await Promise.all([
        apiRequest.get('/categories/options'),
        apiRequest.get('/copyright-companies/options'),
      ]);
      setCategories(catRes.data || []);
      setCompanies(compRes.data || []);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest.get('/novels', { page: pagination.current, pageSize: pagination.pageSize });
      setData(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNovel(null);
    form.resetFields();
    setCoverType('url');
    form.setFieldsValue({
      isChargeable: true,
      status: 'offline',
      language: 'english',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Novel) => {
    setEditingNovel(record);
    // 判断封面是URL还是需要上传
    const isUrl = record.coverImage?.startsWith('http');
    setCoverType(isUrl ? 'url' : 'upload');
    form.setFieldsValue({
      name: record.name,
      chineseName: record.chineseName,
      categoryId: record.category?.id,
      copyrightCompanyId: record.copyrightCompany?.id,
      coverImage: record.coverImage,
      language: record.language,
      author: record.author,
      description: record.description,
      isChargeable: record.isChargeable,
      status: record.status,
      wordCount: record.wordCount,
      authTimeRange: record.authStartTime && record.authEndTime 
        ? [dayjs(record.authStartTime), dayjs(record.authEndTime)]
        : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/novels/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      // 处理授权时间范围
      const authTimeRange = values.authTimeRange;
      const submitData = {
        ...values,
        authTimeRange: authTimeRange ? {
          start: authTimeRange[0]?.toISOString(),
          end: authTimeRange[1]?.toISOString(),
        } : null,
      };
      
      if (editingNovel) {
        await apiRequest.put(`/novels/${editingNovel.id}`, submitData);
        message.success('更新成功');
      } else {
        await apiRequest.post('/novels', submitData);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>小说管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建小说</Button>
      </div>

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

      <Modal 
        title={editingNovel ? '编辑小说' : '新建小说'} 
        open={modalVisible} 
        onOk={handleSubmit} 
        onCancel={() => setModalVisible(false)}
        width={720}
        okText="确认" 
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="小说名称(英文)" rules={[{ required: true, message: '请输入小说名称' }]}>
                <Input maxLength={120} placeholder="请输入小说名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="chineseName" label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]}>
                <Input maxLength={120} placeholder="请输入中文名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择分类">
                  {categories.map((c) => <Option key={c.id} value={c.id}>{c.name} - {c.chineseName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="copyrightCompanyId" label="版权方" rules={[{ required: true, message: '请选择版权方' }]}>
                <Select placeholder="请选择版权方">
                  {companies.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="coverImage"
            label="封面图片"
            rules={[{ required: true, message: '请上传或输入封面图片' }]}
          >
            <div>
              <Radio.Group value={coverType} onChange={(e) => setCoverType(e.target.value)} style={{ marginBottom: 8 }}>
                <Radio.Button value="url">图片URL</Radio.Button>
                <Radio.Button value="upload">本地上传</Radio.Button>
              </Radio.Group>
              
              {coverType === 'url' ? (
                <Input placeholder="https://example.com/cover.jpg" />
              ) : (
                <div>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      选择图片
                    </Button>
                  </Upload>
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    支持 JPG、PNG 格式，大小不超过 2MB
                  </div>
                </div>
              )}
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                当前封面：{form.getFieldValue('coverImage') || '未设置'}
              </div>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="language" label="语言" initialValue="english">
                <Select>
                  <Option value="english">English</Option>
                  <Option value="chinese">中文</Option>
                  <Option value="japanese">日本語</Option>
                  <Option value="korean">한국어</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="author" label="作者">
                <Input maxLength={40} placeholder="请输入作者名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="简介">
            <TextArea rows={3} maxLength={200} placeholder="请输入小说简介（最多200字符）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="wordCount" label="字数">
                <InputNumber min={0} max={9999999} style={{ width: '100%' }} placeholder="请输入字数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="authTimeRange" label="授权时间范围">
                <RangePicker style={{ width: '100%' }} placeholder={['授权开始时间', '授权结束时间']} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isChargeable" label="是否收费" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="收费" unCheckedChildren="免费" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="offline">
                <Select>
                  <Option value="online">上架</Option>
                  <Option value="offline">下架</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default NovelList;
