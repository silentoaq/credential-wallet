/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useWalletConnection } from '../../context/WalletContext';
import WalletConnectButton from '../../components/wallet/WalletConnectButton';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, isAuthenticated, authLoading, authenticate } = useWalletConnection();
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 獲取來源路徑（如果有）
  const from = location.state?.from?.pathname || '/';

  // 處理身份驗證
  const handleAuthentication = async () => {
    setError(null);
    setIsAuthenticating(true);
    
    try {
      const success = await authenticate();
      if (!success) {
        setError('身份驗證失敗，請重試');
      }
    } catch (error) {
      console.error('認證錯誤:', error);
      setError('身份驗證過程中發生錯誤');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 如果已認證，重定向到來源頁面或首頁
  useEffect(() => {
    if (connected && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [connected, isAuthenticated, navigate, from]);

  // 錢包連接後，自動進行身份驗證
  useEffect(() => {
    if (connected && !isAuthenticated && !authLoading && !isAuthenticating) {
      handleAuthentication();
    }
  }, [connected, isAuthenticated, authLoading]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: 8,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            數位憑證皮夾
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            管理您的身分和憑證
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <AccountBalanceWalletIcon 
            sx={{ 
              fontSize: 72, 
              color: 'primary.main',
              mb: 2 
            }} 
          />
          
          <Typography variant="h5" component="h2" gutterBottom>
            連接您的錢包
          </Typography>
          
          <Typography 
            variant="body1" 
            align="center" 
            color="text.secondary"
            paragraph
            sx={{ mb: 4 }}
          >
            使用 Phantom 錢包連接以管理您的數位憑證和安全地存儲您的資訊。
          </Typography>
          
          {!connected && <WalletConnectButton />}
          
          {connected && !isAuthenticated && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                錢包已連接，請簽名以完成認證
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={handleAuthentication}
                disabled={isAuthenticating || authLoading}
                startIcon={isAuthenticating ? <CircularProgress size={20} /> : null}
              >
                {isAuthenticating ? '處理中...' : '簽名並登入'}
              </Button>
            </>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ 
              mt: 4,
              color: 'text.secondary'
            }}
          >
            還沒有 Phantom 錢包？
          </Typography>
          
          <Button 
            variant="text" 
            href="https://phantom.app/" 
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 1 }}
          >
            下載並安裝 Phantom
          </Button>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            您的數位身分由區塊鏈技術保護。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            我們不會存儲您的私鑰或個人資料。
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;