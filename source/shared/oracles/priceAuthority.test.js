// @ts-check
/* global require */
import { test } from '@agoric/zoe/tools/prepare-test-env-ava';
import '@agoric/zoe/exported';
import { getPriceData } from './mockPriceAuthority';

test('mockPriceAuthoirty', async t => {
  /** @type {PriceAuthority} **/;
  const p = await getPriceData();
  const v = 2;
  t.deepEqual(p,, 'price authoity');
  t.is(v > 2, true, 'v is GT 2');
});
