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

// Parse và validate data từ paste (Excel/CSV)
export function parsePastedData(text) {
  try {
    // Tách thành các dòng
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return { success: false, error: 'No data found' };
    }

    // Parse từng dòng
    const parsedRows = [];
    const errors = [];

    lines.forEach((line, index) => {
      try {
        const columns = splitCSV(line);
        
        // Validate số cột (tối thiểu 2, tối đa 6)
        if (columns.length < 2) {
          errors.push(`Row ${index + 1}: Too few columns (${columns.length}), minimum 2 required (API ID and optionally Date)`);
          return;
        }
        
        if (columns.length > 6) {
          errors.push(`Row ${index + 1}: Too many columns (${columns.length}), maximum 6 allowed`);
          return;
        }

        const [token = '', amount = '', dateClaim = '', fullName = '', pointPriority = '', pointFCFS = ''] = columns;

        // Find API ID - it could be in different columns depending on the format
        let apiId = '';
        let actualToken = '';
        let actualAmount = '';
        let actualDate = '';

        // Super simple logic for ,ethereum,31/12/2024 format
        if (columns.length >= 3 && !token.trim() && amount.trim() && dateClaim.trim()) {
          // Format: ,API_ID,DATE
          apiId = amount.trim();
          actualDate = dateClaim.trim();
        } else if (columns.length >= 2 && token.trim() && amount.trim()) {
          // Format: API_ID,DATE
          apiId = token.trim();
          actualDate = amount.trim();
        } else if (fullName.trim()) {
          // Standard format: API ID in column D
          apiId = fullName.trim();
          actualToken = token.trim();
          actualAmount = amount.trim();
          actualDate = dateClaim.trim();
        } else {
          // Try to find any non-empty, non-date, non-number value
          for (let i = 0; i < columns.length; i++) {
            const col = columns[i].trim();
            if (!col) continue;
            
            if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(col)) {
              actualDate = col;
            } else if (!isNaN(parseFloat(col.replace(/[^\d.,]/g, '').replace(',', '.')))) {
              actualAmount = col;
            } else if (!apiId) {
              apiId = col;
            }
          }
        }
        
        actualToken = token.trim();

        // Only API ID is required, others are optional
        if (!apiId) {
          errors.push(`Row ${index + 1}: API ID is required`);
          return;
        }

        // Parse và validate amount
        let parsedAmount = 0;
        if (actualAmount) {
          const cleanAmount = actualAmount.replace(/[^\d.,]/g, '').replace(',', '.');
          parsedAmount = parseFloat(cleanAmount) || 0;
        }

        // Parse và validate date
        let listingTime = '';
        if (actualDate) {
          // Try to parse various date formats
          const dateStr = actualDate.trim();
          
          // Excel date number
          if (/^\d+(\.\d+)?$/.test(dateStr)) {
            try {
              const date = new Date((parseFloat(dateStr) - 25569) * 86400 * 1000);
              if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                listingTime = `${day}/${month}/${year} ${hours}:${minutes}`;
              }
            } catch (e) {
              // Fallback to original string
              listingTime = dateStr;
            }
          } else {
            // Try to parse DD/MM/YYYY or DD/MM/YYYY HH:mm formats
            const dateMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
            if (dateMatch) {
              const [, day, month, year, hours = '00', minutes = '00'] = dateMatch;
              listingTime = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            } else {
              listingTime = dateStr;
            }
          }
        }

        parsedRows.push({
          name: actualToken || apiId, // Use API ID as name if token name is empty
          amount: parsedAmount,
          launchAt: listingTime,
          apiId: apiId,
          pointPriority: pointPriority.trim() || '',
          pointFCFS: pointFCFS.trim() || '',
          price: 0,
          reward: 0,
          highestPrice: 0,
        });

      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      return { 
        success: false, 
        error: `Validation errors:\n${errors.join('\n')}`,
        partialData: parsedRows 
      };
    }

    return { success: true, data: parsedRows };

  } catch (error) {
    return { success: false, error: `Failed to parse data: ${error.message}` };
  }
}

export function formatNumber(n) {
  if (typeof n !== 'number' || isNaN(n)) return '-';
  // Hiển thị tối đa 8 chữ số thập phân, bỏ số 0 dư
  // Sử dụng 'de-DE' để đảm bảo dấu chấm là thousands separator và dấu phẩy là decimal separator
  const s = n.toLocaleString('de-DE', { maximumFractionDigits: 8 });
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

// Format amount with dot as thousands separator and comma as decimal separator. Keeps up to 6 decimals if present.
export function formatAmount(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  // Use up to 6 decimals for amounts
  const options = { maximumFractionDigits: 6 };
  const s = num.toLocaleString('de-DE', options);
  // Keep standard de-DE format: dot for thousands, comma for decimal
  return s;
}

// Parse number input that may contain dots
export function parseNumberInput(value) {
  if (!value && value !== 0) return '';
  // Remove dots and parse as number
  const cleaned = String(value).replace(/\./g, '');
  const num = Number(cleaned);
  return isNaN(num) ? value : num;
}

// Format price/reward with exactly 4 decimal places and dot as thousands separator
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

  // format integer thousands with dot (chuẩn Việt Nam)
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (fracPart) return sign + intFormatted + ',' + fracPart;
  return sign + intFormatted;
}

// Main tokens that should only be in statscard-prices workspace
export const MAIN_TOKENS = ['bitcoin', 'ethereum', 'binancecoin'];

// Filter out main tokens from shared workspace data
export const filterMainTokensFromRows = (rows) => {
  if (!Array.isArray(rows)) {
    console.warn('filterMainTokensFromRows: rows is not an array:', rows);
    return [];
  }
  
  return rows.filter(row => {
    if (!row || !row.apiId) return true;
    return !MAIN_TOKENS.includes(row.apiId.trim().toLowerCase());
  });
};

// Check if a token is a main token
export const isMainToken = (apiId) => {
  if (!apiId) return false;
  return MAIN_TOKENS.includes(apiId.trim().toLowerCase());
};
