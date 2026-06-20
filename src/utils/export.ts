import type { Participant, Expense, Settlement } from "@/types";
import { calculateBalances, calculateSettlements, getTotalExpense, round2 } from "./settlement";

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getParticipantName(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.name || "未知";
}

export function generateExportText(
  participants: Participant[],
  expenses: Expense[]
): string {
  const lines: string[] = [];
  const now = new Date();

  lines.push("═══════════════════════════════════════");
  lines.push("          账单分摊结算清单          ");
  lines.push("═══════════════════════════════════════");
  lines.push("");
  lines.push(`生成时间: ${formatDate(now)}`);
  lines.push("");

  lines.push("───────────────────────────────────────");
  lines.push("一、参与人员");
  lines.push("───────────────────────────────────────");
  participants.forEach((p, i) => {
    lines.push(`  ${i + 1}. ${p.name}`);
  });
  lines.push("");

  lines.push("───────────────────────────────────────");
  lines.push(`二、开销明细 (共 ${expenses.length} 笔，总计 ¥${getTotalExpense(expenses).toFixed(2)})`);
  lines.push("───────────────────────────────────────");

  if (expenses.length === 0) {
    lines.push("  (暂无开销记录)");
  } else {
    expenses.forEach((e, i) => {
      const payerName = getParticipantName(participants, e.payerId);
      const sharers = e.participantIds.map((id) => getParticipantName(participants, id)).join("、");
      lines.push(`  ${i + 1}. ${e.note || "(无备注)"}`);
      lines.push(`     金额: ¥${e.amount.toFixed(2)}`);
      lines.push(`     付款人: ${payerName}`);
      lines.push(`     分摊人: ${sharers}`);
      lines.push("");
    });
  }

  lines.push("───────────────────────────────────────");
  lines.push("三、个人账目明细");
  lines.push("───────────────────────────────────────");

  const balances = calculateBalances(participants, expenses);
  balances.forEach((b) => {
    const status = b.balance > 0 ? "应收" : b.balance < 0 ? "应付" : "持平";
    lines.push(`  ${b.name}:`);
    lines.push(`    已付款: ¥${b.paid.toFixed(2)}`);
    lines.push(`    应分摊: ¥${b.share.toFixed(2)}`);
    lines.push(`    净余额: ¥${Math.abs(b.balance).toFixed(2)} (${status})`);
    lines.push("");
  });

  lines.push("───────────────────────────────────────");
  lines.push("四、最优结算方案 (最少转账次数)");
  lines.push("───────────────────────────────────────");

  const settlements = calculateSettlements(participants, expenses);
  if (settlements.length === 0) {
    lines.push("  🎉 账目已平，无需转账！");
  } else {
    settlements.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.from} → ${s.to} : ¥${s.amount.toFixed(2)}`);
    });
  }

  lines.push("");
  lines.push("═══════════════════════════════════════");
  lines.push("    账单分摊计算器 · 轻松AA不尴尬    ");
  lines.push("═══════════════════════════════════════");

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `账单结算_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.txt`;
}
