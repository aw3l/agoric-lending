// @ts-nocheck
import '@agoric/zoe/src/types';

import { makeIssuerKit, AssetKind, AmountMath } from '@agoric/ertp';

import { assert } from '@agoric/assert';
import { E } from '@agoric/eventual-send';
import buildManualTimer from '@agoric/zoe/tools/manualTimer';
import { makeFakePriceAuthority } from '@agoric/zoe/tools/fakePriceAuthority';
import { makeRatio } from '@agoric/zoe/src/contractSupport/ratio';
import { Far } from '@agoric/marshal';

import { makeVaultKit } from '../src/treasury-code/vault';
import { paymentFromZCFMint } from '../src/treasury-code/burn';
import { SECONDS_PER_YEAR } from '../src/treasury-code/interest';

const BASIS_POINTS = 10000n;

/** @param {ContractFacet} zcf */
export async function start(zcf) {
  console.log(`contract started`);

  const collateralKit = makeIssuerKit('Liquidity');
  const { brand: collateralBrand } = collateralKit;
  await zcf.saveIssuer(collateralKit.issuer, 'Liquidity'); // todo: CollateralETH, etc

  const [laLinkMint, laUSDCMint, laBLDMint, laRUNMint, LARIMint] =
    await Promise.all([
      zcf.makeZCFMint('laLINK', undefined, harden({ decimalPlaces: 6 })),
      zcf.makeZCFMint('laUSDC', undefined, harden({ decimalPlaces: 6 })),
      zcf.makeZCFMint('laBLD', undefined, harden({ decimalPlaces: 6 })),
      zcf.makeZCFMint('laRUN', undefined, harden({ decimalPlaces: 6 })),
      zcf.makeZCFMint('LARI', undefined, harden({ decimalPlaces: 6 })),
    ]);
  const { brand: runBrand } = runMint.getIssuerRecord();

  const { zcfSeat: _collateralSt, userSeat: liqSeat } = zcf.makeEmptySeatKit();
  const { zcfSeat: stableCoinSeat } = zcf.makeEmptySeatKit();

  /** @type {MultipoolAutoswapPublicFacet} */
  const autoswapMock = {
    getInputPrice(amountIn, brandOut) {
      assert.equal(brandOut, runBrand);
      return AmountMath.make(4n * amountIn.value, runBrand);
    },
  };

  function reallocateReward(amount, fromSeat, otherSeat) {
    stableCoinSeat.incrementBy(
      fromSeat.decrementBy({
        RUN: amount,
      }),
    );
    if (otherSeat !== undefined) {
      zcf.reallocate(stableCoinSeat, fromSeat, otherSeat);
    } else {
      zcf.reallocate(stableCoinSeat, fromSeat);
    }
  }

  /** @type {InnerVaultManager} */
  const managerMock = {
    getLiquidationMargin() {
      return makeRatio(105n, runBrand);
    },
    getInitialMargin() {
      return makeRatio(150n, runBrand);
    },
    getLoanFee() {
      return makeRatio(500n, runBrand, BASIS_POINTS);
    },
    getInterestRate() {
      return makeRatio(5n, runBrand);
    },
    collateralBrand,
    reallocateReward,
  };

  const SECONDS_PER_HOUR = SECONDS_PER_YEAR / 365n / 24n;
  const timer = buildManualTimer(console.log, 0n, SECONDS_PER_HOUR * 24n);
  const options = {
    actualBrandIn: collateralBrand,
    actualBrandOut: runBrand,
    priceList: [80],
    tradeList: undefined,
    timer,
    quoteMint: makeIssuerKit('quote', AssetKind.SET).mint,
  };
  const priceAuthority = makeFakePriceAuthority(options);

  const { vault, openLoan, accrueInterestAndAddToPool } = await makeVaultKit(
    zcf,
    managerMock,
    runMint,
    autoswapMock,
    priceAuthority,
    {
      chargingPeriod: SECONDS_PER_HOUR * 24n,
      recordingPeriod: SECONDS_PER_HOUR * 24n * 7n,
    },
    timer.getCurrentTimestamp(),
  );

  zcf.setTestJig(() => ({ collateralKit, runMint, vault, timer }));

  async function makeHook(seat) {
    const { notifier, collateralPayoutP } = await openLoan(seat);

    return {
      vault,
      liquidationPayout: E(liqSeat).getPayout('Liquidity'),
      runMint,
      collateralKit,
      actions: {
        add() {
          return vault.makeAdjustBalancesInvitation();
        },
        accrueInterestAndAddToPool,
      },
      notifier,
      collateralPayoutP,
    };
  }

  console.log(`makeContract returning`);

  const vaultAPI = Far('vaultAPI', {
    makeAdjustBalancesInvitation() {
      return vault.makeAdjustBalancesInvitation();
    },
    mintRun(amount) {
      return paymentFromZCFMint(zcf, runMint, amount);
    },
  });

  const testInvitation = zcf.makeInvitation(makeHook, 'foo');
  return harden({ creatorInvitation: testInvitation, creatorFacet: vaultAPI });
}
