/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import darkTheme from '../theme/darkTheme';
import lightTheme from '../theme/lightTheme';

// 主題模式類型
type ThemeMode = 'light' | 'dark';

// 主題上下文類型
interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// 創建上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 上下文提供者
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 從本地存儲中讀取主題設置，默認為深色主題
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    return savedMode || 'dark';
  });

  // 切換主題
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // 設置特定主題
  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  // 當主題改變時保存到本地存儲
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // 根據主題模式選擇對應主題
  const theme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setThemeMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// 自定義Hook，方便使用上下文
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme必須在ThemeProvider內使用');
  }
  return context;
};

export default ThemeProvider;