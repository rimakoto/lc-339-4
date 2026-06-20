import { useState, KeyboardEvent } from "react";
import { Repeat, Plus, X, Check, ChevronDown, Zap } from "lucide-react";
import { useAppStore } from "@/store";
import type { RecurrenceType } from "@/types";

const recurrenceOptions: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: "monthly", label: "每月", icon: "📅" },
  { value: "weekly", label: "每周", icon: "📆" },
  { value: "daily", label: "每日", icon: "☀️" },
];

export default function RecurringExpenseManager() {
  const participants = useAppStore((s) => s.participants);
  const recurringExpenses = useAppStore((s) => s.recurringExpenses);
  const addRecurringExpense = useAppStore((s) => s.addRecurringExpense);
  const removeRecurringExpense = useAppStore((s) => s.removeRecurringExpense);
  const applyRecurringExpenses = useAppStore((s) => s.applyRecurringExpenses);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payerName, setPayerName] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("monthly");
  const [participantNamesStr, setParticipantNamesStr] = useState("");
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
    }
    setAmount(parts.join("."));
  };

  const resetForm = () => {
    setName("");
    setAmount("");
    setNote("");
    setPayerName("");
    setRecurrence("monthly");
    setParticipantNamesStr("");
    setShowForm(false);
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount || "0");
    const names = participantNamesStr
      .split(/[,，、\s]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (!name.trim() || numAmount <= 0 || !payerName.trim() || names.length === 0) return;

    addRecurringExpense({
      name: name.trim(),
      amount: numAmount,
      recurrence,
      payerName: payerName.trim(),
      participantNames: names,
      note: note.trim(),
    });

    resetForm();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit =
    name.trim() &&
    parseFloat(amount || "0") > 0 &&
    payerName.trim() &&
    participantNamesStr.split(/[,，、\s]+/).filter(Boolean).length > 0;

  const formatDate = (iso: string | null) => {
    if (!iso) return "尚未触发";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const selectedRecurrence = recurrenceOptions.find((o) => o.value === recurrence)!;

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Repeat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">重复开销</h2>
            <p className="text-sm text-gray-500">设置固定开销，到期自动追加</p>
          </div>
        </div>
        <div className="flex gap-2">
          {recurringExpenses.length > 0 && (
            <button
              onClick={applyRecurringExpenses}
              className="btn-ghost !bg-sky-50 !text-sky-700 hover:!bg-sky-100"
              title="立即触发到期的重复开销"
            >
              <Zap className="w-4 h-4" />
              <span>立即触发</span>
            </button>
          )}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4" />
              <span>新建规则</span>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mb-5 p-4 rounded-2xl bg-sky-50/50 border border-sky-100 animate-fade-in space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">规则名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="如：合租电费"
                className="input-field !py-2 text-sm"
                maxLength={30}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">金额 (元)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">¥</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0.00"
                  className="input-field !py-2 !pl-7 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">备注</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="可选，如：6月电费"
              className="input-field !py-2 text-sm"
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">付款人姓名</label>
              {participants.length > 0 ? (
                <select
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="input-field !py-2 text-sm"
                >
                  <option value="">选择付款人</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入姓名"
                  className="input-field !py-2 text-sm"
                  maxLength={20}
                />
              )}
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">重复周期</label>
              <button
                type="button"
                onClick={() => setShowRecurrenceDropdown(!showRecurrenceDropdown)}
                className="select-field !py-2 text-sm flex items-center justify-between w-full"
              >
                <span>
                  {selectedRecurrence.icon} {selectedRecurrence.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${showRecurrenceDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showRecurrenceDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-sky-200 rounded-xl shadow-lg overflow-hidden animate-fade-in">
                  {recurrenceOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setRecurrence(o.value);
                        setShowRecurrenceDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-sky-50 transition-colors flex items-center justify-between ${
                        recurrence === o.value ? "bg-sky-50 text-sky-700" : "text-gray-700"
                      }`}
                    >
                      <span>
                        {o.icon} {o.label}
                      </span>
                      {recurrence === o.value && <Check className="w-4 h-4 text-sky-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              分摊人员（用逗号或空格分隔）
            </label>
            <input
              type="text"
              value={participantNamesStr}
              onChange={(e) => setParticipantNamesStr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                participants.length > 0
                  ? `如：${participants.slice(0, 2).map((p) => p.name).join("、")}...`
                  : "如：小明、小红、小刚"
              }
              className="input-field !py-2 text-sm"
              maxLength={100}
            />
            {participantNamesStr && (
              <div className="flex flex-wrap gap-1 mt-2">
                {participantNamesStr
                  .split(/[,，、\s]+/)
                  .filter(Boolean)
                  .map((n, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700"
                    >
                      {n}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetForm} className="btn-ghost">
              <X className="w-4 h-4" />
              <span>取消</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              <span>创建规则</span>
            </button>
          </div>
        </div>
      )}

      {recurringExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Repeat className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>还没有重复开销规则</p>
          <p className="text-sm">点击"新建规则"设置固定开销</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringExpenses.map((re) => {
            const rec = recurrenceOptions.find((o) => o.value === re.recurrence)!;
            return (
              <div
                key={re.id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-50/60 to-sky-50/30 border border-sky-100/60 hover:border-sky-200 transition-all animate-fade-in"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-800 truncate">{re.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      ¥{re.amount.toFixed(2)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                      {rec.icon} {rec.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>
                      付款人：<span className="text-gray-700">{re.payerName}</span>
                      {" · "}
                      分摊：<span className="text-gray-700">{re.participantNames.join("、")}</span>
                    </p>
                    <p>
                      {re.note && <span>备注：{re.note} · </span>}
                      上次触发：<span className="text-sky-600">{formatDate(re.lastAppliedAt)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => {
                      if (window.confirm(`确定要删除重复规则「${re.name}」吗？`)) {
                        removeRecurringExpense(re.id);
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="删除规则"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recurringExpenses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-sky-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 <span className="font-semibold text-sky-700">{recurringExpenses.length}</span> 条重复规则
          </p>
          <p className="text-xs text-gray-400">
            打开应用时会自动检查并追加到期开销
          </p>
        </div>
      )}
    </div>
  );
}
