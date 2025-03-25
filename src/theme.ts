import { createTheme } from '@mui/material/styles';

// 定義應用程式的主題
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6FDBFF', // 淺藍色作為主色調
      contrastText: '#121926',
    },
    secondary: {
      main: '#6C7AA3', // 淺灰藍色作為次要色調
    },
    background: {
      default: '#121926', // 深藍黑色背景
      paper: '#1E293B', // 略淺的深藍色作為卡片背景
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A6B0CF',
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
          boxShadow: 'none',
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

export default theme;