// @ts-check

import { test } from '@agoric/zoe/tools/prepare-test-env-ava';
import { E } from '@agoric/eventual-send';
import bundleSource from '@agoric/bundle-source';
import {
  assertIssuerKeywords,
  assertProposalShape,
  satisfies,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath, AssetKind } from '@agoric/ertp';
import { Far } from '@agoric/marshal';
import makeStore from '@agoric/store';
import { Either, EitherT, Fn, FnT } from '../ADTs';
import { setup } from '../../test/utils/setupAssets';
import {
  safeAssertIssuerKeywords,
  createProposal,
  createAmountOf,
  depositAssertion,
  defaultProposal,
} from './zoe';
import { setupZCFTest } from '../../test/utils/zcf/setupZCF';
import {
  id,
  handleError,
  handleProposalError,
  handleKeywordsError,
  errorMessagesForUI,
} from './general';
import { Liquidity } from '../../test/constants';

const { tryCatch } = Either;

const {
  runBrand,
  run,
  bld,
  bldBrand,
  bldMint,
  runMint,
  linkIssuer,
  bldIssuer,
} = setup();

const trace = (label) => (val) => {
  console.log(`${label}::`, val);
  return val;
};

test('createAmountOf() :: ', async (t) => {
  const makeBldAmount = createAmountOf(bldBrand);
  const makeRunAmount = createAmountOf(runBrand);

  const oneHundredBld = bld(100n);

  t.deepEqual(
    oneHundredBld.value === 100n,
    true,
    'makeBldAmount should return an Amount with the correct value',
  );
  t.deepEqual(
    oneHundredBld.brand === bldBrand,
    true,
    'makeBldAmount should return an Amount with the correct brand',
  );
});

test('createProposal() :: ', async (t) => {
  const issuerKeywordRecord = harden({
    Liquidity: bldIssuer,
  });
  const { zcf, zoe } = await setupZCFTest(issuerKeywordRecord);
  const poolMint = await zcf.makeZCFMint('BldPosition', AssetKind.SET);
  const { brand, issuer } = poolMint.getIssuerRecord();
  const offerProposal = {
    give: { Liquidity: bld(100n) },
    want: {
      Position: AmountMath.make(brand, [
        {
          underlyingAmount: 100n,
        },
      ]),
    },
  };

  const proposal = createProposal(offerProposal);

  t.deepEqual(
    proposal.give.Liquidity.value === 100n,
    true,
    'should return a proposal with the correct value.',
  );
  t.deepEqual(
    proposal.give.Liquidity.brand === bldBrand,
    true,
    'should return a proposal with the correct brand.',
  );
});

test('assertIssuerKeywords:: without try...catch ## happy path', async (t) => {
  const issuerKeywordRecord = harden({
    Central: linkIssuer,
    Secondary: bldIssuer,
  });
  const { zcf } = await setupZCFTest(issuerKeywordRecord);
  const actual = assertIssuerKeywords(zcf, ['Central', 'Secondary']);
  t.truthy(actual === undefined, 'should return undefined.');
});

test('assertIssuerKeywords:: with error', async (t) => {
  const issuerKeywordRecord = harden({
    Central: linkIssuer,
  });
  const { zcf } = await setupZCFTest(issuerKeywordRecord);
  const displayString = 'Error with issuer keywords.';
  const actual = safeAssertIssuerKeywords(zcf, ['Wrong']).fold(
    handleKeywordsError,
    id,
  );

  t.is(
    typeof actual.error,
    'object',
    'should return an object containing an Error object.',
  );

  t.deepEqual(
    actual.uiMessage === errorMessagesForUI.keywordsMsg,
    true,
    'should return an object with the correct uiMessage string.',
  );
});

test('assertIssuerKeywords:: happy path', async (t) => {
  const issuerKeywordRecord = harden({
    Central: linkIssuer,
  });
  const { zcf } = await setupZCFTest(issuerKeywordRecord);

  const actual = safeAssertIssuerKeywords(zcf, ['Central']).fold(
    handleKeywordsError,
    id,
  );

  t.deepEqual(actual === undefined, true, 'should return undefined.');
});

function makeMockTradingZcfBuilder() {
  const offers = makeStore('offerHandle');
  const allocs = makeStore('offerHandle');
  const reallocatedStagings = [];

  return Far('mockTradingZcfBuilder', {
    addOffer: (keyword, offer) => offers.init(keyword, offer),
    addAllocation: (keyword, alloc) => allocs.init(keyword, alloc),
    build: () =>
      Far('mockZCF', {
        getZoeService: () => {},
        reallocate: (...seatStagings) => {
          reallocatedStagings.push(...seatStagings);
        },
        getReallocatedStagings: () => reallocatedStagings,
      }),
  });
}

test('depositAssertion:: happy path', async (t) => {
  const issuerKeywordRecord = harden({
    Liquidity: bldIssuer,
  });
  t.is(defaultProposal.give.Liquidity, null);
  const fakeZcfSeat = Far('fakeZcfSeat', {
    getCurrentAllocation: () => harden({ Liquidity: bld(10) }),
    getProposal: () => harden(defaultProposal),
  });
  const mockZCFBuilder = makeMockTradingZcfBuilder();
  const mockZCF = mockZCFBuilder.build();

  const { zcf, zoe, instance, creatorFacet } = await setupZCFTest(
    issuerKeywordRecord,
  );
  const { zcfSeat, userSeat } = zcf.makeEmptySeatKit();

  const offerProposal = Either.tryCatch(() => depositAssertion(fakeZcfSeat));
  // assertProposalShape(fakeZcfSeat, defaultProposal));

  const testProposal = offerProposal
    .map(trace('after try catch:: only runs when assertion has passed.'))
    .fold(handleProposalError, id);

  t.is(testProposal, undefined);
});

test('depositAssertion:: handling incorrect proposal', async (t) => {
  const issuerKeywordRecord = harden({
    Liquidity: bldIssuer,
  });
  const newProposal = { give: { Incorrect: null }, want: { Position: null } };

  const fakeZcfSeat = Far('fakeZcfSeat', {
    getCurrentAllocation: () => harden({ Liquidity: bld(10) }),
    getProposal: () => harden(newProposal),
  });
  const mockZCFBuilder = makeMockTradingZcfBuilder();
  const mockZCF = mockZCFBuilder.build();

  const { zcf } = await setupZCFTest(issuerKeywordRecord);

  const offerProposal = Either.tryCatch(() => depositAssertion(fakeZcfSeat));
  // assertProposalShape(fakeZcfSeat, defaultProposal));

  const displayString = 'Error with proposal shape.';
  const testProposal = offerProposal
    .map(trace('after try catch:: only runs when assertion has passed.'))
    .fold(handleProposalError, id);

  t.deepEqual(
    testProposal.uiMessage === errorMessagesForUI.proposalMsg,
    true,
    'should return an error with the correct uiMessage.',
  );
});
