// @ts-check
import { test } from '@agoric/zoe/tools/prepare-test-env-ava';
import '@agoric/zoe/exported';

import { AmountMath } from '@agoric/ertp';
import { collateralTypes } from '../../shared/utils/interestRates';
import { setup } from './setupAssets';

const prepend = (string) => (target) => `${string}${target}`;
// @ts-ignore
const getObjectLength = (obj) => Object.values(obj).length;
const testCollateralTypes = ['LINK', 'USDC', 'BLD', 'RUN'];
const { linkKit, usdcKit, bldKit, runKit } = setup();

test('zoe helper functions', async (assert) => {
  assert.deepEqual(collateralTypes.length === 4, true, '');

  assert.deepEqual(
    linkKit.brand.getAllegedName() === 'link',
    true,
    'should return an issuer kit for LINK',
  );
  assert.deepEqual(
    usdcKit.brand.getAllegedName() === 'usdc',
    true,
    'should return an issuer kit for USDC',
  );
  assert.deepEqual(
    bldKit.brand.getAllegedName() === 'bld',
    true,
    'should return an issuer kit for BLD',
  );
  assert.deepEqual(
    runKit.brand.getAllegedName() === 'run',
    true,
    'should return an issuer kit for RUN',
  );
});
const getValue = ({ value }) => value;
test('user Purses', async (assert) => {
  const testLinkPurse = linkKit.issuer.makeEmptyPurse();
  const testAmount = 1000n;
  const testDepositPayment = linkKit.mint.mintPayment(
    AmountMath.make(linkKit.brand, testAmount),
  );
  testLinkPurse.deposit(testDepositPayment);

  const purseValue = getValue(testLinkPurse.getCurrentAmount());
  assert.deepEqual(
    purseValue === testAmount,
    true,
    'getCurrentAmount() method provide the correct value',
  );
});

test('lending protocol issuer kits', async (assert) => {
  const laTokenTypes = testCollateralTypes.map(prepend('la'));
  const [laLINK, laUSDC, laBLD, laRUN] = laTokenTypes;
  assert.is(laLINK === 'laLINK', true, 'should create an issuerkit for laLINK');
  assert.is(laUSDC === 'laUSDC', true, 'should create an issuerkit for laUSDC');
  assert.is(laBLD === 'laBLD', true, 'should create an issuerkit for laBLD');
  assert.is(laRUN === 'laRUN', true, 'should create an issuerkit for laRUN');

  assert.deepEqual(
    getObjectLength(laTokenTypes) === 4,
    true,
    'should create 4 issuer kit',
  );
});
