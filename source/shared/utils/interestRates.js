import { compose } from './general';

const startingRates = [
  {
    name: 'USDC',
    uOptimal: 85,
    slope1: 4,
    slope2: 75,
  },
  {
    name: 'RUN',
    uOptimal: 80,
    slope1: 4,
    slope2: 60,
  },
  {
    name: 'BLD',
    uOptimal: 45,
    slope1: 4,
    slope2: 300,
  },
  {
    name: 'LINK',
    uOptimal: 45,
    slope1: 7,
    slope2: 300,
  },
];

const [usdcRates, runRates, bldRates, linkRates] = startingRates;

const getCurrentUtilization = ({ borrowed, deposited }) => borrowed / deposited;

const testPoolData = {
  supplied: 500000,
  borrowed: 10000,
};
const trace = (label) => (val) => {
  console.log(`${label}::`, val);
  return val;
};

const convertDecimal = ({ utilization, ...x } = {}) => ({
  ...x,
  utilization: utilization * 100,
});

const id = (x) => x;
const belowUOptimalCalc = ({ utilization, uOptimal, slope1, ...x }) => ({
  ...x,
  interestRate: 0 + (utilization / uOptimal) * slope1,
});

const handleDivide = ({ utilization, uOptimal }) =>
  (utilization - uOptimal) / (1 - uOptimal);

const aboveUoptimalCalc = ({
  utilization,
  uOptimal,
  slope1,
  slope2,
  ...x
}) => ({
  ...x,
  interestRate: 0 + slope1 + handleDivide({ uOptimal, utilization }),
});
const uOptimalGteCheck = ({ uOptimal, utilization, ...x }) =>
  uOptimal >= utilization
    ? {
        ...belowUOptimalCalc({ uOptimal, ...x }),
      }
    : {
        ...aboveUoptimalCalc({ uOptimal, ...x }),
      };

const withCurrentUtilization = {
  getCurrentUtilization: ({ totalTokensBorrowed, totalTokensSupplied }) =>
    totalTokensBorrowed / totalTokensSupplied,
};

const withOptimalUtilization = ({ uOptimal, slope1, slope2, name } = {}) => ({
  uOptimal,
  slope1,
  slope2,
  name,
  compareAgainstOptimal: uOptimalGteCheck({ uOptimal }),
});
const poolConfig = (obj) => {
  const isAboveOptimal = false;
  const totalTokensBorrowed = 0n;
  const totalTokensSupplied = 0;
  return {
    ...obj,
    isAboveOptimal,
    totalTokensBorrowed,
    totalTokensSupplied,
    getSupply() {
      return this.totalTokensSupplied;
    },
    updateSupply(x = 0n) {
      typeof x; // ?
      getSupply(); // ?
      this.totalTokensSupplied + x;
      return this;
    },
    updateUtilization: withCurrentUtilization,
  };
};

const testConfig = poolConfig(linkRates); // ?

const calculateRate = compose(
  id,
  (x) => ({ ...x, interestRate: x.interestRate * 100 }),
  trace('after get current'),
  uOptimalGteCheck,
  trace('after conversion'),
  convertDecimal,
  (x) => ({ ...x, utilization: getCurrentUtilization(x) }),
);

export {
  startingRates as collateralTypes,
  calculateRate,
  startingRates,
  usdcRates,
  linkRates,
  bldRates,
  runRates,
};
