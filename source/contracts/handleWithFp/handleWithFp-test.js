// @ts-nocheck
import { test } from '@agoric/zoe/tools/prepare-test-env-ava';
import { E } from '@agoric/eventual-send';
import bundleSource from '@agoric/bundle-source';
import { AmountMath, AssetKind, makeIssuerKit } from '@agoric/ertp';
import fakeVatAdmin from '@agoric/zoe/tools/fakeVatAdmin';
import { makeZoe } from '@agoric/zoe';
import { saveAllIssuers } from '@agoric/zoe/src/contractSupport';
import makeScalarMap from '@agoric/store';
import {
  calculateRate,
  startingRates,
  usdcRates,
  bldRates,
  runRates,
  linkRates,
  collateralTypes,
} from '../../shared/utils/interestRates';

import { setup } from '../../test/utils/setupAssets';
import { setupZCFTest } from '../../test/utils/zcf/setupZCF';
import { Fn, Task, Either, FnT, TaskT, EitherT } from '../../shared/ADTs';
import { checkPayout, trackUsersDeposits } from './utils';
import {
  defaultIssuerKeywordRecord,
  safeAssertIssuerKeywords,
} from '../../shared/utils/zoe';
import { Liquidity, Position } from '../../test/constants';
import { handleError, id } from '../../shared/utils/general';

const accountManagerContract = `${__dirname}/privateState.js`;
const trace = (label) => (value) => {
  console.log(`${label}::`, value);
  return value;
};

const { linkKit, linkIssuer, bldKit, bldIssuer, runIssuer } = setup();
const { mint: linkMint, brand: linkBrand } = linkKit;

