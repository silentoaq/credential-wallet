import { createTheme } from '@mui/material/styles';

// 定義淺色主題
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0090C1', // 深藍色作為主色調
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#5C6B8A', // 灰藍色作為次要色調
    },
    background: {
      default: '#F5F7FA', // 淺灰色背景
      paper: '#FFFFFF', // 白色作為卡片背景
    },
    text: {
      primary: '#273240', // 深色文字
      secondary: '#637899', // 次要文字顏色
    },
  },
  typography: {
    fontFamily: "'Noto Sans TC', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none', // 讓按鈕文字不要全部大寫
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default lightTheme;