import { useEffect } from "react";
import { Wallet, RefreshCw, Sparkles } from "lucide-react";
import { useAppStore } from "@/store";
import ParticipantManager from "@/components/ParticipantManager";
import ActivityTemplateManager from "@/components/ActivityTemplateManager";
import ExpenseForm from "@/components/ExpenseForm";
import RecurringExpenseManager from "@/components/RecurringExpenseManager";
import ExpenseList from "@/components/ExpenseList";
import SettlementResult from "@/components/SettlementResult";

export default function Home() {
  const loadState = useAppStore((s) => s.loadState);
  const applyRecurringExpenses = useAppStore((s) => s.applyRecurringExpenses);
  const resetAll = useAppStore((s) => s.resetAll);
  const participants = useAppStore((s) => s.participants);
  const expenses = useAppStore((s) => s.expenses);
  const templates = useAppStore((s) => s.templates);
  const recurringExpenses = useAppStore((s) => s.recurringExpenses);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyRecurringExpenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [applyRecurringExpenses]);

  const hasData =
    participants.length > 0 ||
    expenses.length > 0 ||
    templates.length > 0 ||
    recurringExpenses.length > 0;

  const handleReset = () => {
    if (
      window.confirm(
        "确定要清空所有数据吗？此操作会清空参与者、开销、活动模板和重复规则，且不可撤销。"
      )
    ) {
      resetAll();
    }
  };

  return (
    <div className="min-h-screen py-8 pb-16">
      <div className="container max-w-6xl">
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-amber-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-800">
              轻松AA · 朋友聚会不尴尬
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-gray-800 mb-3">
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent">
              账单分摊计算器
            </span>
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            添加参与者、录入开销，一键算出最优结算方案
            <br />
            支持活动模板和重复开销，数据自动保存在本地
          </p>

          {hasData && (
            <div className="mt-6 flex justify-center">
              <button onClick={handleReset} className="btn-danger">
                <RefreshCw className="w-4 h-4" />
                <span>清空所有数据重新开始</span>
              </button>
            </div>
          )}
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ParticipantManager />
            <ActivityTemplateManager />
            <ExpenseForm />
          </div>

          <div className="space-y-6">
            <RecurringExpenseManager />
            <ExpenseList />
            <SettlementResult />
          </div>
        </div>

        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <Wallet className="w-4 h-4" />
            <span>账单分摊计算器 · 让每一分钱都清清楚楚</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
