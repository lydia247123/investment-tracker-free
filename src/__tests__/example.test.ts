// 示例测试 - 验证测试环境配置
import { describe, it, expect } from 'vitest';

describe('测试环境验证', () => {
  it('Vitest应正常运行', () => {
    expect(1 + 1).toBe(2);
  });

  it('localStorage Mock应可用', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.clear();
  });

  it('应支持TypeScript', () => {
    const message: string = 'Hello TypeScript';
    expect(message).toBeTypeOf('string');
  });
});
