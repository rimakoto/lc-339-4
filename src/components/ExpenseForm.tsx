import { useState, KeyboardEvent } from "react";
import { Receipt, Plus, Check, ChevronDown, Scale, Users } from "lucide-react";
import { useAppStore } from "@/store";
import { round2 } from "@/utils/settlement";
import type { ShareType, ShareWeight } from "@/types";

export default function ExpenseForm() {
  const participants = useAppStore((s) => s.participants);
  const addExpense = useAppStore((s) => s.addExpense);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payerId, setPayerId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [shareType, setShareType] = useState<ShareType>("equal");
  const [shareWeights, setShareWeights] = useState<Record<string, string>>({});
  const [showPayerDropdown, setShowPayerDropdown] = useState(false);
  const [showShareTypeDropdown, setShowShareTypeDropdown] = useState(false);

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
    }
    setAmount(parts.join("."));
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedParticipants(participants.map((p) => p.id));
  };

  const clearSelection = () => {
    setSelectedParticipants([]);
  };

  const handleWeightChange = (participantId: string, value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    setShareWeights((prev) => ({ ...prev, [participantId]: cleaned }));
  };

  const getWeight = (participantId: string): number => {
    const val = parseFloat(shareWeights[participantId] || "1");
    return isNaN(val) || val <= 0 ? 1 : val;
  };

  const getTotalWeight = (): number => {
    return selectedParticipants.reduce((sum, pid) => sum + getWeight(pid), 0);
  };

  const getShareAmount = (participantId: string): number => {
    const numAmount = parseFloat(amount || "0");
    if (numAmount <= 0 || selectedParticipants.length === 0) return 0;

    if (shareType === "weighted") {
      const totalWeight = getTotalWeight();
      if (totalWeight <= 0) return 0;
      return round2((numAmount * getWeight(participantId)) / totalWeight);
    }

    return round2(numAmount / selectedParticipants.length);
  };

  const getSharePercentage = (participantId: string): number => {
    if (shareType !== "weighted") return 0;
    const totalWeight = getTotalWeight();
    if (totalWeight <= 0) return 0;
    return round2((getWeight(participantId) / totalWeight) * 100);
  };

  const handleSubmit = () => {
    const numAmount = round2(parseFloat(amount || "0"));
    if (numAmount <= 0) return;
    if (!payerId) return;
    if (selectedParticipants.length === 0) return;

    const weights: ShareWeight[] =
      shareType === "weighted"
        ? selectedParticipants.map((pid) => ({
            participantId: pid,
            weight: getWeight(pid),
          }))
        : [];

    addExpense({
      amount: numAmount,
      payerId,
      participantIds: selectedParticipants,
      note: note.trim(),
      shareType,
      shareWeights: weights,
    });

    setAmount("");
    setNote("");
    setSelectedParticipants([]);
    setShareWeights({});
  };

  const canSubmit =
    parseFloat(amount || "0") > 0 &&
    payerId &&
    selectedParticipants.length > 0;

  const selectedPayer = participants.find((p) => p.id === payerId);

  const shareTypeOptions = [
    { value: "equal" as ShareType, label: "平均分摊", icon: Users },
    { value: "weighted" as ShareType, label: "按比例分摊", icon: Scale },
  ];
  const selectedShareType = shareTypeOptions.find((o) => o.value === shareType)!;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "50ms" }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-gray-800">添加开销</h2>
          <p className="text-sm text-gray-500">记录一笔一笔的花费明细</p>
        </div>
      </div>

      {participants.length < 2 ? (
        <div className="text-center py-8 text-gray-400">
          <Receipt className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>至少需要 2 位参与者</p>
          <p className="text-sm">请先添加参与者再录入开销</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              金额 (元)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                ¥
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                className="input-field pl-8 text-xl font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              备注说明
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如：午餐、打车、门票..."
              className="input-field"
              maxLength={50}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              付款人
            </label>
            <button
              type="button"
              onClick={() => setShowPayerDropdown(!showPayerDropdown)}
              className="select-field flex items-center justify-between w-full"
            >
              <span className={selectedPayer ? "text-gray-800" : "text-gray-400"}>
                {selectedPayer ? selectedPayer.name : "请选择谁付的钱"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showPayerDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showPayerDropdown && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-amber-200 rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPayerId(p.id);
                      setShowPayerDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-center justify-between ${
                      payerId === p.id ? "bg-amber-50 text-amber-800" : "text-gray-700"
                    }`}
                  >
                    <span>{p.name}</span>
                    {payerId === p.id && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分摊方式
            </label>
            <button
              type="button"
              onClick={() => setShowShareTypeDropdown(!showShareTypeDropdown)}
              className="select-field flex items-center justify-between w-full"
            >
              <span className="flex items-center gap-2 text-gray-700">
                <selectedShareType.icon className="w-4 h-4 text-emerald-600" />
                {selectedShareType.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showShareTypeDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showShareTypeDropdown && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-emerald-200 rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                {shareTypeOptions.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setShareType(o.value);
                      setShowShareTypeDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                      shareType === o.value ? "bg-emerald-50 text-emerald-800" : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <o.icon className="w-4 h-4" />
                      {o.label}
                    </span>
                    {shareType === o.value && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                参与分摊 ({selectedParticipants.length} 人)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  全选
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-medium text-gray-600 hover:text-gray-700 px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  清空
                </button>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-2xl border border-amber-100 bg-amber-50/30 min-h-[60px]">
              {participants.length === 0 && (
                <span className="text-sm text-gray-400">请先添加参与者</span>
              )}
              {participants.map((p) => {
                const isSelected = selectedParticipants.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                      isSelected ? "bg-white/70" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleParticipant(p.id)}
                      className={`tag cursor-pointer transition-all flex-shrink-0 ${
                        isSelected
                          ? "tag-emerald shadow-sm"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {p.name}
                    </button>

                    {isSelected && shareType === "weighted" && (
                      <>
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-xs text-gray-500 w-10">权重:</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={shareWeights[p.id] || "1"}
                            onChange={(e) => handleWeightChange(p.id, e.target.value)}
                            className="w-16 px-2 py-1 text-sm text-center rounded-lg border border-emerald-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                          <span className="text-xs text-gray-500 w-12 text-right">
                              {getSharePercentage(p.id).toFixed(0)}%
                            </span>
                          <span className="text-xs font-medium text-amber-600 w-20 text-right">
                            ¥{getShareAmount(p.id).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}

                    {isSelected && shareType === "equal" && amount && (
                      <span className="text-xs text-amber-600 font-medium ml-auto">
                        ¥{getShareAmount(p.id).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {shareType === "weighted" && selectedParticipants.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                总权重: <span className="font-semibold text-emerald-700">{getTotalWeight().toFixed(0)}</span>
                {amount && (
                  <span className="ml-2">
                  · 每人分摊金额根据权重比例计算
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary w-full"
          >
            <Plus className="w-5 h-5" />
            <span>添加这笔开销</span>
          </button>
        </div>
      )}
    </div>
  );
}
