import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoryList from './pages/CategoryList';
import CopyrightList from './pages/CopyrightList';
import NovelList from './pages/NovelList';
import ChapterList from './pages/ChapterList';
import ProductList from './pages/ProductList';
import PaymentWallList from './pages/PaymentWallList';
import LandingPageList from './pages/LandingPageList';
import FBAuthList from './pages/FBAuthList';
import PromoCodeList from './pages/PromoCodeList';
import ChannelList from './pages/ChannelList';
import OrderList from './pages/OrderList';
import UserList from './pages/UserList';
import UserSegmentList from './pages/UserSegmentList';
import PricingTierList from './pages/PricingTierList';
import AdminUserList from './pages/AdminUserList';
import RoleList from './pages/RoleList';
import DepartmentList from './pages/DepartmentList';
import MenuList from './pages/MenuList';
import OperationLogList from './pages/OperationLogList';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#722ed1',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="copyright" element={<CopyrightList />} />
              <Route path="novels" element={<NovelList />} />
              <Route path="novels/:novelId/chapters" element={<ChapterList />} />
              <Route path="products" element={<ProductList />} />
              <Route path="payment-walls" element={<PaymentWallList />} />
              <Route path="landing-pages" element={<LandingPageList />} />
              <Route path="fb-auth" element={<FBAuthList />} />
              <Route path="promo-codes" element={<PromoCodeList />} />
              <Route path="channels" element={<ChannelList />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="users" element={<UserList />} />
              <Route path="user-segments" element={<UserSegmentList />} />
              <Route path="pricing-tiers" element={<PricingTierList />} />
              <Route path="admin-users" element={<AdminUserList />} />
              <Route path="roles" element={<RoleList />} />
              <Route path="departments" element={<DepartmentList />} />
              <Route path="menus" element={<MenuList />} />
              <Route path="operation-logs" element={<OperationLogList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
