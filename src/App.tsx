import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

// 頁面元件
import HomePage from './pages/Home'
import SharePage from './pages/Share'
import AddCredentialPage from './pages/AddCredential'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import BottomNavigation from './components/layout/BottomNavigation'
import ProtectedRoute from './components/layout/ProtectedRoute'
import WalletConnectionProvider from './context/WalletContext'
import CredentialProvider from './context/CredentialContext'

// 主應用程式元件
const App = () => {
  // 追蹤當前路徑
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // 判斷是否顯示底部導航
  const showBottomNav = !location.pathname.includes('/login');

  // 模擬初始化加載
  useEffect(() => {
    // 在實際應用中，這裡可能會加載用戶資料、憑證等
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <WalletConnectionProvider>
      <CredentialProvider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ flexGrow: 1, pb: showBottomNav ? 7 : 0 }}>
            <Routes>
              {/* 公開路由 */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* 受保護路由 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              
              <Route path="/share" element={
                <ProtectedRoute>
                  <SharePage />
                </ProtectedRoute>
              } />
              
              <Route path="/add-credential" element={
                <ProtectedRoute>
                  <AddCredentialPage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              
              {/* 默認路由 - 重定向到首頁 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          
          {/* 只在非登入頁面顯示底部導航 */}
          {showBottomNav && <BottomNavigation />}
        </Box>
      </CredentialProvider>
    </WalletConnectionProvider>
  );
};

export default App;