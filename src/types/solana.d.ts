/* eslint-disable @typescript-eslint/no-unused-vars */
// Solana window 擴展類型定義
interface SolanaWindow extends Window {
    solana?: {
      isPhantom?: boolean;
      // 這裡可以添加更多 Solana 錢包相關的屬性
    };
  }
  
  // 為了全局可用
  declare global {
    interface Window {
      solana?: {
        isPhantom?: boolean;
        // 可以添加更多 Solana 錢包相關的屬性
      };
    }
  }
  
  export {};