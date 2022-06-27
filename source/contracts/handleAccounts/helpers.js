const Keywords = {
  Liquidity: 'Liquidity',
  Position: 'PoolPositionNFT',
  Governance: 'Governance',
};

const unbox = (arr = []) => {
  const [value] = arr;
  return value;
};
const iterateMap = (map) => (key) => {
  for (const i of map) {
    if (unbox(i) === key) return i; // ?
  }
  return false;
};

export { unbox, iterateMap };
