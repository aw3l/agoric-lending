/* global __dirname */
// @ts-check

import '@agoric/zoe/exported';
import '@agoric/zoe/src/contracts/exported';
import { makeFakePriceAuthority } from '@agoric/zoe/tools/fakePriceAuthority';
import { AssetKind, makeIssuerKit } from '@agoric/ertp';
import buildManualTimer from '@agoric/zoe/tools/manualTimer.js';

const defaultBrands = {
  in: {
    getDisplayInfo: () => 'Default Token IN Brand',
    getAllegedName: () => 'DFLT-IN',
  },
  out: {
    getDisplayInfo: () => 'Default Token Out Brand',
    getAllegedName: () => 'DFLT-OUT',
  },
};

const linkKit = makeIssuerKit('LINK');
const runKit = makeIssuerKit('RUN');

const defaultPriceAuthorityOptions = {
  brandIn: linkKit.brand,
  brandOut: runKit.brand,
  priceList: [80],
  tradeList: undefined,
  timer: buildManualTimer(console.log, 0n),
};

const createTestPriceData = ({
  brandIn,
  brandOut,
  ...rest
} = defaultPriceAuthorityOptions) => ({
  ...rest,
  actualBrandIn: brandIn,
  actualBrandOut: brandOut,
});

const getPriceData = (o) => makeFakePriceAuthority(createTestPriceData(o));

export { getPriceData, createTestPriceData };
