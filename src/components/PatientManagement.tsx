import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronRight, 
  FileText, 
  Calendar, 
  User, 
  Loader2, 
  ArrowLeft,
  Clock,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  X,
  Download,
  Printer,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { UserProfile, DetectionRecord } from '../types';

interface PatientManagementProps {
  doctor: UserProfile;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ doctor }) => {
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DetectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/consultation/patients');
      setPatients(response.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientRecords = async (patient: UserProfile) => {
    setLoadingRecords(true);
    setSelectedPatient(patient);
    try {
      const response = await axios.get(`/api/clinical-records/${patient.uid}`);
      setRecords(response.data.sort((a: any, b: any) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error("Failed to fetch patient records:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.includes(searchQuery) || p.username.includes(searchQuery) || p.uid.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium">正在调取全院患者档案库...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">患者管理中心</h2>
          <p className="text-xs text-text-muted mt-1 uppercase font-bold tracking-widest text-brand-blue">MedHeal Clinical Patient Registry</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="搜索患者姓名/ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-border-base rounded-2xl focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue outline-none transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[32px] border border-border-base overflow-hidden shadow-sm h-[600px] flex flex-col">
            <div className="p-6 border-b border-border-base flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-blue" />
                患者名录 ({filteredPatients.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredPatients.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-text-muted opacity-20" />
                  </div>
                  <p className="text-xs text-text-muted italic">未找到匹配的患者。请确保患者已完成系统注册。</p>
                </div>
              ) : (
                filteredPatients.map(patient => (
                  <button
                    key={patient.uid}
                    onClick={() => fetchPatientRecords(patient)}
                    className={`w-full p-4 flex items-center gap-4 cursor-pointer transition-all rounded-2xl ${
                      selectedPatient?.uid === patient.uid 
                        ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                        : 'hover:bg-slate-50 text-text-primary'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      selectedPatient?.uid === patient.uid ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-blue'
                    }`}>
                      {patient.name[0]}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-sm truncate">{patient.name}</div>
                      <div className={`text-[10px] font-medium opacity-60 truncate ${
                        selectedPatient?.uid === patient.uid ? 'text-white' : 'text-text-muted'
                      }`}>
                        ID: {patient.uid}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 opacity-40 ${selectedPatient?.uid === patient.uid ? 'text-white' : ''}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Records Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div
                key={selectedPatient.uid}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[32px] border border-border-base overflow-hidden shadow-sm min-h-[600px] flex flex-col"
              >
                {/* Patient Header */}
                <div className="p-8 border-b border-border-base bg-slate-50/50 flex flex-wrap gap-6 items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-[28px] border border-border-base shadow-sm flex items-center justify-center text-3xl font-black text-brand-blue">
                      {selectedPatient.name[0]}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-text-primary">{selectedPatient.name}</h2>
                        <span className="px-2 py-0.5 bg-brand-light text-brand-blue rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {selectedPatient.gender === 'male' ? '男性' : '女性'}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted font-medium flex items-center gap-2">
                        年龄: <span className="text-text-primary">{selectedPatient.age} 岁</span>
                        <span className="opacity-20">|</span>
                        注册日期: <span className="text-text-primary">{new Date(selectedPatient.createdAt || Date.now()).toLocaleDateString()}</span>
                      </p>
                      <div className="flex gap-2 pt-2">
                         <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-green-100">
                           <ShieldCheck className="w-3 h-3" /> 医保已验证
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Records List */}
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-blue" />
                      病理报告 & 智能筛查历史
                    </h3>
                  </div>

                  {loadingRecords ? (
                    <div className="py-20 flex flex-col items-center text-text-muted">
                      <Loader2 className="w-8 h-8 animate-spin mb-4" />
                      <p className="text-xs uppercase font-bold tracking-widest">调取临床记录中...</p>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="py-20 border-2 border-dashed border-slate-50 rounded-[32px] flex flex-col items-center text-center text-text-muted">
                      <FileText className="w-12 h-12 opacity-10 mb-4" />
                      <h4 className="text-sm font-bold text-text-secondary mb-1">暂无临床记录</h4>
                      <p className="text-xs max-w-xs">该患者尚未在该系统中进行过 AI 智能息肉分析或上传过检测记录。</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {records.map(record => (
                        <div 
                          key={record.id} 
                          onClick={() => setSelectedRecord(record)}
                          className="group bg-slate-50 border border-border-base rounded-[24px] p-5 hover:bg-white hover:border-brand-blue hover:shadow-xl hover:shadow-brand-blue/5 transition-all cursor-pointer"
                        >
                          <div className="flex gap-4 items-start mb-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-base flex-shrink-0">
                              <img src={record.imageUrl} alt="record" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest bg-brand-light px-2 py-0.5 rounded-md mb-1.5 inline-block">
                                  {record.resultType}
                                </span>
                                <span className="text-[10px] text-text-muted font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(record.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-text-primary line-clamp-2 leading-relaxed">
                                置信度指数: {record.confidence}% | {record.detectedPoints?.length || 0} 个异常热点
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-white border border-slate-100 rounded-xl mb-4">
                            <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3 italic">
                              “{record.aiReport}”
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">MedHeal AI Diagnostic Root</span>
                            <div className="flex items-center gap-2">
                               <button className="p-2 hover:bg-brand-light text-brand-blue rounded-lg transition-colors">
                                 <ExternalLink className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-[32px] border-2 border-dashed border-border-base h-full flex flex-col items-center justify-center p-20 text-center opacity-60">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6">
                  <Stethoscope className="w-10 h-10 text-text-muted opacity-20" />
                </div>
                <h3 className="text-xl font-black text-text-primary mb-2 uppercase tracking-tight">请从侧边栏选择记录</h3>
                <p className="text-sm text-text-muted max-w-sm leading-relaxed">
                  选择左侧患者名录中的成员，即可调取其完整的电子病历档案、AI 智能筛查报告以及历史临床趋势。
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-base flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center text-brand-blue">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">病理影像诊断报告详情</h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Diagnostic Report ID: {selectedRecord.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="p-2.5 bg-slate-50 text-text-muted hover:bg-slate-100 hover:text-text-primary rounded-xl transition-all"
                    title="打印报告"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedRecord(null)}
                    className="p-2.5 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Left: Image and Params */}
                  <div className="space-y-8">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-brand-blue/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative rounded-[32px] overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-200">
                        <img 
                          src={selectedRecord.imageUrl} 
                          alt="Intestinal imaging" 
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-brand-blue" />
                          临床内窥镜采样记录
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-border-base">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-2">AI 置信度指数</span>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-brand-blue">{selectedRecord.confidence}%</span>
                          <span className="text-[10px] text-text-muted mb-1">Confidence</span>
                        </div>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-border-base">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-2">推理耗时</span>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-text-primary">{selectedRecord.inferenceTime || '--'}</span>
                          <span className="text-[10px] text-text-muted mb-1">ms</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-[24px] border flex items-center gap-4 ${
                      selectedRecord.riskLevel === 'high' ? 'bg-red-50 border-red-100 text-red-700' :
                      selectedRecord.riskLevel === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                      'bg-green-50 border-green-100 text-green-700'
                    }`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        selectedRecord.riskLevel === 'high' ? 'bg-red-100' :
                        selectedRecord.riskLevel === 'medium' ? 'bg-amber-100' :
                        'bg-green-100'
                      }`}>
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest opacity-80 underline underline-offset-4 decoration-2 mb-1">临床风险等级评估</div>
                        <div className="text-lg font-black uppercase">
                          {selectedRecord.riskLevel === 'high' ? '高风险 (紧急建议活检)' :
                           selectedRecord.riskLevel === 'medium' ? '中风险 (建议内镜随访)' :
                           '低风险 (常规筛查)'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Report Text */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-border-base">
                      <h4 className="font-black text-xs text-text-primary uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-blue" />
                        AI 智能病理分析结论
                      </h4>
                      <span className="text-[10px] text-text-muted font-bold">生成于: {new Date(selectedRecord.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="prose prose-sm max-w-none prose-slate">
                      <div className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm relative">
                        <div className="absolute -top-3 -left-3 px-3 py-1 bg-brand-blue text-white text-[10px] font-black rounded-lg transform -rotate-2">
                          {selectedRecord.resultType}
                        </div>
                        <div className="markdown-body text-sm text-text-secondary leading-relaxed">
                          <ReactMarkdown>{selectedRecord.aiReport || ''}</ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-brand-light/20 rounded-2xl border border-brand-light">
                      <p className="text-[10px] text-brand-blue font-bold flex items-start gap-2 italic">
                        <Stethoscope className="w-4 h-4 flex-shrink-0" />
                        致医生：本报告由基于 RT-DETR 架构的息肉辅助诊察引擎自动生成，结论供参考。请结合临床表现及多模式影像进行最终定论。
                      </p>
                    </div>

                    <div className="pt-4 flex border-t border-dashed border-border-base">
                       <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-brand-blue text-white rounded-2xl font-bold transition-all hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20">
                         <Download className="w-4 h-4" />
                         导出 PDF 电子报告
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientManagement;
