import { useState } from 'react';
import { importMetalDataFromJSON, importMetalDataFromCSV } from '@utils/metalDataImport';

interface MetalImportDialogProps {
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const MetalImportDialog: React.FC<MetalImportDialogProps> = ({
  onClose,
  onImportSuccess
}) => {
  const [fileContent, setFileContent] = useState<{ content: string; fileName: string } | null>(null);
  const [mode, setMode] = useState<'overwrite' | 'append'>('append');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    type: 'json' | 'csv' | null;
    recordCount: number;
    types: string[];
  } | null>(null);

  const handleSelectFile = async () => {
    try {
      // 使用Electron的文件选择对话框
      const result = await (window as any).electronAPI.selectAndReadFile();

      if (!result.success) {
        if (result.canceled) {
          // 用户取消了选择
          return;
        }
        alert(`❌ 选择文件失败：${result.error}`);
        return;
      }

      const { content, fileName } = result;
      setFileContent({ content, fileName });
      setPreview(null); // 重置预览

      // 检测文件类型
      const fileType = fileName.endsWith('.csv') ? 'csv' : 'json';

      // 解析文件进行预览
      if (fileType === 'json') {
        try {
          const data = JSON.parse(content);
          let count = 0;
          const types: string[] = [];

          if (data.黄金 || data.白银 || data.铂金 || data.钯金) {
            Object.keys(data).forEach(type => {
              if (Array.isArray(data[type]) && data[type].length > 0) {
                count += data[type].length;
                types.push(`${type}: ${data[type].length}条`);
              }
            });
          } else if (Array.isArray(data)) {
            count = data.length;
            const typeCount = new Set(data.map(r => r.metalType));
            types.push(`共${typeCount.size}种类型`);
          }

          setPreview({ type: 'json', recordCount: count, types });
        } catch (error) {
          alert('❌ JSON文件格式错误：无法解析文件内容');
          setFileContent(null);
        }
      } else {
        // CSV预览
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        const recordCount = Math.max(0, lines.length - 1); // 减去标题行
        setPreview({ type: 'csv', recordCount, types: [`约${recordCount}条记录`] });
      }
    } catch (error) {
      alert(`❌ 读取文件失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleImport = async () => {
    if (!fileContent) {
      alert('请先选择要导入的文件');
      return;
    }

    setLoading(true);

    // 创建一个模拟的File对象
    const mockFile = new File([fileContent.content], fileContent.fileName, {
      type: fileContent.fileName.endsWith('.csv') ? 'text/csv' : 'application/json'
    });

    const importFunc = fileContent.fileName.endsWith('.csv')
      ? importMetalDataFromCSV
      : importMetalDataFromJSON;

    importFunc(
      mockFile,
      mode,
      (count) => {
        setLoading(false);
        onImportSuccess(count);
      },
      (error) => {
        setLoading(false);
        alert(`❌ ${error}`);
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">📥 导入贵金属数据</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 文件选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择文件（JSON或CSV格式）
          </label>
          <button
            onClick={handleSelectFile}
            className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all flex flex-col items-center gap-2"
          >
            <span className="text-4xl">📁</span>
            <span className="text-gray-600">点击选择文件</span>
            <span className="text-sm text-gray-400">支持 .json 和 .csv 格式</span>
          </button>
          {fileContent && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ 已选择：{fileContent.fileName}
              </p>
            </div>
          )}
        </div>

        {/* 导入模式选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            导入模式
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={mode === 'append'}
                onChange={(e) => setMode(e.target.value as 'overwrite' | 'append')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">➕ 追加模式</div>
                <div className="text-sm text-gray-500">保留现有数据，添加新记录</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="importMode"
                value="overwrite"
                checked={mode === 'overwrite'}
                onChange={(e) => setMode(e.target.value as 'overwrite' | 'append')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">🔄 覆盖模式</div>
                <div className="text-sm text-gray-500">清空现有数据，仅保留导入的记录</div>
              </div>
            </label>
          </div>
        </div>

        {/* 预览区域 */}
        {preview && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">📋 导入预览</h4>
            <div className="text-sm text-amber-800">
              <div>文件类型：{preview.type === 'json' ? 'JSON' : 'CSV'}</div>
              <div>记录数量：约{preview.recordCount}条</div>
              {preview.types.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">包含类型：</div>
                  <ul className="ml-4 list-disc">
                    {preview.types.map((type, index) => (
                      <li key={index}>{type}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>提示</strong>：
            {mode === 'overwrite'
              ? ' 覆盖模式将清空所有现有贵金属数据，请谨慎操作！建议先导出备份。'
              : ' 追加模式将保留现有数据，新记录将添加到现有记录中。'}
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={!fileContent || loading}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              !fileContent || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg'
            }`}
          >
            {loading ? '⏳ 导入中...' : '✅ 确认导入'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
