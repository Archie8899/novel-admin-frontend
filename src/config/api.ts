// API 配置
const isProduction = import.meta.env.PROD;

// 生产环境使用后端完整地址，开发环境使用相对路径（通过 Vite proxy）
// 注意：不包含 /api 后缀，使用时需要加上
export const API_BASE_URL = isProduction
  ? (import.meta.env.VITE_API_URL || 'https://novel-admin-backend-production.up.railway.app')
  : '';
