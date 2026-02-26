/**
 * Dashboard 数据计算结果缓存
 *
 * 目的：在数据未变化时复用计算结果，避免重复计算
 * 预期效果：减少 90%+ 的重复计算时间
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  checksum: string; // 数据校验和，用于判断数据是否真的变化
}

// 缓存存储
const cache = new Map<string, CacheEntry<any>>();

// 默认缓存时间：60秒
const DEFAULT_TTL = 60000;

/**
 * 生成数据校验和
 * 使用简单哈希算法，快速判断数据是否变化
 */
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * 获取缓存数据或执行计算
 *
 * @param key 缓存键名
 * @param data 用于校验的数据（如果数据变化，缓存会失效）
 * @param compute 计算函数，只在缓存失效时执行
 * @param ttl 缓存生存时间（毫秒），默认 60 秒
 * @returns 计算结果
 */
export function getCachedData<T>(
  key: string,
  data: any,
  compute: () => T,
  ttl: number = DEFAULT_TTL
): T {
  const now = Date.now();
  const checksum = generateChecksum(data);
  const existing = cache.get(key);

  // 检查缓存是否存在且有效
  if (existing) {
    const isExpired = now - existing.timestamp > ttl;
    const isDataChanged = existing.checksum !== checksum;

    if (!isExpired && !isDataChanged) {
      // 缓存有效且数据未变化，直接返回缓存
      return existing.data as T;
    }
  }

  // 缓存失效或数据变化，执行计算
  const result = compute();

  // 存储到缓存
  cache.set(key, {
    data: result,
    timestamp: now,
    checksum
  });

  return result;
}

/**
 * 清除指定模式的缓存
 *
 * @param pattern 缓存键名模式，如果包含此字符串则删除
 *                如果不传，则清除所有缓存
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    // 清除匹配模式的所有缓存
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // 清除所有缓存
    cache.clear();
  }
}

/**
 * 获取缓存统计信息（用于调试）
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  oldest: number | null;
  newest: number | null;
} {
  const keys = Array.from(cache.keys());
  const timestamps = Array.from(cache.values()).map(v => v.timestamp);

  return {
    size: cache.size,
    keys,
    oldest: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newest: timestamps.length > 0 ? Math.max(...timestamps) : null
  };
}

/**
 * 打印缓存状态（用于调试）
 */
export function logCacheState(): void {
  const stats = getCacheStats();
  console.log('========== Dashboard Cache State ==========');
  console.log(`缓存数量: ${stats.size}`);
  console.log(`缓存键名:`, stats.keys);
  console.log(`最旧缓存: ${stats.oldest ? new Date(stats.oldest).toISOString() : '无'}`);
  console.log(`最新缓存: ${stats.newest ? new Date(stats.newest).toISOString() : '无'}`);
  console.log('==========================================');
}
