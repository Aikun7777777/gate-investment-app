export function formatPrice(price, decimals = 4) {
  if (price === null || price === undefined) {
    return "N/A";
  }
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  } else {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`;
  }
}

export function formatPercent(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.00%";
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

export function formatVolume(volume) {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  }
  return volume.toFixed(2);
}
