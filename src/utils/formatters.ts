/**
 * Armenian Localization and Fintech Formatters
 * Currency: Armenian Dram (֏ / AMD)
 * Date format: DD.MM.YYYY
 * Timezone: Asia/Yerevan
 */

export const formatAMD = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ֏';
  return `${Math.round(amount).toLocaleString('hy-AM')} ֏`;
};

export const formatDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    
    // Explicit DD.MM.YYYY in Asia/Yerevan
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  } catch {
    return '—';
  }
};

export const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
};
