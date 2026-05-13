import axios, { AxiosError } from 'axios';
import { message } from 'antd';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    // 检查业务层面的错误状态
    const data = response.data;
    
    // 如果响应中有 success 字段且为 false，则为业务逻辑错误
    if (data && data.success === false) {
      const errorMsg = data.message || '操作失败';
      message.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
    
    return response.data;
  },
  (error: AxiosError) => {
    // 提取错误消息
    let errorMsg = '请求失败';
    
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      const data = error.response.data as any;
      
      // 优先使用后端返回的错误消息
      if (data?.message) {
        errorMsg = data.message;
      } else if (data?.msg) {
        errorMsg = data.msg;
      } else if (status === 401) {
        errorMsg = '登录已过期，请重新登录';
        // 可选：自动跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (status === 403) {
        errorMsg = '没有权限执行此操作';
      } else if (status === 404) {
        errorMsg = '请求的资源不存在';
      } else if (status >= 500) {
        errorMsg = '服务器错误，请稍后重试';
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMsg = '网络连接失败，请检查网络';
    } else {
      // 请求配置出错
      errorMsg = '请求配置错误';
    }
    
    message.error(errorMsg);
    return Promise.reject(error);
  }
);

// API方法封装
export const apiRequest = {
  get: <T = any>(url: string, params?: any) =>
    api.get<T>(url, { params }),

  post: <T = any>(url: string, data?: any) =>
    api.post<T>(url, data),

  put: <T = any>(url: string, data?: any) =>
    api.put<T>(url, data),

  delete: <T = any>(url: string) =>
    api.delete<T>(url),
};

