import { useState } from "react";
import { Receipt, Plus, Check, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store";
import { round2 } from "@/utils/settlement";

export default function ExpenseForm() {
  const participants = useAppStore((s) => s.participants);
  const addExpense = useAppStore((s) => s.addExpense);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payerId, setPayerId] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showPayerDropdown, setShowPayerDropdown] = useState(false);

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

  const handleSubmit = () => {
    const numAmount = round2(parseFloat(amount || "0"));
    if (numAmount <= 0) return;
    if (!payerId) return;
    if (selectedParticipants.length === 0) return;

    addExpense({
      amount: numAmount,
      payerId,
      participantIds: selectedParticipants,
      note: note.trim(),
    });

    setAmount("");
    setNote("");
    setSelectedParticipants([]);
  };

  const canSubmit =
    parseFloat(amount || "0") > 0 &&
    payerId &&
    selectedParticipants.length > 0;

  const selectedPayer = participants.find((p) => p.id === payerId);

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
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-amber-100 bg-amber-50/30 min-h-[60px]">
              {participants.map((p) => {
                const isSelected = selectedParticipants.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className={`tag cursor-pointer transition-all ${
                      isSelected
                        ? "tag-emerald shadow-sm"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {p.name}
                  </button>
                );
              })}
              {participants.length === 0 && (
                <span className="text-sm text-gray-400">请先添加参与者</span>
              )}
            </div>
            {amount && selectedParticipants.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                每人分摊:{" "}
                <span className="font-semibold text-amber-700">
                  ¥{(parseFloat(amount) / selectedParticipants.length).toFixed(2)}
                </span>
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
