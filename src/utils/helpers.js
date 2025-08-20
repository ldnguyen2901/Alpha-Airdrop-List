// Tách CSV cơ bản (hỗ trợ "..." có dấu phẩy)
export function splitCSV(line) {
  const out = [];
  let cur = '';
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
    } else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function formatNumber(n) {
  if (typeof n !== 'number' || isNaN(n)) return '-';
  // Hiển thị tối đa 8 chữ số thập phân, bỏ số 0 dư
  const s = n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  return s;
}

// Normalize user-entered date/time.
// Accepts DD/MM/YYYY or DD/MM/YYYY HH:mm:ss and returns a normalized string:
// - If only date provided, returns "DD/MM/YYYY" with zero-padded day/month
// - If time provided, returns "DD/MM/YYYY HH:mm:ss" with zero-padded parts
// If input is invalid, returns the original value unchanged.
export function normalizeDateTime(value) {
  if (!value && value !== 0) return value;
  const v = String(value).trim();

  const dateOnly = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateOnly) {
    const [, d, mo, y] = dateOnly;
    return `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y}`;
  }

  const full = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
  );
  if (full) {
    const [, d, mo, y, hh, mm, ss] = full;
    return `${String(d).padStart(2, '0')}/${String(mo).padStart(
      2,
      '0',
    )}/${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(
      2,
      '0',
    )}:${String(ss).padStart(2, '0')}`;
  }

  // Not matching expected patterns -> return original
  return value;
}

// Format amount with dot as thousands separator. Keeps up to 6 decimals if present.
export function formatAmount(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  // Use up to 6 decimals for amounts
  const options = { maximumFractionDigits: 6 };
  const s = num.toLocaleString('en-US', options);
  // replace comma thousands with dot
  return s.replace(/,/g, '.');
}

// Format price/reward with exactly 4 decimal places and dot thousands separator
export function formatPrice(n) {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  const abs = Math.abs(num);
  // default to 4 decimals
  let decimals = 4;
  const maxDecimals = 8;
  const minKeep = 4;

  // If number is non-zero but would truncate to 0 at 4 decimals, increase decimals until we see a non-zero when truncated
  if (abs > 0 && abs < Math.pow(10, -decimals)) {
    while (decimals < maxDecimals) {
      const factor = Math.pow(10, decimals);
      const truncated = Math.trunc(abs * factor);
      if (truncated !== 0) break;
      decimals += 1;
    }
  }

  // Truncate (no rounding)
  const factor = Math.pow(10, decimals);
  const truncatedVal = Math.trunc(num * factor) / factor;

  // Build string without scientific notation
  const sign = truncatedVal < 0 ? '-' : '';
  const absTrunc = Math.abs(truncatedVal);
  const intPart = Math.floor(absTrunc).toString();
  let fracPart = '';
  if (decimals > 0) {
    // compute fractional digits by padding
    const raw = Math.floor((absTrunc - Math.floor(absTrunc)) * factor)
      .toString()
      .padStart(decimals, '0');
    // trim trailing zeros but keep at least minKeep
    if (raw.length > minKeep) {
      const trimmed = raw.replace(/0+$/, '');
      fracPart = trimmed.length >= minKeep ? trimmed : raw.slice(0, minKeep);
    } else {
      fracPart = raw;
    }
  }

  // format integer thousands with dot
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (fracPart) return sign + intFormatted + '.' + fracPart;
  return sign + intFormatted;
}
