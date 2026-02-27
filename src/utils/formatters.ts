export const formatCurrency = (amount: number): string => {
  // Display as integer if whole number, otherwise show 2 decimal places
  const displayValue = Number(amount) % 1 === 0 ? amount : amount.toFixed(2);
  return `$${displayValue}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatDate = (date: string): string => {
  const [year, month] = date.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

export const formatMonth = (date: string): string => {
  const [year, month] = date.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};
