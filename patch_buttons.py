import sys

path = 'src/App.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_content = """                          <div className="flex gap-3">
                            <button 
                              onClick={handleExportPDF}
                              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              导出 PDF 存档
                            </button>
                            <button 
                              onClick={handleSyncToCase}
                              disabled={isSyncing}
                              className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-xl shadow-slate-300 active:scale-95 flex items-center gap-2 disabled:opacity-70"
                            >
                              {isSyncing ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Cloud className="w-4 h-4" />
                              )}
                              同步至个人病历
                            </button>
                          </div>
"""

# Check content to be safe
# 758 is lines[757]
found = False
for i in range(len(lines)):
    if 'flex gap-3' in lines[i] and i+1 < len(lines) and '导出 PDF 存档' in lines[i+2]:
        lines[i:i+8] = [new_content]
        found = True
        break

if found:
    with open(path, 'w') as f:
        f.writelines(lines)
    print("Success")
else:
    print("Failed to find target block")
