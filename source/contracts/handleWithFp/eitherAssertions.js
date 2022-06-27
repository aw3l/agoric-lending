// @ts-nocheck
import { Far } from '@agoric/marshal';
import makeScalarMap from '@agoric/store';
import {
  assertIssuerKeywords,
  assertProposalShape,
} from '@agoric/zoe/src/contractSupport';
import { handleError, handleKeywordsError } from '../../shared/utils/general';
import {
  createAmountOf,
  depositAssertion,
  safeAssertIssuerKeywords,
} from '../../shared/utils/zoe';
import { setup } from '../../test/utils/setupAssets';
import { Either, Fn, FnT, Reducer } from '../../shared/ADTs';

// TODO: extract from file
const trackUsersDeposits =
  (liqudityStateMap) =>
  ({ brand, value = 0n }) =>
    !liqudityStateMap.has(brand)
      ? liqudityStateMap.init(brand, value)
      : liqudityStateMap.get(brand);

const trace = (label) => (value) => {
  console.log(`${label}::`, value);
  return value;
};

// FUTURE
// const getProp = (x) => (y) => y[x];
// const getCollateral= getProp('Collateral');
// const eitherAssertions = (fn) => (val) => fn(val);
// const fnWithZcf = (fn) => (zcf) => (args) => fn(zcf, args);

// TODO: continuing mapping out sequene
/**
 * 1. asserIssuerKeywords
 * 2. openAccount
 * 3. makeOpenAccountFn
 *
 * */

/* ` deposit
 *
 *
 * */
export const makeOpenAccountFn = async (zcf, manager) => {
  const {
    borrowAgainstCollateral,
    getAccountBalance,
    transferCollateralHelper,
  } = manager;

  const r = safeAssertIssuerKeywords(zcf, ['Collateral', 'Position']).fold(
    (err) => handleKeywordsError(err),
    () => Either.Right({ msg: 'successs' }),
  );

  console.log({ safeAssert: r });

  assertIssuerKeywords(zcf, ['Liq', 'Position']);

  // const lifted = starter.of(r);

  const openAccount = (entryPointSeat) => {
    const getAmountAllocated = (keyword) => (seat) =>
      seat.getAmountAllocated(keyword);
    const getCollateralAmount = getAmountAllocated('Collateral');
    const {
      want,
      give: { Collateral },
    } = entryPointSeat.getProposal();
    r;
    // TODO: use fp to create necessary functions, offerResult, etc.
    const thread = Fn.ask
      .map((x) => ({
        ...x,
        assertMsg: r.msg,
        seat: entryPointSeat,
        amountAllocated: x.userSeat.getAmountAllocated('Collateral'),
        mapState: trackUsersDeposits(x.CollateralMap)({
          brand: x.giveBrand,
          value: x.giveAmount,
        }),
      }))
      .run({
        keywords: ['Collateral', 'Position'],
        zcf,
        manager,
        CollateralMap: makeScalarMap(),
        initialAllocation: getCollateralAmount(entryPointSeat),
        userSeat: entryPointSeat,
        giveBrand: Collateral.brand,
        giveAmount: Collateral.amount,
      });
    const { amountAllocated, initialAllocation, CollateralMap } = thread;
    // PRIVATE STATE
    // trace(
    //   ' { amountAllocated, transferPrivateCollateral, mapState: accountMap}:::',
    // )({ amountAllocated, initialAllocation });

    const transferPrivateCollateral = transferCollateralHelper({
      seat: entryPointSeat,
      allocation: initialAllocation,
    });
    // TODO: clean this up with fn composition
    // initializes first deposit with 0n exisiting Collateral
    transferPrivateCollateral(0n);

    const addAdditional = (moreCollateralSeat) => {
      const { Collateral } = moreCollateralSeat.getCurrentAllocation();
      const currentCollateral = getAccountBalance(Collateral.brand);

      transferCollateralHelper({
        seat: moreCollateralSeat,
        allocation: moreCollateralSeat.getCurrentAllocation(),
      })(currentCollateral);
      // eslint-disable-next-line no-use-before-define
      return offerResult;
    };

    const checkBalance = (brand) => getAccountBalance(brand);

    const borrow = (x) => {
      borrowAgainstCollateral(x);
      // eslint-disable-next-line no-use-before-define
      return offerResult;
    };
    const offerResult = Far('offerResult', {
      getAccountBalance,
      addMoreCollateral: () =>
        zcf.makeInvitation(addAdditional, 'handle initial deposit'),
      borrow: () => zcf.makeInvitation(borrow, ' borrow fromCollateral'),
    });
    return offerResult;
  };
  return openAccount;
};
