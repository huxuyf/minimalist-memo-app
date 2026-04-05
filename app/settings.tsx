import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import {
  getEmailConfiguration,
  saveEmailConfiguration,
  testEmailConfiguration,
  recoverFromMailbox,
} from '@/lib/db/repository';
import { EmailConfig } from '@/lib/db/types';

export default function SettingsScreen() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('465');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [recovering, setRecovering] = useState(false);

  // 加载邮箱配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getEmailConfiguration();
        if (config) {
          setRecipientEmail(config.recipientEmail);
          setSenderEmail(config.senderEmail);
          setAuthCode(config.authCode);
          setSmtpServer(config.smtpServer);
          setSmtpPort(config.smtpPort.toString());
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // 保存配置
  const handleSave = async () => {
    if (!recipientEmail.trim() || !senderEmail.trim() || !authCode.trim() || !smtpServer.trim()) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }

    setSaving(true);
    try {
      const config: EmailConfig = {
        recipientEmail: recipientEmail.trim(),
        senderEmail: senderEmail.trim(),
        authCode: authCode.trim(),
        smtpServer: smtpServer.trim(),
        smtpPort: parseInt(smtpPort) || 465,
      };

      await saveEmailConfiguration(config);
      Alert.alert('成功', '邮箱配置已保存');
    } catch (error) {
      console.error('Failed to save config:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 测试配置
  const handleTest = async () => {
    if (!recipientEmail.trim() || !senderEmail.trim() || !authCode.trim() || !smtpServer.trim()) {
      Alert.alert('提示', '请先填写完整的邮箱配置');
      return;
    }

    setTesting(true);
    try {
      const config: EmailConfig = {
        recipientEmail: recipientEmail.trim(),
        senderEmail: senderEmail.trim(),
        authCode: authCode.trim(),
        smtpServer: smtpServer.trim(),
        smtpPort: parseInt(smtpPort) || 465,
      };

      const result = await testEmailConfiguration(config);
      if (result.success) {
        Alert.alert('成功', '邮箱配置正确，测试邮件已发送');
      } else {
        Alert.alert('失败', result.error || '配置测试失败');
      }
    } catch (error) {
      console.error('Failed to test config:', error);
      Alert.alert('错误', '测试失败');
    } finally {
      setTesting(false);
    }
  };

  // 一键恢复
  const handleRecover = async () => {
    Alert.alert('确认恢复', '将从邮箱拉取所有邮件并导入本地，是否继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          setRecovering(true);
          try {
            const result = await recoverFromMailbox();
            if (result.success) {
              Alert.alert('成功', `已恢复 ${result.count} 条记录`);
              router.back();
            } else {
              Alert.alert('失败', result.error || '恢复失败');
            }
          } catch (error) {
            console.error('Failed to recover:', error);
            Alert.alert('错误', '恢复失败');
          } finally {
            setRecovering(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* 顶部栏 */}
        <View className="px-4 py-4 border-b border-border flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-primary text-lg">← 返回</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground flex-1 text-center">设置</Text>
          <View className="w-8" />
        </View>

        {/* 邮箱配置区 */}
        <View className="p-4">
          <Text className="text-lg font-bold text-foreground mb-4">邮箱配置</Text>

          {/* 收件邮箱 */}
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-1">目标收件邮箱 *</Text>
            <TextInput
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="example@gmail.com"
              placeholderTextColor="#9BA1A6"
              keyboardType="email-address"
              editable={!saving && !testing && !recovering}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* 发件邮箱 */}
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-1">发件邮箱账号 *</Text>
            <TextInput
              value={senderEmail}
              onChangeText={setSenderEmail}
              placeholder="your-email@gmail.com"
              placeholderTextColor="#9BA1A6"
              keyboardType="email-address"
              editable={!saving && !testing && !recovering}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* 授权码 */}
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-1">邮箱授权码 *</Text>
            <TextInput
              value={authCode}
              onChangeText={setAuthCode}
              placeholder="输入授权码"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
              editable={!saving && !testing && !recovering}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
            <Text className="text-muted text-xs mt-1">
              注：使用邮箱的授权码，不是登录密码
            </Text>
          </View>

          {/* SMTP服务器 */}
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-1">SMTP服务器地址 *</Text>
            <TextInput
              value={smtpServer}
              onChangeText={setSmtpServer}
              placeholder="smtp.gmail.com"
              placeholderTextColor="#9BA1A6"
              editable={!saving && !testing && !recovering}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
            <Text className="text-muted text-xs mt-1">
              常见服务器：smtp.gmail.com, smtp.163.com, smtp.qq.com
            </Text>
          </View>

          {/* SMTP端口 */}
          <View className="mb-4">
            <Text className="text-foreground font-semibold mb-1">SMTP端口号 *</Text>
            <TextInput
              value={smtpPort}
              onChangeText={setSmtpPort}
              placeholder="465"
              placeholderTextColor="#9BA1A6"
              keyboardType="number-pad"
              editable={!saving && !testing && !recovering}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>

          {/* 操作按钮 */}
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              onPress={handleTest}
              disabled={testing || saving || recovering}
              className={`flex-1 px-4 py-3 rounded-lg justify-center items-center ${
                testing ? 'bg-primary opacity-50' : 'bg-primary active:opacity-80'
              }`}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">测试配置</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || testing || recovering}
              className={`flex-1 px-4 py-3 rounded-lg justify-center items-center ${
                saving ? 'bg-primary opacity-50' : 'bg-primary active:opacity-80'
              }`}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">保存配置</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 数据恢复 */}
          <View className="border-t border-border pt-4">
            <Text className="text-lg font-bold text-foreground mb-2">数据恢复</Text>
            <Text className="text-muted text-sm mb-3">
              从邮箱拉取所有邮件并导入本地数据库
            </Text>
            <TouchableOpacity
              onPress={handleRecover}
              disabled={recovering || saving || testing}
              className={`px-4 py-3 rounded-lg justify-center items-center ${
                recovering ? 'bg-primary opacity-50' : 'bg-primary active:opacity-80'
              }`}
            >
              {recovering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">一键恢复</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
