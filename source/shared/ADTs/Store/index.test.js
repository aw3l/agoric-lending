// @ts-check
import { test } from '@agoric/zoe/tools/prepare-test-env-ava';
import { E } from '@agoric/eventual-send';
import bundleSource from '@agoric/bundle-source';
import makeStore from '@agoric/store';
import makeScalarMap from '@agoric/store';

const genDeepEq = (t) => (msg) => (actual, expected) =>
  t.deepEqual(actual, expected, msg);
test('makeStore::', async (t) => {
  const testStore = makeScalarMap('');
  const assertion = genDeepEq(t);
  const setupT = assertion('m');

  const setupStore = 'give an new account should return an empty map.';

  t.deepEqual([...testStore.entries()], [], '');
});
