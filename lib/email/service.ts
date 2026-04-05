/**
 * 邮件服务模块
 * 负责SMTP发送和IMAP拉取
 * 注意：在React Native环境中，实际邮件发送需要通过后端服务或第三方API
 */

import { EmailConfig, EmailMessage, Memo, SyncStatus } from '../db/types';

/**
 * 验证邮箱配置
 */
export function validateEmailConfig(config: any): boolean {
  if (!config) return false;
  
  const { recipientEmail, senderEmail, authCode, smtpServer, smtpPort } = config;
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail) || !emailRegex.test(senderEmail)) {
    return false;
  }
  
  // 验证端口号
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    return false;
  }
  
  // 验证必填字段
  if (!authCode || !smtpServer) {
    return false;
  }
  
  return true;
}

/**
 * 格式化备忘录为邮件
 */
export function formatMemoToEmail(memo: Memo): EmailMessage {
  return {
    subject: memo.title,
    body: memo.content || memo.title,
  };
}

/**
 * 发送邮件（通过后端API）
 */
export async function sendEmail(
  config: EmailConfig,
  memo: Memo
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!validateEmailConfig(config)) {
      return { success: false, error: '邮箱配置无效' };
    }
    
    const emailMessage = formatMemoToEmail(memo);
    
    // 调用后端API发送邮件
    const response = await fetch('http://127.0.0.1:3000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
        subject: emailMessage.subject,
        body: emailMessage.body,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '邮件发送失败',
    };
  }
}

/**
 * 测试邮箱配置
 */
export async function testEmailConfig(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validateEmailConfig(config)) {
      return { success: false, error: '邮箱配置无效' };
    }
    
    // 调用后端API测试邮箱配置
    const response = await fetch('http://127.0.0.1:3000/api/email/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to test email config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '配置测试失败',
    };
  }
}

/**
 * 解析邮件内容为备忘录
 */
export function parseEmailToMemo(
  subject: string,
  body: string,
  date: Date,
  messageId: string
): Memo {
  return {
    id: 0, // 将由数据库生成
    title: subject,
    content: body !== subject ? body : undefined,
    createTime: date.getTime(),
    syncStatus: SyncStatus.SUCCESS,
    emailMessageId: messageId,
  };
}

/**
 * 拉取邮箱邮件（通过后端API）
 */
export async function fetchEmailsFromMailbox(
  config: EmailConfig
): Promise<{ success: boolean; memos?: Memo[]; error?: string }> {
  try {
    if (!validateEmailConfig(config)) {
      return { success: false, error: '邮箱配置无效' };
    }
    
    // 调用后端API拉取邮件
    const response = await fetch('http://127.0.0.1:3000/api/email/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    const result = await response.json();
    const memos = result.emails.map((email: any) =>
      parseEmailToMemo(email.subject, email.body, new Date(email.date), email.messageId)
    );
    
    return {
      success: true,
      memos,
    };
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '邮件拉取失败',
    };
  }
}
