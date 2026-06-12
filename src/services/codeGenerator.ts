const RESOURCE_INITIALS: Record<string, string> = {
  products: 'PR',
  customers: 'CU',
  budgets: 'BU',
  freelancers: 'FR',
  suppliers: 'SU',
  expenses: 'EX',
  entries: 'EN',
};

function codePrefix(resourceKey: string, prefix: string, year: number): string {
  const initials = RESOURCE_INITIALS[resourceKey] || resourceKey.slice(0, 2).toUpperCase();
  const normalizedPrefix = prefix
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();

  return `${normalizedPrefix || 'FS'}${initials}${year}-`;
}

export function generateCode(
  resourceKey: string,
  items: Array<Record<string, unknown>>,
  prefix = 'FS',
  year = new Date().getFullYear(),
): string {
  const pattern = codePrefix(resourceKey, prefix, year);
  const lastNumber = items.reduce((max, item) => {
    const code = String(item.code || '');

    if (!code.startsWith(pattern)) {
      return max;
    }

    const number = Number(code.slice(pattern.length));

    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 0);

  return `${pattern}${String(lastNumber + 1).padStart(4, '0')}`;
}

export function canGenerateCode(resourceKey: string): boolean {
  return resourceKey in RESOURCE_INITIALS;
}
