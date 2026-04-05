import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { fetchAllMemos, createAndSyncMemo, deleteMemoRecord } from '@/lib/db/repository';
import { Memo } from '@/lib/db/types';

export default function HomeScreen() {
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // 加载备忘录列表
  const loadMemos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllMemos();
      setMemos(data);
    } catch (error) {
      console.error('Failed to load memos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  // 发送新备忘录
  const handleSend = async () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }

    setSending(true);
    try {
      // 拆分标题和内容
      const lines = inputText.trim().split('\n');
      const title = lines[0];
      const content = lines.length > 1 ? lines.slice(1).join('\n') : undefined;

      const result = await createAndSyncMemo(title, content);
      
      // 更新列表
      await loadMemos();
      
      // 清空输入框
      setInputText('');
      
      // 显示提示
      if (result.syncSuccess) {
        Alert.alert('成功', '已保存并同步');
      } else if (result.syncError) {
        Alert.alert('提示', '已保存，同步失败将在联网后重试');
      }
    } catch (error) {
      console.error('Failed to send memo:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSending(false);
    }
  };

  // 删除备忘录
  const handleDelete = (id: number) => {
    Alert.alert('确认删除', '确认删除此记录？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMemoRecord(id);
            await loadMemos();
            Alert.alert('成功', '记录已删除');
          } catch (error) {
            console.error('Failed to delete memo:', error);
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  // 编辑备忘录
  const handleEdit = (memo: Memo) => {
    router.push({
      pathname: '/edit' as any,
      params: {
        id: memo.id.toString(),
        title: memo.title,
        content: memo.content || '',
      },
    });
  };

  // 长按菜单
  const handleLongPress = (memo: Memo) => {
    Alert.alert('操作', '选择操作', [
      { text: '取消', style: 'cancel' },
      {
        text: '编辑',
        onPress: () => handleEdit(memo),
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => handleDelete(memo.id),
      },
    ]);
  };

  // 渲染列表项
  const renderMemoItem = ({ item }: { item: Memo }) => {
    const isExpanded = expandedId === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        onLongPress={() => handleLongPress(item)}
        className="border-b border-border px-4 py-3 active:bg-surface"
      >
        <Text className="text-foreground font-semibold text-base" numberOfLines={1}>
          {item.title}
        </Text>
        
        {isExpanded && item.content && (
          <Text className="text-foreground text-sm mt-2 leading-relaxed">
            {item.content}
          </Text>
        )}
        
        {isExpanded && !item.content && (
          <Text className="text-muted text-sm mt-2">
            （无正文）
          </Text>
        )}
        
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-muted text-xs">
            {new Date(item.createTime).toLocaleString()}
          </Text>
          {item.syncStatus === 0 && (
            <Text className="text-warning text-xs">待同步</Text>
          )}
          {item.syncStatus === 2 && (
            <Text className="text-error text-xs">同步失败</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1 flex-col">
        {/* 顶部标题 */}
        <View className="px-4 py-4 border-b border-border flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-foreground">极简速记</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            className="p-2 active:opacity-70"
          >
            <Text className="text-primary text-lg font-semibold">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 列表区域 */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : memos.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-muted text-base">暂无记录，开始输入吧</Text>
          </View>
        ) : (
          <FlatList
            data={memos}
            renderItem={renderMemoItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={true}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}

        {/* 底部输入区 */}
        <View className="border-t border-border p-4 bg-background">
          <View className="flex-row gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入内容..."
              placeholderTextColor="#9BA1A6"
              multiline
              maxLength={5000}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
              editable={!sending}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              className={`px-4 py-2 rounded-lg justify-center items-center ${
                sending ? 'bg-primary opacity-50' : 'bg-primary active:opacity-80'
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">发送</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
