import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Paper, 
  BottomNavigation as MuiBottomNavigation, 
  BottomNavigationAction,
  styled
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ShareIcon from '@mui/icons-material/Share';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';

// 自定義底部導航樣式
const StyledBottomNavigation = styled(MuiBottomNavigation)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

// 路徑對應到導航索引
const pathToIndex: Record<string, number> = {
  '/': 0,
  '/share': 1,
  '/add-credential': 2,
  '/settings': 3,
};

const BottomNavigation = () => {
  const location = useLocation();
  const [value, setValue] = useState(0);

  // 根據當前路徑設置選中項
  useEffect(() => {
    const index = pathToIndex[location.pathname];
    if (index !== undefined) {
      setValue(index);
    }
  }, [location]);

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000,
      }} 
      elevation={3}
    >
      <StyledBottomNavigation
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue);
        }}
        showLabels
      >
        <BottomNavigationAction 
          component={Link} 
          to="/" 
          label="首頁" 
          icon={<HomeIcon />} 
        />
        <BottomNavigationAction 
          component={Link} 
          to="/share" 
          label="分享" 
          icon={<ShareIcon />} 
        />
        <BottomNavigationAction 
          component={Link} 
          to="/add-credential" 
          label="新增" 
          icon={<AddIcon />} 
        />
        <BottomNavigationAction 
          component={Link} 
          to="/settings" 
          label="設定" 
          icon={<SettingsIcon />} 
        />
      </StyledBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;