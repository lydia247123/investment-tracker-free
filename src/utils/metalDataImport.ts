import { PreciousMetalRecord, PreciousMetalType, RecordsByMetalType } from '../types/preciousMetal';

const VALID_METAL_TYPES: PreciousMetalType[] = ['黄金', '白银', '铂金', '钯金'];

/**
 * 验证贵金属记录
 */
const validateRecord = (record: any, lineNumber?: number): { valid: boolean; error?: string } => {
  // 检查必需字段
  if (!record.metalType || typeof record.metalType !== 'string') {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：缺少贵金属类型` : '缺少贵金属类型' };
  }

  if (!VALID_METAL_TYPES.includes(record.metalType as PreciousMetalType)) {
    return {
      valid: false,
      error: lineNumber ? `第${lineNumber}行：贵金属类型"${record.metalType}"不支持` : `贵金属类型"${record.metalType}"不支持`
    };
  }

  if (!record.date || !/^\d{4}-\d{2}$/.test(record.date)) {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：日期格式错误，应为YYYY-MM` : '日期格式错误' };
  }

  if (typeof record.grams !== 'number' || record.grams <= 0) {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：购买克数必须大于0` : '购买克数必须大于0' };
  }

  if (typeof record.pricePerGram !== 'number' || record.pricePerGram <= 0) {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：每克金额必须大于0` : '每克金额必须大于0' };
  }

  if (typeof record.averagePrice !== 'number' || record.averagePrice <= 0) {
    return { valid: false, error: lineNumber ? `第${lineNumber}行：当月均价必须大于0` : '当月均价必须大于0' };
  }

  return { valid: true };
};

/**
 * 生成新的记录ID
 */
const generateRecordId = (metalType: PreciousMetalType): string => {
  return `metal-${metalType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 从JSON文件导入贵金属数据
 */
export const importMetalDataFromJSON = async (
  file: File,
  mode: 'overwrite' | 'append',
  onSuccess: (importedCount: number) => void,
  onError: (error: string) => void
) => {
  try {
    // 读取文件
    const text = await file.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      onError('JSON文件格式错误，请检查文件是否损坏');
      return;
    }

    // 验证数据结构
    if (!data || typeof data !== 'object') {
      onError('JSON文件内容格式不正确');
      return;
    }

    // 收集所有记录
    let records: PreciousMetalRecord[] = [];

    // 如果是按类型分组的结构
    if (data.黄金 || data.白银 || data.铂金 || data.钯金) {
      VALID_METAL_TYPES.forEach(type => {
        if (data[type] && Array.isArray(data[type])) {
          records = [...records, ...data[type]];
        }
      });
    }
    // 如果是数组结构
    else if (Array.isArray(data)) {
      records = data;
    } else {
      onError('JSON文件数据结构不正确，请使用导出的格式');
      return;
    }

    if (records.length === 0) {
      onError('JSON文件中没有有效的贵金属记录');
      return;
    }

    // 验证所有记录
    const validationErrors: string[] = [];
    const validRecords: PreciousMetalRecord[] = [];

    records.forEach((record, index) => {
      const validation = validateRecord(record, index + 1);
      if (validation.valid) {
        // 生成新ID并添加到有效记录
        validRecords.push({
          ...record,
          id: generateRecordId(record.metalType)
        });
      } else {
        validationErrors.push(validation.error!);
      }
    });

    if (validationErrors.length > 0) {
      onError(`数据验证失败：\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n...还有 ${validationErrors.length - 5} 个错误` : ''}`);
      return;
    }

    // 导入有效记录
    if (validRecords.length > 0) {
      // 获取现有数据
      const existingData = localStorage.getItem('preciousMetalRecords');
      let recordsByMetalType: RecordsByMetalType = existingData ? JSON.parse(existingData) : {
        '黄金': [],
        '白银': [],
        '铂金': [],
        '钯金': []
      };

      if (mode === 'overwrite') {
        // 覆盖模式：清空所有数据
        recordsByMetalType = {
          '黄金': [],
          '白银': [],
          '铂金': [],
          '钯金': []
        };
      }

      // 按类型分组记录
      validRecords.forEach(record => {
        recordsByMetalType[record.metalType].push(record);
      });

      // 保存到localStorage
      localStorage.setItem('preciousMetalRecords', JSON.stringify(recordsByMetalType));

      // 刷新页面
      window.location.reload();

      onSuccess(validRecords.length);
    }
  } catch (error) {
    onError(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 从CSV文件导入贵金属数据
 */
export const importMetalDataFromCSV = async (
  file: File,
  mode: 'overwrite' | 'append',
  onSuccess: (importedCount: number) => void,
  onError: (error: string) => void
) => {
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

    // 解析标题行
    const headers = lines[0].split(',').map(h => h.trim());

    // 映射列名到字段
    const fieldMap = new Map<string, keyof PreciousMetalRecord>();
    headers.forEach((header, index) => {
      if (header === '贵金属类型' || header === 'metalType') fieldMap.set('metalType' as any, index);
      else if (header === '月份' || header === 'date') fieldMap.set('date' as any, index);
      else if (header === '购买克数' || header === 'grams') fieldMap.set('grams' as any, index);
      else if (header === '每克金额' || header === 'pricePerGram') fieldMap.set('pricePerGram' as any, index);
      else if (header === '当月均价' || header === 'averagePrice') fieldMap.set('averagePrice' as any, index);
      else if (header === '备注' || header === 'note') fieldMap.set('note' as any, index);
    });

    // 检查必需字段
    const requiredFields = ['metalType', 'date', 'grams', 'pricePerGram', 'averagePrice'];
    const missingFields = requiredFields.filter(field => !fieldMap.has(field as any));

    if (missingFields.length > 0) {
      onError(`CSV文件缺少必需列：${missingFields.join(', ')}`);
      return;
    }

    // 解析数据行
    const records: PreciousMetalRecord[] = [];
    const validationErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      if (values.length !== headers.length) {
        validationErrors.push(`第${i + 1}行：列数不匹配`);
        continue;
      }

      const record: any = {};

      fieldMap.forEach((index, field) => {
        const value = values[index];

        if (field === 'grams' || field === 'pricePerGram' || field === 'averagePrice') {
          record[field] = parseFloat(value);
        } else {
          record[field] = value;
        }
      });

      // 验证记录
      const validation = validateRecord(record, i + 1);
      if (validation.valid) {
        records.push({
          ...record,
          id: generateRecordId(record.metalType)
        });
      } else {
        validationErrors.push(validation.error!);
      }
    }

    if (validationErrors.length > 0) {
      onError(`数据验证失败：\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n...还有 ${validationErrors.length - 5} 个错误` : ''}`);
      return;
    }

    if (records.length === 0) {
      onError('CSV文件中没有有效的贵金属记录');
      return;
    }

    // 导入有效记录
    const existingData = localStorage.getItem('preciousMetalRecords');
    let recordsByMetalType: RecordsByMetalType = existingData ? JSON.parse(existingData) : {
      '黄金': [],
      '白银': [],
      '铂金': [],
      '钯金': []
    };

    if (mode === 'overwrite') {
      // 覆盖模式：清空所有数据
      recordsByMetalType = {
        '黄金': [],
        '白银': [],
        '铂金': [],
        '钯金': []
      };
    }

    // 按类型分组记录
    records.forEach(record => {
      recordsByMetalType[record.metalType].push(record);
    });

    // 保存到localStorage
    localStorage.setItem('preciousMetalRecords', JSON.stringify(recordsByMetalType));

    // 刷新页面
    window.location.reload();

    onSuccess(records.length);
  } catch (error) {
    onError(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
};
