import { useState, KeyboardEvent } from "react";
import { ClipboardList, Save, Play, X, Check } from "lucide-react";
import { useAppStore } from "@/store";

export default function ActivityTemplateManager() {
  const participants = useAppStore((s) => s.participants);
  const templates = useAppStore((s) => s.templates);
  const addTemplate = useAppStore((s) => s.addTemplate);
  const removeTemplate = useAppStore((s) => s.removeTemplate);
  const applyTemplate = useAppStore((s) => s.applyTemplate);

  const [templateName, setTemplateName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSaveTemplate = () => {
    if (templateName.trim() && participants.length > 0) {
      addTemplate(
        templateName,
        participants.map((p) => p.name)
      );
      setTemplateName("");
      setShowForm(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTemplate();
    }
  };

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">活动模板</h2>
            <p className="text-sm text-gray-500">保存常用人员组合，一键套用</p>
          </div>
        </div>
        {participants.length > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-secondary"
          >
            <Save className="w-4 h-4" />
            <span>保存为模板</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-5 p-4 rounded-2xl bg-purple-50/50 border border-purple-100 animate-fade-in">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="模板名称，如：周末饭局模板"
              className="input-field flex-1"
              maxLength={30}
              autoFocus
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              <span>保存</span>
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setTemplateName("");
              }}
              className="btn-ghost"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            即将保存 {participants.length} 位参与者：
            {participants.map((p) => p.name).join("、")}
          </p>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>还没有创建模板</p>
          <p className="text-sm">添加参与者后点击"保存为模板"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 to-purple-50/30 border border-purple-100/60 hover:border-purple-200 transition-all animate-fade-in"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                    {t.participants.length} 人
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {t.participants.join("、")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <button
                  onClick={() => applyTemplate(t.id)}
                  className="btn-secondary !px-3 !py-2 text-sm"
                  title="套用此模板"
                >
                  <Play className="w-4 h-4" />
                  <span>套用</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`确定要删除模板「${t.name}」吗？`)) {
                      removeTemplate(t.id);
                    }
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="删除模板"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-100">
          <p className="text-sm text-gray-500">
            共 <span className="font-semibold text-purple-700">{templates.length}</span> 个模板
          </p>
        </div>
      )}
    </div>
  );
}
