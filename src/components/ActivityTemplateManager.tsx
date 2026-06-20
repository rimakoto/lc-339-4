import { useState, KeyboardEvent } from "react";
import { ClipboardList, Save, Play, X, Check, ChevronDown, Plus, Receipt, Scale, Users, Trash2 } from "lucide-react";
import { useAppStore } from "@/store";
import type { ShareType, ExpensePreset } from "@/types";

interface PresetFormState {
  name: string;
  defaultAmount: string;
  payerName: string;
  participantNames: string[];
  shareType: ShareType;
  shareWeights: Record<string, string>;
  note: string;
}

export default function ActivityTemplateManager() {
  const participants = useAppStore((s) => s.participants);
  const templates = useAppStore((s) => s.templates);
  const addTemplate = useAppStore((s) => s.addTemplate);
  const removeTemplate = useAppStore((s) => s.removeTemplate);
  const applyTemplate = useAppStore((s) => s.applyTemplate);
  const addExpensePreset = useAppStore((s) => s.addExpensePreset);
  const removeExpensePreset = useAppStore((s) => s.removeExpensePreset);

  const [templateName, setTemplateName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingPresetTo, setAddingPresetTo] = useState<string | null>(null);

  const [presetForm, setPresetForm] = useState<PresetFormState>({
    name: "",
    defaultAmount: "",
    payerName: "",
    participantNames: [],
    shareType: "equal",
    shareWeights: {},
    note: "",
  });

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

  const handleApplyTemplate = (id: string) => {
    const result = applyTemplate(id);
    if (result.addedExpenses > 0 || result.addedParticipants > 0) {
      const msg = [
        result.addedParticipants > 0 ? `添加了 ${result.addedParticipants} 位参与者` : "",
        result.addedExpenses > 0 ? `添加了 ${result.addedExpenses} 笔预设开销` : "",
      ].filter(Boolean).join("，");
      if (msg) {
        // 简单的提示效果，可以后续替换为 toast
        console.log(`模板套用成功：${msg}`);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const startAddPreset = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setAddingPresetTo(templateId);
    setPresetForm({
      name: "",
      defaultAmount: "",
      payerName: template.participants[0] || "",
      participantNames: [...template.participants],
      shareType: "equal",
      shareWeights: {},
      note: "",
    });
  };

  const cancelAddPreset = () => {
    setAddingPresetTo(null);
  };

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
    }
    setPresetForm((prev) => ({ ...prev, defaultAmount: parts.join(".") }));
  };

  const togglePresetParticipant = (name: string) => {
    setPresetForm((prev) => {
      const names = prev.participantNames.includes(name)
        ? prev.participantNames.filter((n) => n !== name)
        : [...prev.participantNames, name];
      return { ...prev, participantNames: names };
    });
  };

  const handleWeightChange = (name: string, value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    setPresetForm((prev) => ({
      ...prev,
      shareWeights: { ...prev.shareWeights, [name]: cleaned },
    }));
  };

  const getWeight = (name: string): number => {
    const val = parseFloat(presetForm.shareWeights[name] || "1");
    return isNaN(val) || val <= 0 ? 1 : val;
  };

  const getTotalWeight = (): number => {
    return presetForm.participantNames.reduce((sum, n) => sum + getWeight(n), 0);
  };

  const handleSavePreset = () => {
    if (!addingPresetTo) return;
    if (!presetForm.name.trim()) return;
    if (!presetForm.payerName) return;
    if (presetForm.participantNames.length === 0) return;

    const amount = parseFloat(presetForm.defaultAmount || "0");

    const shareWeights =
      presetForm.shareType === "weighted"
        ? presetForm.participantNames.map((n) => ({
            participantName: n,
            weight: getWeight(n),
          }))
        : [];

    addExpensePreset(addingPresetTo, {
      name: presetForm.name.trim(),
      defaultAmount: amount > 0 ? amount : null,
      payerName: presetForm.payerName,
      participantNames: presetForm.participantNames,
      shareType: presetForm.shareType,
      shareWeights,
      note: presetForm.note.trim(),
    });

    setAddingPresetTo(null);
  };

  const getShareTypeLabel = (type: ShareType) =>
    type === "weighted" ? "按比例" : "平均分摊";

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">活动模板</h2>
            <p className="text-sm text-gray-500">保存人员组合和分账方式，一键套用</p>
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
          {templates.map((t) => {
            const isExpanded = expandedId === t.id;
            const isAddingPreset = addingPresetTo === t.id;
            return (
              <div
                key={t.id}
                className="rounded-2xl bg-gradient-to-r from-purple-50/60 to-purple-50/30 border border-purple-100/60 hover:border-purple-200 transition-all overflow-hidden animate-fade-in"
              >
                <div className="flex items-center justify-between p-4">
                  <button
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    onClick={() => toggleExpand(t.id)}
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-purple-500 transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">{t.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                          {t.participants.length} 人
                        </span>
                        {t.expensePresets.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                            {t.expensePresets.length} 笔预设
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleApplyTemplate(t.id)}
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
                          if (expandedId === t.id) setExpandedId(null);
                        }
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="删除模板"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-purple-100/60 pt-4 animate-fade-in">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">参与者</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {t.participants.map((name, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-full bg-purple-100/70 text-purple-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          预设开销 ({t.expensePresets.length})
                        </h4>
                        {!isAddingPreset && (
                          <button
                            onClick={() => startAddPreset(t.id)}
                            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 inline mr-0.5" />
                            添加预设
                          </button>
                        )}
                      </div>

                      {isAddingPreset && (
                        <div className="p-3 rounded-xl bg-white/70 border border-emerald-100 mb-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <Receipt className="w-4 h-4 text-emerald-600" />
                              新增预设开销
                            </span>
                            <button
                              onClick={cancelAddPreset}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">名称</label>
                              <input
                                type="text"
                                value={presetForm.name}
                                onChange={(e) =>
                                  setPresetForm((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="如：聚餐"
                                className="input-field !py-2 text-sm"
                                maxLength={30}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">默认金额</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                  ¥
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={presetForm.defaultAmount}
                                  onChange={(e) => handleAmountChange(e.target.value)}
                                  placeholder="可选"
                                  className="input-field !py-2 !pl-7 text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">付款人</label>
                            <select
                              value={presetForm.payerName}
                              onChange={(e) =>
                                setPresetForm((p) => ({ ...p, payerName: e.target.value }))
                              }
                              className="input-field !py-2 text-sm"
                            >
                              {t.participants.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-500">
                                分摊方式
                              </label>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    setPresetForm((p) => ({ ...p, shareType: "equal" }))
                                  }
                                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                    presetForm.shareType === "equal"
                                      ? "bg-emerald-100 text-emerald-700 font-medium"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                >
                                  <Users className="w-3 h-3 inline mr-0.5" />
                                  平均
                                </button>
                                <button
                                  onClick={() =>
                                    setPresetForm((p) => ({ ...p, shareType: "weighted" }))
                                  }
                                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                    presetForm.shareType === "weighted"
                                      ? "bg-emerald-100 text-emerald-700 font-medium"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                >
                                  <Scale className="w-3 h-3 inline mr-0.5" />
                                  按比例
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">
                              分摊人员
                            </label>
                            <div className="space-y-1.5">
                              {t.participants.map((name) => {
                                const isSelected = presetForm.participantNames.includes(name);
                                return (
                                  <div
                                    key={name}
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                      isSelected ? "bg-emerald-50/70" : ""
                                    }`}
                                  >
                                    <button
                                      onClick={() => togglePresetParticipant(name)}
                                      className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                                        isSelected
                                          ? "bg-emerald-100 border-emerald-200 text-emerald-700 font-medium"
                                          : "bg-white border-gray-200 text-gray-500"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 inline mr-0.5" />}
                                      {name}
                                    </button>

                                    {isSelected && presetForm.shareType === "weighted" && (
                                      <div className="flex items-center gap-1.5 flex-1">
                                        <span className="text-xs text-gray-400">权重</span>
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={presetForm.shareWeights[name] || "1"}
                                          onChange={(e) =>
                                            handleWeightChange(name, e.target.value)
                                          }
                                          className="w-14 px-1.5 py-0.5 text-xs text-center rounded-md border border-emerald-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {presetForm.shareType === "weighted" &&
                              presetForm.participantNames.length > 0 && (
                                <p className="mt-1.5 text-xs text-gray-500">
                                  总权重: {getTotalWeight().toFixed(0)}
                                </p>
                              )}
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">备注</label>
                            <input
                              type="text"
                              value={presetForm.note}
                              onChange={(e) =>
                                setPresetForm((p) => ({ ...p, note: e.target.value }))
                              }
                              placeholder="可选"
                              className="input-field !py-2 text-sm"
                              maxLength={50}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={cancelAddPreset}
                              className="btn-ghost !py-2 text-sm"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleSavePreset}
                              disabled={
                                !presetForm.name.trim() ||
                                !presetForm.payerName ||
                                presetForm.participantNames.length === 0
                              }
                              className="btn-primary !py-2 text-sm"
                            >
                              <Check className="w-4 h-4" />
                              保存
                            </button>
                          </div>
                        </div>
                      )}

                      {t.expensePresets.length === 0 && !isAddingPreset && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          <Receipt className="w-8 h-8 mx-auto mb-1 opacity-40" />
                          <p>还没有预设开销</p>
                          <p className="text-xs">添加后，套用模板时会自动添加</p>
                        </div>
                      )}

                      {t.expensePresets.length > 0 && (
                        <div className="space-y-2">
                          {t.expensePresets.map((p) => (
                            <div
                              key={p.id}
                              className="group flex items-center justify-between p-3 rounded-xl bg-white/60 border border-purple-50 hover:border-purple-100 transition-all"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-gray-800 text-sm truncate">
                                    {p.name}
                                  </span>
                                  {p.defaultAmount != null && p.defaultAmount > 0 ? (
                                    <span className="text-sm font-bold text-amber-600">
                                      ¥{p.defaultAmount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">金额待定</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <p>
                                    付款: {p.payerName}
                                    {" · "}
                                    {getShareTypeLabel(p.shareType)}
                                    {" · "}
                                    {p.participantNames.length} 人分摊
                                  </p>
                                  {p.note && <p className="text-gray-400">备注: {p.note}</p>}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (window.confirm(`确定要删除预设「${p.name}」吗？`)) {
                                    removeExpensePreset(t.id, p.id);
                                  }
                                }}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="删除预设"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
