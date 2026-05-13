import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Tag, Form, Modal, Popconfirm, message, InputNumber, Switch, Upload, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface Chapter {
  id: string;
  chapterId: string;
  title: string;
  chapterNumber: number;
  isChargeable: boolean;
  price: number | null;
  priceDisplay: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

const ChapterList: React.FC = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [novelInfo, setNovelInfo] = useState<any>(null);

  useEffect(() => {
    if (novelId) {
      fetchData();
      fetchNovelInfo();
    }
  }, [novelId]);

  const fetchNovelInfo = async () => {
    try {
      const res: any = await apiRequest.get(`/novels/${novelId}`);
      setNovelInfo(res.data);
    } catch (error) {
      console.error('Failed to fetch novel info:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest.get('/chapters', { novelId, pageSize: 100 });
      setData(res.data || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingChapter(null);
    form.resetFields();
    form.setFieldsValue({
      isChargeable: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Chapter) => {
    setEditingChapter(record);
    form.setFieldsValue({
      title: record.title,
      chapterNumber: record.chapterNumber,
      isChargeable: record.isChargeable,
      price: record.price,
      content: record.content,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest.delete(`/chapters/${id}`);
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
      
      const submitData = {
        ...values,
        novelId,
      };
      
      if (editingChapter) {
        await apiRequest.put(`/chapters/${editingChapter.id}`, submitData);
        message.success('更新成功');
      } else {
        await apiRequest.post('/chapters', submitData);
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

  const handleImport = async () => {
    try {
      const values = await importForm.validateFields();
      const chaptersData = parseChaptersData(values.chaptersData);
      
      if (chaptersData.length === 0) {
        message.error('请输入有效的章节数据');
        return;
      }
      
      const res: any = await apiRequest.post('/chapters/import', {
        novelId,
        chapters: chaptersData,
      });
      
      message.success(`导入完成：成功${res.data?.successCount || 0}条，失败${res.data?.errorCount || 0}条`);
      if (res.data?.errors?.length > 0) {
        console.error('导入错误:', res.data.errors);
      }
      
      setImportModalVisible(false);
      importForm.resetFields();
      fetchData();
    } catch (error) {
      console.error('Failed to import:', error);
    }
  };

  // 解析批量导入的章节数据
  const parseChaptersData = (data: string): any[] => {
    if (!data) return [];
    const lines = data.trim().split('\n');
    return lines.map(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        return {
          chapterNumber: parseInt(parts[0]) || 1,
          title: parts[1] || '',
          isChargeable: parts[2] !== '0',
          price: parseInt(parts[3]) || 10,
          content: parts[4] || '',
        };
      }
      return null;
    }).filter(Boolean);
  };

  const columns = [
    { title: '章节编号', dataIndex: 'chapterId', key: 'chapterId', width: 120 },
    { title: '章节序号', dataIndex: 'chapterNumber', key: 'chapterNumber', width: 80 },
    { title: '章节标题', dataIndex: 'title', key: 'title' },
    { title: '是否收费', dataIndex: 'isChargeable', key: 'isChargeable', width: 100, render: (val: boolean) => <Tag color={val ? 'blue' : 'green'}>{val ? '收费' : '免费'}</Tag> },
    { title: '价格(分)', dataIndex: 'price', key: 'price', width: 100, render: (price: number | null) => price ? `${price}分` : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Chapter) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此章节?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/novels')}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>
            {novelInfo ? `${novelInfo.name} - 章节管理` : '章节管理'}
          </Title>
        </Space>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增章节</Button>
        </Space>
      </div>

      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 新增/编辑章节弹窗 */}
      <Modal
        title={editingChapter ? '编辑章节' : '新增章节'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        width={600}
        okText="确认"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="chapterNumber"
            label="章节序号"
            rules={[{ required: true, message: '请输入章节序号' }]}
          >
            <InputNumber min={1} max={99} style={{ width: '100%' }} placeholder="请输入章节序号（1-99）" />
          </Form.Item>

          <Form.Item
            name="title"
            label="章节标题"
            rules={[{ required: true, message: '请输入章节标题' }]}
          >
            <Input maxLength={120} placeholder="请输入章节标题" />
          </Form.Item>

          <Form.Item
            name="isChargeable"
            label="是否收费"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="收费" unCheckedChildren="免费" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.isChargeable !== currentValues.isChargeable}
          >
            {({ getFieldValue }) =>
              getFieldValue('isChargeable') ? (
                <Form.Item
                  name="price"
                  label="章节价格（分）"
                  rules={[{ required: true, message: '请输入章节价格' }]}
                >
                  <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="请输入价格（1-9999分）" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="content" label="章节内容">
            <TextArea rows={6} placeholder="请输入章节内容（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入章节"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => setImportModalVisible(false)}
        width={700}
        okText="确认导入"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={importForm} layout="vertical">
          <Form.Item
            label="章节数据"
            name="chaptersData"
            rules={[{ required: true, message: '请输入章节数据' }]}
            extra={
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                <p>格式说明：每行一个章节，用Tab分隔</p>
                <p>格式：章节序号[TAB]标题[TAB]是否收费(0免费/1收费)[TAB]价格[TAB]内容（可选）</p>
                <p>示例：</p>
                <p>1&lt;Tab&gt;第一章 穿越&lt;Tab&gt;1&lt;Tab&gt;10&lt;Tab&gt;</p>
                <p>2&lt;Tab&gt;第二章 重生&lt;Tab&gt;0&lt;Tab&gt;&lt;Tab&gt;</p>
              </div>
            }
          >
            <TextArea rows={10} placeholder={`1\t第一章 穿越\t1\t10\n2\t第二章 重生\t0`} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChapterList;
