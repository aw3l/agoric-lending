// @ts-nocheck
import { AmountMath, AssetKind } from '@agoric/ertp';
import { Far } from '@agoric/marshal';
import makeScalarMap from '@agoric/store';
import {
  depositAssertion,
  createPoolConfig,
  createProposal,
  defaultProposal,
} from '../../shared/utils/zoe.js';
import { checkPayout } from './utils/index.js';
import { mintZCFMintPayment } from './utils/mintPositionPayment.js';
import { makeOpenAccountFn } from './eitherAssertions';
import { id, compose } from '../../shared/utils/general.js';

const handleMap = (map) => (key) =>
  map.has(key) ? map.get(key) : `No accountBalanace for brand::${key}`;

const trace = (label) => (value) => {
  // console.log(`${label}::`, value);
  return value;
};

const mockSeatObj = {
  getProposal: () => defaultProposal,
  getCurrentAllocation: () => 100n,
};

compose(trace('inside compose seatProposalFlow'), id)(mockSeatObj);

const trackUsersDeposits =
  (m) =>
  ({ brand, value = 0n }) =>
    !m.has(brand)
      ? m.init(brand, value)
      : m.set(brand, AmountMath.make(brand, m.get(brand) + value));

const exchangeAllocations =
  ({ incrementBy }, { decrementBy }) =>
  ({ keyword, amount }) =>
    incrementBy(decrementBy({ [keyword]: amount }));

/** @type {ContractStartFn } */
const start = async (zcf) => {
  const { keywords, initialAccountMap, issuers, brands } = zcf.getTerms();
  // TODO: use acceptedCollateral to create ZCF objects for each pool
  const lendingPoolMint = await zcf.makeZCFMint('Position', AssetKind.SET);
  const { brand: PositionBrand } = lendingPoolMint.getIssuerRecord();
  console.log({ PositionBrand });
  const { zcfSeat: liquidityPoolSeat } = zcf.makeEmptySeatKit();

  // A map with a particular, more helpful API
  /** @type {Store<Brand, Amount>} */

  const { collateralRates, interestRates } = zcf.getTerms();

  // IssuerKeywords have been verified
  // Using acceptedCollateral to map over
  // TODO:
  const makeLiquidityProviderPosition =
    (positionBrand) =>
    ({ give, currentLiquidity = 0 }) =>
      AmountMath.make(positionBrand, [
        {
          totalAmountSupplied: give.Liquidity.value + currentLiquidity,
          underlyingToken: give.Liquidity.brand,
          payoutAmt: give.Liquidity.value + currentLiquidity,
        },
      ]);
  /** */
  const liquidityMap = makeScalarMap();
  const accountEntries = () => liquidityMap.entries();
  const handleRecordBalances = trackUsersDeposits(liquidityMap);

  const transferLiquidityHelper =
    ({ allocation, seat }) =>
    (currentLiquidity) => {
      const { give, want } = seat.getProposal();

      const poolToken = makeLiquidityProviderPosition(PositionBrand)({
        give,
        currentLiquidity,
      });

      lendingPoolMint.mintGains({ Position: poolToken }, liquidityPoolSeat);

      exchangeAllocations(
        seat,
        liquidityPoolSeat,
      )({ keyword: 'Position', amount: poolToken });

      exchangeAllocations(
        liquidityPoolSeat,
        seat,
      )({ keyword: 'Liquidity', amount: give.Liquidity });

      zcf.reallocate(liquidityPoolSeat, seat);
      seat.exit();
      // ? - Proper place for handling map setters.
      handleRecordBalances(give.Liquidity);
      return 'successful deposit! you rock!';
    };

  const borrowAgainstLiquidity = (_borrowSeat) => {
    const { want } = _borrowSeat.getProposal();
    const currentBalance = handleMap(liquidityMap)(want.Liquidity.brand);
    // TODO: complete
    if (currentBalance.value > want.Liquidity.value) {
      exchangeAllocations(
        _borrowSeat,
        liquidityPoolSeat,
      )({
        keyword: 'Liquidity',
        amount: want.Liquidity,
      });

      zcf.reallocate(liquidityPoolSeat, _borrowSeat);
      _borrowSeat.exit();

      liquidityMap.set(
        want.Liquidity.brand,
        currentBalance.value - want.Liquidity.value,
      );
      return 'borrow success!';
    } else {
      _borrowSeat.exit();
      return 'Not enough liquidity to borrow!.';
    }
    // eslint-disable-next-line no-use-before-define
  };
  const userAccountManager = Far('userAccountManager', {
    transferLiquidityHelper,
    accountEntries,
    borrowAgainstLiquidity,
    getAccountBalance: handleMap(liquidityMap),
  });

  const openAccount = makeOpenAccountFn(zcf, userAccountManager);

  const publicFacet = Far('publicFacet', {
    openAccount: () => zcf.makeInvitation(openAccount, 'openAccount'),
  });
  return { publicFacet };
};
export { start };
