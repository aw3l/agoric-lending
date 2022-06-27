import { makeIssuerKit, AmountMath } from '@agoric/ertp';
import makeStore from '@agoric/store';
import fakeVatAdmin from '@agoric/zoe/tools/fakeVatAdmin';

import { makeZoe } from '@agoric/zoe';

const setup = () => {
  const linkBundle = makeIssuerKit('link');
  const laLinkBundle = makeIssuerKit('laLink');
  const laRunBundle = makeIssuerKit('laRun');
  const laBldBundle = makeIssuerKit('laBld');

  const usdcBundle = makeIssuerKit('usdc');
  const runBundle = makeIssuerKit('run');
  const bldBundle = makeIssuerKit('bld');
  const allBundles = {
    laLink: laLinkBundle,
    laRun: laRunBundle,
    laBld: laBldBundle,
    link: linkBundle,
    run: runBundle,
    bld: bldBundle,
    usdc: usdcBundle,
  };
  /** @type {Store<string, Brand>} */
  const brands = makeStore('brandName');

  for (const k of Object.getOwnPropertyNames(allBundles)) {
    brands.init(k, allBundles[k].brand);
  }

  const zoe = makeZoe(fakeVatAdmin);

  const makeSimpleMake = (brand) => (value) => AmountMath.make(value, brand);

  /**
   * @typedef {Object} BasicMints
   * @property {IssuerKit} usdcKit
   * @property {Brand} usdcBrand
   * @property {Issuer} usdcIssuer
   * @property {Issuer} linkIssuer
   * @property {Mint} linkMint
   * @property {IssuerKit} linkR
   * @property {IssuerKit} linkKit
   * @property {Brand} linkBrand
   * @property {Issuer} runIssuer
   * @property {Mint} runMint
   * @property {IssuerKit} runR
   * @property {IssuerKit} runKit
   * @property {Brand} runBrand
   * @property {Issuer} bldIssuer
   * @property {Mint} bldMint
   * @property {Brand} bldBrand
   * @property {IssuerKit} bldR
   * @property {IssuerKit} bldKit
   * @property {Store<string, Brand>} brands
   * @property {(value: any) => Amount} link
   * @property {(value: any) => Amount} run
   * @property {(value: any) => Amount} bld
   * @property {(value: any) => Amount} usdc
   * @property {ZoeService} zoe
   */

  /** @type {BasicMints} */
  const result = {
    usdcKit: usdcBundle,
    usdcBrand: usdcBundle.brand,
    usdcIssuer: usdcBundle.issuer,
    linkIssuer: linkBundle.issuer,
    linkMint: linkBundle.mint,
    linkR: linkBundle,
    linkKit: linkBundle,
    linkBrand: linkBundle.brand,
    runIssuer: runBundle.issuer,
    runMint: runBundle.mint,
    runR: runBundle,
    runBrand: runBundle.brand,
    runKit: runBundle,
    bldIssuer: bldBundle.issuer,
    bldMint: bldBundle.mint,
    bldR: bldBundle,
    bldBrand: bldBundle.brand,
    bldKit: bldBundle,
    brands,
    link: makeSimpleMake(linkBundle.brand),
    run: makeSimpleMake(runBundle.brand),
    bld: makeSimpleMake(bldBundle.brand),
    usdc: makeSimpleMake(usdcBundle.brand),
    zoe,
  };
  harden(result);
  return result;
};
harden(setup);
export { setup };
