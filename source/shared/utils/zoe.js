import { AmountMath } from '@agoric/ertp';
import {
  assertIssuerKeywords,
  assertProposalShape,
  makeRatio,
} from '@agoric/zoe/src/contractSupport/index.js';
import { setup } from '../../test/utils/setupAssets';
import { Either } from '../ADTs';
import { compose } from './general';

const { tryCatch } = Either;
const { bldIssuer } = setup();
const createAmountOf = (brand) => (amount) => AmountMath.make(brand, amount);

const defaultPoolConfig = {
  brandName: 'Default',
  zcfSeats: {},
  keywords: harden({
    give: { Position: null },
    want: { Liquidity: null },
  }),
  rates: {
    stableBorrow: 8,
    variableBorrow: 15,
    lendRate: 3,
  },
};

const createPoolConfig = (obj = {}) => ({
  ...defaultPoolConfig,
  ...obj,
});

const defaultProposal = {
  give: { Liquidity: null },
  want: { Position: null },
};

const createProposal = ({ give = {}, want = {}, exit = {} } = {}) => ({
  give,
  want,
  exit,
});

const createProposalAssertion =
  (proposal = { give: {}, want: {} }) =>
  (seat) =>
    assertProposalShape(seat, proposal);

const createLaTokenRatio = (collateralBrand, lariTokenBrand) => (amount) =>
  makeRatio(amount, collateralBrand, amount, lariTokenBrand);

const depositAssertion = createProposalAssertion(defaultProposal);
const defaultIssuerKeywordRecord = harden({
  Liquidity: bldIssuer,
});

const safeAssertIssuerKeywords = (zcf, array = []) =>
  tryCatch(() => assertIssuerKeywords(zcf, array));

export {
  depositAssertion,
  defaultProposal,
  createPoolConfig,
  createLaTokenRatio,
  createProposal,
  createAmountOf,
  defaultIssuerKeywordRecord,
  safeAssertIssuerKeywords,
};
