import { useMemo, useState } from "react";
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Download,
  PartyPopper,
} from "lucide-react";
import { useAppStore } from "@/store";
import { calculateBalances, calculateSettlements } from "@/utils/settlement";
import { generateExportText, downloadTextFile, getExportFilename } from "@/utils/export";

export default function SettlementResult() {
  const participants = useAppStore((s) => s.participants);
  const expenses = useAppStore((s) => s.expenses);
  const [hasCalculated, setHasCalculated] = useState(false);

  const balances = useMemo(
    () => calculateBalances(participants, expenses),
    [participants, expenses]
  );

  const settlements = useMemo(
    () => calculateSettlements(participants, expenses),
    [participants, expenses]
  );

  const handleCalculate = () => {
    setHasCalculated(true);
  };

  const handleExport = () => {
    const content = generateExportText(participants, expenses);
    downloadTextFile(getExportFilename(), content);
  };

  const canCalculate = participants.length >= 2 && expenses.length > 0;

  const getBalanceIcon = (balance: number) => {
    if (balance > 0.01) {
      return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    }
    if (balance < -0.01) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getBalanceClass = (balance: number) => {
    if (balance > 0.01) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (balance < -0.01) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0.01) return `应收 ¥${balance.toFixed(2)}`;
    if (balance < -0.01) return `应付 ¥${Math.abs(balance).toFixed(2)}`;
    return "持平";
  };

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">
              结算结果
            </h2>
            <p className="text-sm text-gray-500">
              {hasCalculated ? "最优转账方案已生成" : "点击计算查看最优转账方案"}
            </p>
          </div>
        </div>

        {hasCalculated && (
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />
            <span>导出清单</span>
          </button>
        )}
      </div>

      {!canCalculate ? (
        <div className="text-center py-10 text-gray-400">
          <Calculator className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>暂无法计算</p>
          <p className="text-sm">
            需要至少 2 位参与者和 1 笔开销记录
          </p>
        </div>
      ) : !hasCalculated ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <Sparkles className="w-16 h-16 mx-auto text-amber-400 animate-bounce-soft" />
          </div>
          <p className="text-gray-600 mb-6">
            已录入 {expenses.length} 笔开销，共 {participants.length} 人参与
          </p>
          <button onClick={handleCalculate} className="btn-primary text-lg px-8 py-4">
            <Calculator className="w-5 h-5" />
            <span>开始计算最优方案</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              个人账目明细
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {balances.map((b) => (
                <div
                  key={b.participantId}
                  className={`p-3 rounded-2xl border ${getBalanceClass(b.balance)}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {getBalanceIcon(b.balance)}
                    <span className="font-semibold">{b.name}</span>
                  </div>
                  <p className="text-lg font-bold font-display">
                    {getBalanceText(b.balance)}
                  </p>
                  <p className="text-xs opacity-70 mt-0.5">
                    已付 ¥{b.paid.toFixed(2)} · 应摊 ¥{b.share.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              最优结算方案 ({settlements.length} 笔转账)
            </h3>

            {settlements.length === 0 ? (
              <div className="text-center py-8 bg-gradient-to-r from-emerald-50 to-amber-50 rounded-3xl border border-emerald-200">
                <PartyPopper className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p className="text-lg font-semibold text-emerald-700">
                  🎉 账目已平！
                </p>
                <p className="text-sm text-emerald-600/80">
                  无需任何转账，大家两清啦
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-50/80 via-amber-50 to-emerald-50/80 border border-amber-100 hover:shadow-md transition-all animate-slide-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="font-bold text-red-700 text-sm">
                          {s.from.charAt(0)}
                        </span>
                      </div>
                      <p className="font-semibold text-red-700 text-sm">
                        {s.from}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-amber-200">
                        <ArrowRight className="w-5 h-5 text-amber-500" />
                        <span className="font-bold font-display text-lg text-amber-700">
                          ¥{s.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="font-bold text-emerald-700 text-sm">
                          {s.to.charAt(0)}
                        </span>
                      </div>
                      <p className="font-semibold text-emerald-700 text-sm">
                        {s.to}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-amber-100 flex flex-wrap gap-3 justify-center">
            <button onClick={handleExport} className="btn-secondary">
              <Download className="w-4 h-4" />
              <span>导出文字清单</span>
            </button>
            <button
              onClick={() => setHasCalculated(false)}
              className="btn-ghost"
            >
              <Calculator className="w-4 h-4" />
              <span>重新计算</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