const { Left, Right } = Either;
test('manageAccountState contract::', async (t) => {
  const issuerKeywordRecord = harden({
    Liquidity: linkIssuer,
  });
  const zoe = makeZoe(fakeVatAdmin);
  const bundle = await bundleSource(accountManagerContract);
  const TaskEither = TaskT(Either);
  // ({newName: 'yoooo'})
  const FnTask = FnT(Task);
  const { tryCatch } = Either;
  const tryInstall = (eProxy) => (bundle) => eProxy.install(bundle);

  const setupInstall = tryInstall(E(zoe));
  const fold = (f, g) => f();
  const foldM =
    (M) =>
    (f = (x) => x, g = trace('success!')) =>
      M.fold(f, g);
  const defaultFold = (m) =>
    m.fold(
      () => 'error',
      (x) => x,
    );

  const runInstall = tryCatch(() =>
    setupInstall(bundleSource(accountManagerContract)),
  );

  t.truthy(
    await foldM(runInstall)(handleError('Error installing contract.')),
    'should contain a contract installation object.',
  );
  const SafeContainer = EitherT(FnTask);
  FnTask.of(new Promise((res) => res(10))) // ?
    .chain((e) => {
      trace('chaining')(e);
      return FnTask.ask.map((env) => ({ ...env, e }));
    }) // ?
    .run({ name: 'tom' }) // ?
    .fork(
      (e) => e,
      (y) => y,
    ); // ?

  const initialState = {
    zoe,
    useZoe: E(zoe),
    bundle: await bundleSource(accountManagerContract),
    callE: E,
    FnTask: FnT(Task),
    taskEither: TaskT(Either),
    taskE: Task.of(E),
    issuerKeywordRecord: harden({
      Liquidity: linkIssuer,
    }),
  };

  const x = {
    double(n) {
      return 2 * n;
    },
  };
  const d = E(zoe);

  const withContractEnv = FnTask.of((e) => e).chain((installed) => {
    console.log({ installed });
    return Fn((env) => ({ ...env, installed }));
  });

  t.truthy(await withContractEnv.run(initialState), 'should not be empty.');
  const bundleAndStart = Fn((env) => env.useZoe.install(env.bundle)).chain(
    async (inner) => {
      return Task.of(await inner);
    },
  );

  const startContract = FnTask.lift(bundleAndStart);

  const runC = FnTask.ask.map(trace('mapping start contract'));
  const Root = EitherT(FnTask);

  const liftTask = (outerType) => (nestedType) => outerType.lift(nestedType);

  const fnTaskLift = liftTask(FnTask.lift);

  const withEnv = FnTask.ask.map(startContract).chain((x) => {
    return Fn.of({ ...x });
  });

  //  console.log({ withEnv });
  const installation = await E(zoe).install(bundle);

  // const zcfMintResponse = await zcf.makeZCFMint('LinkReservePosition', AssetKind.SET);

  const defaultTerms = {
    collateralTypes,
    rates: [usdcRates, bldRates, runRates, linkRates],
    approvedIssuers: [linkIssuer, bldIssuer, runInstall],
    keywords: ['Liquidity', 'Position', 'Governance', 'BorrowFromLiqudity'],
    initialAccountMap: makeScalarMap(),
  };

  const contractInstance = await E(zoe).startInstance(
    installation,
    issuerKeywordRecord,
    defaultTerms,
  );
  const { publicFacet } = contractInstance;

  const brands = await E(zoe).getBrands(contractInstance.instance);
  const { Position: positionIssuer, Liquidity: linkLiquidityIssuer } = await E(
    zoe,
  ).getIssuers(contractInstance.instance);
  const tokenAmount = 1000n;
  const openAccountRef = await E(publicFacet).openAccount();

  const testPositionPayout = AmountMath.make(brands.Position, [
    {
      payoutAmt: tokenAmount,
      underlyingToken: linkBrand,
      totalAmountSupplied: tokenAmount,
    },
  ]);

  const payment = linkKit.mint.mintPayment(
    AmountMath.make(linkBrand, tokenAmount),
  );

  const proposalRecord = harden({
    give: { Liquidity: AmountMath.make(linkBrand, tokenAmount) },
    want: {
      Position: testPositionPayout,
    },
    exit: { onDemand: null },
  });
  const makeOfferPayment =
    (invite) =>
    (proposal, paymentRecord = {}) =>
      E(zoe).offer(invite, proposal, harden(paymentRecord));

  const initialPayment = linkKit.mint.mintPayment(
    AmountMath.make(linkBrand, 1000n),
  );

  const newAccountSeat = await makeOfferPayment(openAccountRef)(
    proposalRecord,
    { Liquidity: initialPayment },
  );

  /**
   * 1. getAccountBalance
   * 2. addMoreLiquidity
   * 3. borrow
   */
  const offerResult = await E(newAccountSeat).getOfferResult();

  t.deepEqual(
    await E(offerResult).getAccountBalance(linkBrand),
    1000n,
    'getBalance(linkBrand) should return the correct value.',
  );

  t.deepEqual(
    (await newAccountSeat.hasExited()) === true,
    true,
    'AFTER PAYOUT:: userSeat.hasExited() should return true.',
  );
  const addMoreLiquidityIssuer = await E(zoe).getInvitationIssuer();
  const addMoreInvite = E(offerResult).addMoreLiquidity();

  t.is(await addMoreLiquidityIssuer.isLive(addMoreInvite), true);
  // TODO: use createPayment fn
  const addMorePayment = linkKit.mint.mintPayment(
    AmountMath.make(linkBrand, 500n),
  );

  const addMorePayout = AmountMath.make(brands.Position, [
    {
      payoutAmt: tokenAmount + 500n,
      underlyingToken: linkBrand,
      totalAmountSupplied: tokenAmount + 500n,
    },
  ]);
  const addMoreProposal = harden({
    give: { Liquidity: AmountMath.make(linkBrand, 500n) },
    want: { Position: addMorePayout },
  });

  const exisitingUserSeat = await makeOfferPayment(addMoreInvite)(
    addMoreProposal,
    { Liquidity: addMorePayment },
  );
  t.deepEqual(
    await exisitingUserSeat.hasExited(),
    true,
    'AFTER OFFER:: exisitingUserSeat.hasExited() should return false.',
  );
  const secondOfferResult = await E(exisitingUserSeat).getOfferResult();
  const { getAccountBalance, addMoreLiquidity, borrow } = secondOfferResult;

  const testLinkBalance = await getAccountBalance(linkBrand);
  t.deepEqual(
    await testLinkBalance.value,
    1500n,
    'getAccountBalance should return the sum of both LINK deposits.',
  );

  t.is(
    await positionIssuer.getBrand().isMyIssuer(positionIssuer),
    true,
    'payout should have the correct issuer',
  );
  const borrowProposal = harden({
    give: {},
    want: {
      Liquidity: AmountMath.make(linkKit.brand, 100n),
    },
    exit: { onDemand: null },
  });

  const testBorrowOffer = makeOfferPayment(E(secondOfferResult).borrow())(
    borrowProposal,
    {},
  );

  const borrowAmount = 100n;
  const borrowUserSeat = await testBorrowOffer;
  const borrowResult = await E(borrowUserSeat).getOfferResult();
  t.is(
    await borrowResult.getAccountBalance(linkBrand),
    (await testLinkBalance.value) - borrowAmount,
  );
});
