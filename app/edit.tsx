import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updateAndSyncMemo, fetchMemoById } from '@/lib/db/repository';

export default function EditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [title, setTitle] = useState(params.title as string || '');
  const [content, setContent] = useState(params.content as string || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '标题不能为空');
      return;
    }

    setSaving(true);
    try {
      const id = parseInt(params.id as string);
      const result = await updateAndSyncMemo(id, title, content || undefined);
      
      if (result.memo) {
        Alert.alert('成功', '记录已更新');
        router.back();
      } else {
        Alert.alert('错误', '更新失败');
      }
    } catch (error) {
      console.error('Failed to save memo:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1 flex-col">
        {/* 顶部栏 */}
        <View className="px-4 py-4 border-b border-border flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-primary text-lg">← 返回</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">编辑记录</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="p-2"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text className="text-primary text-lg font-semibold">保存</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 编辑区 */}
        <View className="flex-1 p-4">
          <Text className="text-foreground font-semibold mb-2">标题</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="输入标题..."
            placeholderTextColor="#9BA1A6"
            className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground mb-4"
            editable={!saving}
          />

          <Text className="text-foreground font-semibold mb-2">内容</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="输入内容..."
            placeholderTextColor="#9BA1A6"
            multiline
            maxLength={5000}
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        {/* 底部按钮 */}
        <View className="border-t border-border p-4 flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border justify-center items-center active:opacity-70"
          >
            <Text className="text-foreground font-semibold">取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`flex-1 px-4 py-3 rounded-lg justify-center items-center ${
              saving ? 'bg-primary opacity-50' : 'bg-primary active:opacity-80'
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
