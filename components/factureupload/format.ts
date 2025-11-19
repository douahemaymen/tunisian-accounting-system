// Utilisation de la fonction centralisée
import { formatTNDShort } from '@/lib/currency-utils';

export const formatTND = (value: number): string => {
  return formatTNDShort(isFinite(value) ? value : 0);
};

export const formatDate = (tsOrIso: number | string | undefined): string => {
  if (!tsOrIso) return '';
  const d = typeof tsOrIso === 'number' ? new Date(tsOrIso) : new Date(tsOrIso);
  return new Intl.DateTimeFormat('fr-TN').format(d);
};

export const toCsv = (rows: Array<Record<string, unknown>>): string => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(',')].concat(
    rows.map(r => headers.map(h => escape((r as any)[h])).join(','))
  );
  return lines.join('\n');
};

export const downloadXls = (rows: Array<Record<string, unknown>>, filename: string) => {
  // Simple HTML table that Excel opens
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => `<tr>${headers.map(h => `<td>${(r as any)[h] ?? ''}</td>`).join('')}</tr>`).join('');
  const html = `\uFEFF<html><head><meta charset="utf-8" /></head><body><table>${thead}${tbody}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
};


