import { useState } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  CircularProgress,
  Box,
  Alert
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';
import { useWalletConnection } from '../../context/WalletContext';

const WalletConnectButton = () => {
  const { wallets, select } = useWallet();
  const { connect, connecting, isAuthenticated } = useWalletConnection();
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 處理錢包選擇
  const handleSelectWallet = async (walletName: string) => {
    try {
      setError(null);
      // 將字符串轉換為 WalletName 類型
      select(walletName as WalletName);
      await connect();
      setOpenDialog(false);
    } catch (error) {
      console.error('選擇錢包錯誤:', error);
      setError(error instanceof Error ? error.message : '連接錢包時發生錯誤');
    }
  };

  // 處理錢包連接
  const handleConnect = async () => {
    // 如果只有一個錢包可用，直接連接
    if (wallets.length === 1) {
      try {
        setError(null);
        select(wallets[0].adapter.name as WalletName);
        await connect();
      } catch (error) {
        console.error('連接錢包錯誤:', error);
        setError(error instanceof Error ? error.message : '連接錢包時發生錯誤');
      }
    } else {
      // 如果有多個錢包，打開選擇對話框
      setOpenDialog(true);
    }
  };

  // 檢查錢包可用性
  const hasAvailableWallets = wallets.length > 0;

  // 獲取Phantom錢包
  
  // 如果已連接，顯示已連接狀態
  if (isAuthenticated) {
    return (
      <Button 
        variant="contained" 
        color="primary" 
        disabled
      >
        已連接
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleConnect}
        disabled={connecting || !hasAvailableWallets}
        startIcon={connecting ? <CircularProgress size={20} color="inherit" /> : undefined}
      >
        {connecting ? '連接中...' : '連接錢包'}
      </Button>

      {!hasAvailableWallets && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            未檢測到可用的錢包。請安裝 <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">Phantom 錢包</a>。
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* 錢包選擇對話框 */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>選擇錢包</DialogTitle>
        <DialogContent>
          {wallets.length > 0 ? (
            <List sx={{ pt: 0 }}>
              {wallets.map((wallet) => (
                <ListItem disableGutters key={wallet.adapter.name}>
                  <ListItemButton onClick={() => handleSelectWallet(wallet.adapter.name)}>
                    <ListItemAvatar>
                      <Avatar
                        alt={wallet.adapter.name}
                        src={wallet.adapter.icon}
                        sx={{ bgcolor: 'primary.dark' }}
                      />
                    </ListItemAvatar>
                    <ListItemText primary={wallet.adapter.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                未檢測到可用的錢包。請安裝 Phantom 錢包。
              </Typography>
              <Button 
                variant="outlined" 
                href="https://phantom.app/" 
                target="_blank"
                sx={{ mt: 2 }}
              >
                安裝 Phantom
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletConnectButton;