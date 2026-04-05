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
import { searchMemos, rankSearchResults } from '@/lib/db/search';
import { Memo } from '@/lib/db/types';

export default function HomeScreen() {
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMemos, setDisplayMemos] = useState<Memo[]>([]);

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

  // 搜索备忘录
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setDisplayMemos(memos);
    } else {
      const searchResults = searchMemos(memos, searchQuery);
      const rankedResults = rankSearchResults(searchResults, searchQuery);
      setDisplayMemos(rankedResults);
    }
  }, [searchQuery, memos]);

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
      
      // 清空搜索框
      setSearchQuery('');
      
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
      {
        text: '编辑',
        onPress: () => handleEdit(memo),
      },
      {
        text: '删除',
        onPress: () => {
          Alert.alert('确认删除', '确定要删除这条记录吗？', [
            {
              text: '取消',
              onPress: () => {},
              style: 'cancel',
            },
            {
              text: '删除',
              onPress: async () => {
                try {
                  await deleteMemoRecord(memo.id);
                  await loadMemos();
                  Alert.alert('成功', '已删除');
                } catch (error) {
                  Alert.alert('错误', '删除失败');
                }
              },
              style: 'destructive',
            },
          ]);
        },
        style: 'destructive',
      },
      {
        text: '取消',
        onPress: () => {},
        style: 'cancel',
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
        className="px-4 py-3 border-b border-border active:opacity-70"
      >
        <Text className="text-lg font-semibold text-foreground">
          {item.title}
        </Text>
        
        {isExpanded && item.content && (
          <Text className="text-muted text-sm mt-2 leading-relaxed">
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

        {/* 搜索框 */}
        <View className="px-4 py-3 border-b border-border bg-surface">
          <View className="flex-row items-center bg-background border border-border rounded-lg px-3 py-2">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索笔记..."
              placeholderTextColor="#9BA1A6"
              className="flex-1 text-foreground"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="p-1 active:opacity-70"
              >
                <Text className="text-muted text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && (
            <Text className="text-muted text-xs mt-2">
              找到 {displayMemos.length} 条记录
            </Text>
          )}
        </View>

        {/* 列表区域 */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : displayMemos.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-muted text-base">
              {searchQuery.length > 0 ? '未找到匹配的记录' : '暂无记录，开始输入吧'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayMemos}
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
              numberOfLines={3}
              className="flex-1 text-foreground bg-surface border border-border rounded-lg p-3"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              className="bg-primary px-4 py-3 rounded-lg justify-center active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">
                {sending ? '发送中...' : '发送'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
