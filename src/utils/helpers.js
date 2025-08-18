// Tách CSV cơ bản (hỗ trợ "..." có dấu phẩy)
export function splitCSV(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function formatNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "-";
  // Hiển thị tối đa 8 chữ số thập phân, bỏ số 0 dư
  const s = n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  return s;
}
