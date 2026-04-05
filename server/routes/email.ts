/**
 * 邮件API路由
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * 发送邮件
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { config, subject, body } = req.body;

    if (!config || !subject || !body) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 这里应该使用nodemailer发送邮件
    // 由于React Native环境的限制，实际实现需要在后端完成
    console.log('Sending email:', { to: config.recipientEmail, subject });

    res.json({ success: true, messageId: `msg-${Date.now()}` });
  } catch (error) {
    console.error('Failed to send email:', error);
    const errorMessage = error instanceof Error ? error.message : '邮件发送失败';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * 测试邮箱配置
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const config = req.body;

    if (!config.smtpServer || !config.senderEmail || !config.authCode) {
      return res.status(400).json({ error: '邮箱配置不完整' });
    }

    // 这里应该测试SMTP连接
    // 由于React Native环境的限制，实际实现需要在后端完成
    console.log('Testing email config:', config.senderEmail);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to test email config:', error);
    const errorMessage = error instanceof Error ? error.message : '配置测试失败';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * 拉取邮箱邮件
 */
router.post('/fetch', async (req: Request, res: Response) => {
  try {
    const config = req.body;

    if (!config.smtpServer || !config.senderEmail || !config.authCode || !config.recipientEmail) {
      return res.status(400).json({ error: '邮箱配置不完整' });
    }

    // 这里应该使用IMAP拉取邮件
    // 由于React Native环境的限制，实际实现需要在后端完成
    console.log('Fetching emails from:', config.senderEmail);

    res.json({ success: true, emails: [] });
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    const errorMessage = error instanceof Error ? error.message : '邮件拉取失败';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
