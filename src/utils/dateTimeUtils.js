// Utility functions for date/time handling

export function parseLaunchAt(value) {
  if (!value) return null;
  const v = String(value).trim();
  const dateOnly = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateOnly) {
    const [, d, mo, y] = dateOnly;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
  }
  
  // Handle DD/MM/YYYY HH:mm:ss format
  const m = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
  );
  if (m) {
    const [, d, mo, y, h, mi, s] = m;
    const dt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
    );
    return isNaN(dt.getTime()) ? null : dt;
  }
  
  // Handle DD/MM/YYYY HH:mm format
  const m2 = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/,
  );
  if (m2) {
    const [, d, mo, y, h, mi] = m2;
    const dt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      0,
    );
    return isNaN(dt.getTime()) ? null : dt;
  }
  
  return null;
}

export function getCountdownText(launchAt, now, isMobile = false) {
  const dt = parseLaunchAt(launchAt);
  if (!dt) return null;
  const diff = dt.getTime() - now;
  if (diff <= 0) return null;
  
  const sec = Math.floor(diff / 1000);
  const days = Math.floor(sec / (24 * 3600));
  const hours = Math.floor((sec % (24 * 3600)) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  
  // Both desktop and mobile: d:h:m:s format, hide 0d
  const dayPart = days > 0 ? `${days}<span class="opacity-50">d</span> ` : '';
  return `${dayPart}${String(hours).padStart(2, '0')}<span class="opacity-50">h</span> ${String(minutes).padStart(2, '0')}<span class="opacity-50">m</span> ${String(seconds).padStart(2, '0')}<span class="opacity-50">s</span>`;
}

export function formatDateTime(value) {
  if (!value) return value;
  const v = String(value).trim();

  // date-only: DD/MM/YYYY -> normalize to DD/MM/YYYY 00:00
  const dateOnly = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateOnly) {
    const [, d, mo, y] = dateOnly;
    return `${String(d).padStart(2, '0')}/${String(mo).padStart(
      2,
      '0',
    )}/${y} 00:00`;
  }

  // full datetime: DD/MM/YYYY HH:mm:ss -> display as DD/MM/YYYY HH:mm
  const full = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
  );
  if (full) {
    const [, d, mo, y, hh, mm, ss] = full;
    const D = Number(d);
    const M = Number(mo);
    const Y = Number(y);
    const H = Number(hh);
    const MIN = Number(mm);
    const S = Number(ss);
    if (
      D >= 1 &&
      D <= 31 &&
      M >= 1 &&
      M <= 12 &&
      Y >= 1900 &&
      Y <= 2100 &&
      H >= 0 &&
      H <= 23 &&
      MIN >= 0 &&
      MIN <= 59 &&
      S >= 0 &&
      S <= 59
    ) {
      return `${String(d).padStart(2, '0')}/${String(mo).padStart(
        2,
        '0',
      )}/${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(
        2,
        '0',
      )}`;
    }
  }

  // Handle DD/MM/YYYY HH:mm format
  const timeOnly = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/,
  );
  if (timeOnly) {
    const [, d, mo, y, hh, mm] = timeOnly;
    const D = Number(d);
    const M = Number(mo);
    const Y = Number(y);
    const H = Number(hh);
    const MIN = Number(mm);
    if (
      D >= 1 &&
      D <= 31 &&
      M >= 1 &&
      M <= 12 &&
      Y >= 1900 &&
      Y <= 2100 &&
      H >= 0 &&
      H <= 23 &&
      MIN >= 0 &&
      MIN <= 59
    ) {
      return `${String(d).padStart(2, '0')}/${String(mo).padStart(
        2,
        '0',
      )}/${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(
        2,
        '0',
      )}`;
    }
  }
  return value;
}