// 定价层级 API
export const pricingTierAPI = {
  // 获取定价层级列表
  list: (params?: { name?: string; status?: string; page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>('/pricing-tiers', params),

  // 获取单个定价层级
  getOne: (id: string) =>
    apiRequest.get<any>(`/pricing-tiers/${id}`),

  // 新建定价层级
  create: (data: { name: string; userSegmentId: string; defaultChapterPrice: number; sort?: number; status?: string }) =>
    apiRequest.post<any>('/pricing-tiers', data),

  // 编辑定价层级
  update: (id: string, data: { name?: string; userSegmentId?: string; defaultChapterPrice?: number; sort?: number; status?: string }) =>
    apiRequest.put<any>(`/pricing-tiers/${id}`, data),

  // 删除定价层级
  delete: (id: string) =>
    apiRequest.delete<any>(`/pricing-tiers/${id}`),

  // 获取定价层级小说配置列表
  getNovelConfigs: (id: string, params?: { novelId?: string; novelName?: string; page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>(`/pricing-tiers/${id}/novels`, params),

  // 新建小说配置
  createNovelConfig: (id: string, data: { selectNovel: string; uniformChapterPrice: number; ranges?: any[] }) =>
    apiRequest.post<any>(`/pricing-tiers/${id}/novels`, data),

  // 编辑小说配置
  updateNovelConfig: (id: string, configId: string, data: { uniformChapterPrice?: number; ranges?: any[] }) =>
    apiRequest.put<any>(`/pricing-tiers/${id}/novels/${configId}`, data),

  // 删除小说配置
  deleteNovelConfig: (id: string, configId: string) =>
    apiRequest.delete<any>(`/pricing-tiers/${id}/novels/${configId}`),
};

// 支付墙 API
export const paymentWallAPI = {
  // 获取支付墙列表
  list: (params?: { name?: string; userSegmentName?: string; status?: string; page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>('/payment-walls', params),

  // 获取单个支付墙
  getOne: (id: string) =>
    apiRequest.get<any>(`/payment-walls/${id}`),

  // 新建支付墙
  create: (data: { name: string; userSegmentId: string; sort?: number; status?: string }) =>
    apiRequest.post<any>('/payment-walls', data),

  // 编辑支付墙
  update: (id: string, data: { name?: string; userSegmentId?: string; sort?: number; status?: string }) =>
    apiRequest.put<any>(`/payment-walls/${id}`, data),

  // 删除支付墙
  delete: (id: string) =>
    apiRequest.delete<any>(`/payment-walls/${id}`),

  // 获取支付墙商品列表
  getProducts: (id: string, params?: { type?: string; page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>(`/payment-walls/${id}/products`, params),

  // 新建支付墙商品
  createProduct: (id: string, data: { productId: string; bonusCoins?: number; isDefaultSelected?: boolean; showBadge?: boolean; marketingText?: string; subscriptionText?: string; sort?: number }) =>
    apiRequest.post<any>(`/payment-walls/${id}/products`, data),

  // 编辑支付墙商品
  updateProduct: (id: string, productConfigId: string, data: { bonusCoins?: number; isDefaultSelected?: boolean; showBadge?: boolean; marketingText?: string; subscriptionText?: string; sort?: number }) =>
    apiRequest.put<any>(`/payment-walls/${id}/products/${productConfigId}`, data),

  // 删除支付墙商品
  deleteProduct: (id: string, productConfigId: string) =>
    apiRequest.delete<any>(`/payment-walls/${id}/products/${productConfigId}`),
};

// 用户分层 API
export const userSegmentAPI = {
  // 获取用户分层列表
  list: (params?: { name?: string; condition?: string; status?: string; page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>('/user-segments', params),

  // 获取有效用户分层列表（用于下拉选择）
  getOptions: () =>
    apiRequest.get<any[]>('/user-segments/options'),

  // 获取单个用户分层
  getOne: (id: string) =>
    apiRequest.get<any>(`/user-segments/${id}`),

  // 新建用户分层
  create: (data: { name: string; conditions: string[]; osCondition?: string; systemLanguage?: string[]; countryLevels?: object; status?: string }) =>
    apiRequest.post<any>('/user-segments', data),

  // 编辑用户分层
  update: (id: string, data: { name?: string; conditions?: string[]; osCondition?: string; systemLanguage?: string[]; countryLevels?: object; status?: string }) =>
    apiRequest.put<any>(`/user-segments/${id}`, data),

  // 删除用户分层
  delete: (id: string) =>
    apiRequest.delete<any>(`/user-segments/${id}`),
};

// 落地页 API
export const landingPageAPI = {
  // 获取落地页列表
  list: (params?: { name?: string; novelName?: string; mediaChannel?: string; createdBy?: string; page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>('/landing-pages', params),

  // 获取单个落地页
  getOne: (id: string) =>
    apiRequest.get<any>(`/landing-pages/${id}`),

  // 新建落地页
  create: (data: { name: string; mediaChannel: string; language?: string; os: string; selectNovel: string; openChapter: number }) =>
    apiRequest.post<any>('/landing-pages', data),

  // 编辑落地页
  update: (id: string, data: { name?: string; mediaChannel?: string; language?: string; os?: string; selectNovel?: string; openChapter?: number }) =>
    apiRequest.put<any>(`/landing-pages/${id}`, data),

  // 删除落地页
  delete: (id: string) =>
    apiRequest.delete<any>(`/landing-pages/${id}`),

  // 生成推广链接
  getLink: (id: string) =>
    apiRequest.get<{ link: string; copyText: string }>(`/landing-pages/${id}/link`),
};

// 小说 API
export const novelAPI = {
  // 获取小说选项列表
  getOptions: () =>
    apiRequest.get<any[]>('/novels/options'),
};

// FB授权 API
export const fbAuthAPI = {
  // 获取FB授权列表
  list: (params?: { page?: number; pageSize?: number }) =>
    apiRequest.get<{ data: any[]; total: number; page: number; pageSize: number }>('/fb-authorizations', params),

  // 删除FB授权
  delete: (id: string) =>
    apiRequest.delete<any>(`/fb-authorizations/${id}`),
};

export default api;
