import { useState } from 'react';
import { importInvestmentDataFromCSV } from '@utils/investmentDataImport';

interface InvestmentImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const InvestmentImportDialog: React.FC<InvestmentImportDialogProps> = ({
  open,
  onClose,
  onImportComplete
}) => {
  const [fileContent, setFileContent] = useState<{ content: string; fileName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [preview, setPreview] = useState<{
    recordCount: number;
    assetTypes: string[];
    accounts: string[];
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

      // 检查文件类型（只支持CSV）
      if (!fileName.endsWith('.csv')) {
        alert('❌ 只支持CSV格式文件');
        setFileContent(null);
        return;
      }

      // 解析CSV进行预览
      try {
        const csvText = content.replace(/^\ufeff/, '');
        const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim());

        if (lines.length < 2) {
          alert('❌ CSV文件内容为空或格式不正确');
          setFileContent(null);
          return;
        }

        const headers = lines[0].split(',').map((h: string) => h.trim());
        const recordCount = lines.length - 1; // 减去标题行

        // 提取资产类型和账户信息（从前几行）
        const assetTypes = new Set<string>();
        const accounts = new Set<string>();

        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const values = lines[i].split(',').map((v: string) => v.trim());
          const assetTypeIndex = headers.findIndex((h: string) =>
            h === '资产类型' || h === 'assetType'
          );
          const accountIndex = headers.findIndex((h: string) =>
            h === '账户' || h === 'account'
          );

          if (assetTypeIndex >= 0 && values[assetTypeIndex]) {
            assetTypes.add(values[assetTypeIndex].replace(/^"|"$/g, ''));
          }
          if (accountIndex >= 0 && values[accountIndex]) {
            accounts.add(values[accountIndex].replace(/^"|"$/g, ''));
          }
        }

        setPreview({
          recordCount,
          assetTypes: Array.from(assetTypes),
          accounts: Array.from(accounts)
        });
      } catch (error) {
        alert('❌ CSV文件格式错误：无法解析文件内容');
        setFileContent(null);
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
      type: 'text/csv'
    });

    importInvestmentDataFromCSV(
      mockFile,
      importMode,
      (count) => {
        setLoading(false);
        alert(`✅ 导入成功！已导入 ${count} 条记录`);
        onImportComplete();
      },
      (error) => {
        setLoading(false);
        alert(`❌ 导入失败：\n${error}`);
      }
    );
  };

  const handleReset = () => {
    setFileContent(null);
    setPreview(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📥 导入投资数据
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* 说明文字 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 使用说明：</strong>
              <br />
              • 支持CSV格式文件导入（使用UTF-8编码）
              <br />
              • 导入模式：追加模式（保留现有数据，添加新记录）
              <br />
              • 必需字段：月份、资产类型、账户、投资金额
              <br />
              • 可选字段：快照金额、备注
              <br />
              • 定期存款额外字段：是否定期存款、存期(月)、年化利率(%)、到期日期
            </p>
          </div>

          {/* 文件选择按钮 */}
          {!fileContent && (
            <div className="text-center py-8">
              <button
                onClick={handleSelectFile}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-lg"
              >
                📁 选择CSV文件
              </button>
            </div>
          )}

          {/* 文件预览 */}
          {fileContent && preview && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📄 文件信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件名：</span>
                    <span className="font-medium">{fileContent.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">记录数量：</span>
                    <span className="font-medium">{preview.recordCount} 条</span>
                  </div>
                  {preview.assetTypes.length > 0 && (
                    <div>
                      <span className="text-gray-600">资产类型：</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {preview.assetTypes.map(type => (
                          <span key={type} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {preview.accounts.length > 0 && (
                    <div>
                      <span className="text-gray-600">账户：</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {preview.accounts.map(account => (
                          <span key={account} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {account}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 导入模式选择 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">⚙️ 导入模式</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">追加模式 (保留现有数据)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'overwrite'}
                      onChange={() => setImportMode('overwrite')}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">覆盖模式 (删除现有数据)</span>
                  </label>
                </div>
              </div>

              {/* 导入说明 */}
              <div className={`${importMode === 'overwrite' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4 transition-colors`}>
                <p className={`text-sm ${importMode === 'overwrite' ? 'text-red-900' : 'text-yellow-900'}`}>
                  <strong>⚠️ 导入提示：</strong>
                  <br />
                  {importMode === 'overwrite' ? (
                    <>• <strong>警告：</strong>将删除所有现有的投资记录，并替换为文件中的数据！</>
                  ) : (
                    <>• 数据将采用<strong>追加模式</strong>导入，不会影响现有数据</>
                  )}
                  <br />
                  • 导入后页面将自动刷新
                </p>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? '⏳ 导入中...' : '✅ 确认导入'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  🔄 重新选择
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
