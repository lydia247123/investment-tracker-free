import { InvestmentRecord, RecordsByType } from '../types/investment';

/**
 * 验证投资记录
 */
const validateRecord = (record: any, lineNumber?: number): { valid: boolean; error?: string } => {
  // 检查必需字段
  if (!record.date || typeof record.date !== 'string') {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：缺少月份` : '缺少月份' };
  }

  if (!/^\d{4}-\d{2}$/.test(record.date)) {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：日期格式错误，应为YYYY-MM` : '日期格式错误，应为YYYY-MM' };
  }

  if (!record.assetType || typeof record.assetType !== 'string') {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：缺少资产类型` : '缺少资产类型' };
  }

  if (!record.account || typeof record.account !== 'string') {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：缺少账户` : '缺少账户' };
  }

  if (typeof record.amount !== 'number' || record.amount < 0) {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：投资金额不能为负数` : '投资金额不能为负数' };
  }

  // 检查快照金额（可选，但如果提供则必须>=0）
  if (record.snapshot !== undefined && record.snapshot !== null && record.snapshot !== '') {
    if (typeof record.snapshot !== 'number' || record.snapshot < 0) {
      return { valid: false, error: lineNumber ? `第${lineNumber}行：快照金额不能为负数` : '快照金额不能为负数' };
    }
  }

  // 检查定期存款字段
  if (record.isTimeDeposit === true || record.isTimeDeposit === 'true') {
    if (typeof record.depositTermMonths !== 'number' || record.depositTermMonths <= 0) {
      return { valid: false, error: lineNumber ? `第${lineNumber}行：定期存款的存期必须大于0` : '定期存款的存期必须大于0' };
    }

    if (typeof record.annualInterestRate !== 'number' || record.annualInterestRate <= 0) {
      return { valid: false, error: lineNumber ? `第${lineNumber}行：定期存款的年化利率必须大于0` : '定期存款的年化利率必须大于0' };
    }

    if (record.maturityDate && !/^\d{4}-\d{2}$/.test(record.maturityDate)) {
      return { valid: false, error: lineNumber ? `第${lineNumber}行：到期日期格式错误，应为YYYY-MM` : '到期日期格式错误，应为YYYY-MM' };
    }
  }

  return { valid: true };
};

/**
 * 生成新的记录ID
 */
const generateRecordId = (assetType: string): string => {
  // 清理资产类型中的特殊字符
  const cleanAssetType = assetType.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
  return `inv-${cleanAssetType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 从CSV文件导入投资数据
 */
export const importInvestmentDataFromCSV = async (
  file: File,
  mode: 'overwrite' | 'append',
  onSuccess: (importedCount: number) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    // 读取文件
    const text = await file.text();

    // 移除BOM标记（如果有）
    const csvText = text.replace(/^\ufeff/, '');

    // 分割行
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      onError('CSV文件内容为空或格式不正确');
      return;
    }

    // 解析标题行（处理可能的引号包裹）
    const headersLine = lines[0];
    const headers = headersLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // 映射列名到字段
    const fieldMap = new Map<any, number>();
    headers.forEach((header, index) => {
      if (header === '月份' || header === 'date') fieldMap.set('date', index);
      else if (header === '资产类型' || header === 'assetType') fieldMap.set('assetType', index);
      else if (header === '账户' || header === 'account') fieldMap.set('account', index);
      else if (header === '投资金额' || header === 'amount') fieldMap.set('amount', index);
      else if (header === '快照金额' || header === 'snapshot') fieldMap.set('snapshot', index);
      else if (header === '是否定期存款' || header === 'isTimeDeposit') fieldMap.set('isTimeDeposit', index);
      else if (header === '存期(月)' || header === 'depositTermMonths') fieldMap.set('depositTermMonths', index);
      else if (header === '年化利率(%)' || header === 'annualInterestRate') fieldMap.set('annualInterestRate', index);
      else if (header === '到期日期' || header === 'maturityDate') fieldMap.set('maturityDate', index);
      else if (header === '备注' || header === 'note') fieldMap.set('note', index);
    });

    // 检查必需字段
    const requiredFields = ['date', 'assetType', 'account', 'amount'];
    const missingFields = requiredFields.filter(field => !fieldMap.has(field as any));

    if (missingFields.length > 0) {
      const fieldNames: Record<string, string> = {
        date: '月份',
        assetType: '资产类型',
        account: '账户',
        amount: '投资金额'
      };
      onError(`CSV文件缺少必需列：${missingFields.map(f => fieldNames[f] || f).join(', ')}`);
      return;
    }

    // 解析数据行
    const records: InvestmentRecord[] = [];
    const validationErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // 处理带引号的CSV字段
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let charIndex = 0; charIndex < lines[i].length; charIndex++) {
        const char = lines[i][charIndex];
        const nextChar = lines[i][charIndex + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // 转义的引号
            currentValue += '"';
            charIndex++; // 跳过下一个引号
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue);

      if (values.length !== headers.length) {
        validationErrors.push(`第${i + 1}行：列数不匹配（期望${headers.length}列，实际${values.length}列）`);
        continue;
      }

      const record: any = {};

      fieldMap.forEach((index, field) => {
        const value = values[index]?.trim() || '';

        if (field === 'amount' || field === 'snapshot') {
          record[field] = value === '' ? undefined : parseFloat(value);
        } else if (field === 'depositTermMonths' || field === 'annualInterestRate') {
          record[field] = value === '' ? undefined : parseFloat(value);
        } else if (field === 'isTimeDeposit') {
          const boolValue = value.toLowerCase() === 'true' || value === '1' || value === 'TRUE';
          record[field] = boolValue;
        } else if (field === 'date' || field === 'assetType' || field === 'account' || field === 'maturityDate' || field === 'note') {
          record[field] = value || undefined;
        }
      });

      // 验证记录
      const validation = validateRecord(record, i + 1);
      if (validation.valid) {
        records.push({
          ...record,
          id: generateRecordId(record.assetType)
        } as InvestmentRecord);
      } else {
        validationErrors.push(validation.error!);
      }
    }

    if (validationErrors.length > 0) {
      onError(`数据验证失败：\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n...还有 ${validationErrors.length - 5} 个错误` : ''}`);
      return;
    }

    if (records.length === 0) {
      onError('CSV文件中没有有效的投资记录');
      return;
    }

    // 处理导入模式
    let recordsByType: RecordsByType = {};
    if (mode === 'append') {
      const existingData = localStorage.getItem('investmentRecords');
      recordsByType = existingData ? JSON.parse(existingData) : {};
    }

    // 按资产类型分组记录
    records.forEach(record => {
      if (!recordsByType[record.assetType]) {
        recordsByType[record.assetType] = [];
      }
      recordsByType[record.assetType].push(record);
    });

    // 保存到localStorage
    localStorage.setItem('investmentRecords', JSON.stringify(recordsByType));

    // 刷新页面
    window.location.reload();

    onSuccess(records.length);
  } catch (error) {
    onError(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
};
