/**
 * 数据库类型定义
 */

/**
 * 备忘录实体
 */
export interface Memo {
  id: number;
  title: string;           // 第一行内容（邮件标题）
  content?: string;        // 第二行及以后内容（邮件正文）
  createTime: number;      // 创建时间戳（毫秒）
  syncStatus: 0 | 1 | 2;   // 0=待同步，1=已同步，2=同步失败
  emailMessageId?: string; // 邮箱邮件ID（用于更新/删除）
}

/**
 * 邮箱配置
 */
export interface EmailConfig {
  recipientEmail: string;  // 目标收件邮箱
  senderEmail: string;     // 发件邮箱账号
  authCode: string;        // 邮箱授权码
  smtpServer: string;      // SMTP服务器地址
  smtpPort: number;        // SMTP端口号
}

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  PENDING = 0,    // 待同步
  SUCCESS = 1,    // 已同步
  FAILED = 2,     // 同步失败
}

/**
 * 邮件格式
 */
export interface EmailMessage {
  subject: string;  // 邮件标题（第一行）
  body: string;     // 邮件正文（第二行及以后）
}
