export const extractPrice = (description?: string): string => {
  if (!description) return '0';
  const priceMatch = description.match(/\$(\d+(?:\.\d+)?)/);
  return priceMatch ? priceMatch[1] : '0';
};

export const extractPercentages = (description: string): string[] => {
  const percentages = description.match(/-?\d+\.\d+%/g);
  return percentages || [];
};