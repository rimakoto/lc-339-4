import { ListTodo, Trash2, User, Users } from "lucide-react";
import { useAppStore } from "@/store";
import { getTotalExpense } from "@/utils/settlement";

export default function ExpenseList() {
  const participants = useAppStore((s) => s.participants);
  const expenses = useAppStore((s) => s.expenses);
  const removeExpense = useAppStore((s) => s.removeExpense);

  const getPayerName = (id: string) =>
    participants.find((p) => p.id === id)?.name || "未知";

  const getParticipantNames = (ids: string[]) =>
    ids.map((id) => participants.find((p) => p.id === id)?.name || "未知");

  const total = getTotalExpense(expenses);

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gray-800">
              开销明细
            </h2>
            <p className="text-sm text-gray-500">
              共 {expenses.length} 笔记录
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">总金额</p>
          <p className="text-2xl font-bold font-display text-amber-600">
            ¥{total.toFixed(2)}
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>还没有开销记录</p>
          <p className="text-sm">添加第一笔开销开始记账吧</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 -mr-1">
          {expenses.map((e, index) => (
            <div
              key={e.id}
              className="group p-4 rounded-2xl bg-gradient-to-r from-amber-50/50 to-white border border-amber-100/50 hover:border-amber-200 hover:shadow-md transition-all animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800 truncate">
                      {e.note || "未备注"}
                    </span>
                    <span className="text-lg font-bold text-amber-600 font-display">
                      ¥{e.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      付款: <span className="font-medium text-gray-800">{getPayerName(e.payerId)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      分摊:{" "}
                      <span className="font-medium text-gray-800">
                        {getParticipantNames(e.participantIds).join("、")}
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeExpense(e.id)}
                  className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="删除这笔开销"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
