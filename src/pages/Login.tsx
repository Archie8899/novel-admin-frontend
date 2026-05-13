import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // 页面加载时检查是否记住了账号密码
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      form.setFieldsValue({ email: savedEmail, password: savedPassword });
      setRemember(true);
    }
  }, [form]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      if (remember) {
        // 记住账号密码
        localStorage.setItem('rememberedEmail', values.email);
        localStorage.setItem('rememberedPassword', values.password);
      } else {
        // 清除已保存的账号密码
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      const success = await login(values.email, values.password);
      if (success) {
        navigate('/');
      } else {
        message.error('登录失败，请检查账号密码是否正确');
      }
    } catch (error: any) {
      console.error('登录异常:', error);
      message.error(error?.message || '登录请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{ width: 400, boxShadow: '0 14px 30px rgba(0,0,0,0.15)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Novel Admin</Title>
          <p style={{ color: '#666' }}>小说运营后台管理系统</p>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱: admin@novel.com"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码: admin123"
            />
          </Form.Item>
          <Form.Item>
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
              记住账号密码
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          测试账号: admin@novel.com / admin123
        </div>
      </Card>
    </div>
  );
};

export default Login;
