import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useWalletConnection } from '../../context/WalletContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { connecting, isAuthenticated, authLoading } = useWalletConnection();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  // 延遲驗證檢查，以確保有足夠的時間來恢復認證狀態
  useEffect(() => {
    // 如果正在載入，則等待
    if (connecting || authLoading) {
      return;
    }
    
    // 設置一個短暫的延遲，讓認證有時間完成
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [connecting, authLoading, isAuthenticated]);

  // 如果正在連接、認證或檢查中，顯示載入狀態
  if (connecting || authLoading || isChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 從 localStorage 讀取認證狀態
  const checkLocalAuth = () => {
    try {
      const storedAuth = localStorage.getItem('wallet_auth');
      if (!storedAuth) return false;
      
      const authData = JSON.parse(storedAuth);
      const now = Date.now();
      return authData.expiresAt && authData.expiresAt > now;
    } catch (e) {
      console.error('檢查本地認證錯誤:', e);
      return false;
    }
  };

  // 如果未認證，但本地有有效的認證，給予更多時間
  if (!isAuthenticated && checkLocalAuth()) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 最終檢查：如果未認證，重定向到登入頁面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登入且已認證，顯示原始內容
  return <>{children}</>;
};

export default ProtectedRoute;