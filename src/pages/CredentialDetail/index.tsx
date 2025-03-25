/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useCredentials } from '../../context/CredentialContext';
import { useWalletConnection } from '../../context/WalletContext';
import { Credential } from '../../types';

const CredentialDetailPage = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const navigate = useNavigate();
  const { getCredentialById, removeCredential } = useCredentials();
  const { did } = useWalletConnection();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawData, setShowRawData] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDisclosureFields, setSelectedDisclosureFields] = useState<Record<string, boolean>>({});
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'valid' | 'invalid' | null>(null);
  const [verifyingCredential, setVerifyingCredential] = useState(false);

  useEffect(() => {
    // 載入憑證資料
    if (credentialId) {
      const cred = getCredentialById(credentialId);
      setCredential(cred || null);
      
      // 如果找到憑證，初始化所有選擇性披露字段為選中狀態
      if (cred && cred.credentialSubject) {
        const initialDisclosureFields: Record<string, boolean> = {};
        Object.keys(cred.credentialSubject).forEach(key => {
          initialDisclosureFields[key] = true;
        });
        setSelectedDisclosureFields(initialDisclosureFields);
      }
      
      setLoading(false);
    }
  }, [credentialId, getCredentialById]);

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '無期限';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 處理憑證刪除
  const handleDeleteCredential = () => {
    if (credentialId) {
      removeCredential(credentialId);
      setConfirmDeleteOpen(false);
      navigate('/');
    }
  };

  // 切換是否顯示原始資料
  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  // 處理選擇性披露字段變更
  const handleDisclosureToggle = (field: string) => {
    setSelectedDisclosureFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 創建選擇性披露的憑證
  const createSelectiveDisclosure = () => {
    // 實際項目中，這裡應該實現基於SD-JWT的選擇性披露
    // 目前是簡化的模擬實現
    console.log('準備進行選擇性披露的字段:', 
      Object.entries(selectedDisclosureFields)
        .filter(([_, isSelected]) => isSelected)
        .map(([field]) => field)
    );
    
    // 在實際應用中，這裡會生成新的SD-JWT並返回
    setShareDialogOpen(false);
  };

  // 驗證憑證
  const verifyCredential = async () => {
    if (!credential) return;
    
    setVerifyingCredential(true);
    setVerificationStatus('pending');
    
    try {
      // 在實際應用中，這裡應該調用驗證API
      // 目前簡單模擬驗證過程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 如果憑證未過期，則認為有效
      const isValid = credential.expirationDate 
        ? new Date(credential.expirationDate) > new Date() 
        : true;
      
      setVerificationStatus(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error('驗證憑證錯誤:', error);
      setVerificationStatus('invalid');
    } finally {
      setVerifyingCredential(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!credential) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="error">
          找不到指定的憑證
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')} 
          sx={{ mt: 2 }}
        >
          返回首頁
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            憑證詳情
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
        {/* 憑證標題和狀態 */}
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h2" component="h2">
                {credential.type[credential.type.length - 1]
                  .replace('Credential', '')
                  .replace(/([A-Z])/g, ' $1')
                  .trim()}
              </Typography>
              <Chip 
                label="有效" 
                color="success" 
                icon={<VerifiedIcon />}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              發行者: {credential.issuer}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              發行日期: {formatDate(credential.issuanceDate)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              到期日期: {formatDate(credential.expirationDate)}
            </Typography>
          </CardContent>
        </Card>
        
        {/* 驗證狀態 */}
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" component="h3">
                憑證狀態
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={verifyCredential}
                disabled={verifyingCredential}
                startIcon={verifyingCredential ? <CircularProgress size={20} /> : <VerifiedIcon />}
              >
                {verifyingCredential ? '驗證中...' : '驗證'}
              </Button>
            </Box>
            
            {verificationStatus && (
              <Alert 
                severity={
                  verificationStatus === 'pending' ? 'info' : 
                  verificationStatus === 'valid' ? 'success' : 'error'
                }
                sx={{ mt: 2 }}
              >
                {verificationStatus === 'pending' && '正在驗證憑證...'}
                {verificationStatus === 'valid' && '憑證有效，通過驗證。'}
                {verificationStatus === 'invalid' && '憑證無效或已過期。'}
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {/* 憑證資料 */}
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" component="h3">
                憑證資料
              </Typography>
              <Button 
                variant="text" 
                color="primary"
                onClick={toggleRawData}
                startIcon={<CodeIcon />}
              >
                {showRawData ? '顯示格式化資料' : '顯示原始資料'}
              </Button>
            </Box>
            
            {showRawData ? (
              <Box 
                component="pre" 
                sx={{ 
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  maxHeight: '300px'
                }}
              >
                {credential.rawCredential ? credential.rawCredential : JSON.stringify(credential, null, 2)}
              </Box>
            ) : (
              <List>
                <ListItem>
                  <ListItemText 
                    primary="主體 ID" 
                    secondary={credential.credentialSubject.id || did}
                  />
                </ListItem>
                <Divider component="li" />
                
                {Object.entries(credential.credentialSubject)
                  .filter(([key]) => key !== 'id')
                  .map(([key, value]) => (
                    <Box key={key}>
                      <ListItem>
                        <ListItemText 
                          primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                          secondary={typeof value === 'object' ? JSON.stringify(value) : value}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </Box>
                  ))
                }
              </List>
            )}
          </CardContent>
        </Card>
        
        {/* 操作按鈕 */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              startIcon={<ShareIcon />}
              onClick={() => setShareDialogOpen(true)}
            >
              分享憑證
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              variant="outlined" 
              color="error"
              fullWidth
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              刪除憑證
            </Button>
          </Grid>
        </Grid>
      </Container>
      
      {/* 刪除確認對話框 */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>確認刪除憑證</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除這個憑證嗎？此操作無法撤銷。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>取消</Button>
          <Button onClick={handleDeleteCredential} color="error" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 分享對話框 */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>選擇性披露憑證資料</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            選擇您想要分享的憑證欄位。未選擇的欄位在分享時不會被披露。
          </DialogContentText>
          
          <List>
            {Object.entries(credential.credentialSubject)
              .filter(([key]) => key !== 'id')
              .map(([key]) => (
                <ListItem key={key} sx={{ px: 0 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedDisclosureFields[key] || false}
                        onChange={() => handleDisclosureToggle(key)}
                      />
                    }
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  />
                </ListItem>
              ))
            }
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>取消</Button>
          <Button onClick={createSelectiveDisclosure} variant="contained" color="primary">
            建立分享連結
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CredentialDetailPage;