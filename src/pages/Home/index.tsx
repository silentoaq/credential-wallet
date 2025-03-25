import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useCredentials } from '../../context/CredentialContext';
import { useWalletConnection } from '../../context/WalletContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { publicKey } = useWalletConnection();
  const { credentials, loading } = useCredentials();
  const [isInitializing, setIsInitializing] = useState(true);

  // 模擬初始化過程
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 處理加載狀態
  if (loading || isInitializing) {
    return (
      <Box>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
              首頁
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>載入中...</Typography>
        </Container>
      </Box>
    );
  }

  // 處理憑證為空的情況
  if (credentials.length === 0) {
    return (
      <Box>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
              首頁
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Typography 
            variant="h6" 
            color="primary" 
            gutterBottom 
            sx={{ fontWeight: 'bold', mb: 3 }}
          >
            看起來您的錢包是空的。
          </Typography>
          
          <Card 
            sx={{ 
              bgcolor: 'background.paper', 
              mb:.4,
              ':hover': {
                boxShadow: 3,
                cursor: 'pointer'
              }
            }}
            onClick={() => navigate('/add-credential')}
          >
            <CardContent sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 2
            }}>
              <Typography variant="h6">新增憑證</Typography>
              <IconButton color="primary" aria-label="add credential">
                <AddIcon />
              </IconButton>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // 獲取憑證圖標
  const getCredentialIcon = (type: string[]) => {
    if (type.includes('NaturalPersonCredential')) {
      return <PersonIcon />;
    } else if (type.includes('EducationCredential')) {
      return <SchoolIcon />;
    } else if (type.includes('EmploymentCredential')) {
      return <BadgeIcon />;
    } else {
      return <VerifiedIcon />;
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '無期限';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  };
  
  // 顯示憑證列表
  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            首頁
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            錢包地址
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {publicKey}
          </Typography>
        </Box>
        
        <Typography 
          variant="h6" 
          sx={{ mb: 2, fontWeight: 'medium' }}
        >
          我的憑證 ({credentials.length})
        </Typography>
        
        <List>
          {credentials.map((credential, index) => (
            <Box key={credential.id}>
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  mb: 1,
                  ':hover': {
                    boxShadow: 2,
                    bgcolor: 'action.hover',
                    cursor: 'pointer'
                  }
                }}
                component={Link}
                to={`/credential/${credential.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {getCredentialIcon(credential.type)}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="h6" component="span">
                        {credential.type[credential.type.length - 1]
                          .replace('Credential', '')
                          .replace(/([A-Z])/g, ' $1')
                          .trim()}
                      </Typography>
                      <Chip 
                        label="有效" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 1 }} 
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        發行者: {credential.issuer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        有效期至: {formatDate(credential.expirationDate)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < credentials.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            component={Link}
            to="/add-credential"
          >
            新增憑證
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;