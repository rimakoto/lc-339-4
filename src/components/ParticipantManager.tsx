import { useState, KeyboardEvent } from "react";
import { Users, UserPlus, X } from "lucide-react";
import { useAppStore } from "@/store";

export default function ParticipantManager() {
  const [name, setName] = useState("");
  const participants = useAppStore((s) => s.participants);
  const addParticipant = useAppStore((s) => s.addParticipant);
  const removeParticipant = useAppStore((s) => s.removeParticipant);

  const handleAdd = () => {
    if (name.trim()) {
      addParticipant(name);
      setName("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-gray-800">参与人员</h2>
          <p className="text-sm text-gray-500">添加参与本次活动的朋友</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入姓名，回车添加"
          className="input-field"
          maxLength={20}
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="btn-primary flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>添加</span>
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>还没有添加参与者</p>
          <p className="text-sm">请先添加参与活动的人员</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className="tag group animate-fade-in"
            >
              {p.name}
              <button
                onClick={() => removeParticipant(p.id)}
                className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-amber-200/70 transition-colors"
                title="移除"
              >
                <X className="w-3 h-3 text-amber-700" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-amber-100">
        <p className="text-sm text-gray-500">
          已添加 <span className="font-semibold text-amber-700">{participants.length}</span> 位参与者
        </p>
      </div>
    </div>
  );
}
