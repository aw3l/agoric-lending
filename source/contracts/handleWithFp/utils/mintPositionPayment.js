// @ts-check

import { AmountMath } from '@agoric/ertp';
import { E } from '@agoric/eventual-send';

/**
 * @param {ContractFacet} zcf
 * @param {ZCFMint} zcfMint
 * @param {Amount} amountToMint
 * @returns {Promise<Payment>}
 */
const mintZCFMintPayment = async (zcf, zcfMint, amountToMint) => {
  const { userSeat, zcfSeat } = zcf.makeEmptySeatKit();
  zcfMint.mintGains({ Position: amountToMint }, zcfSeat);
  zcfSeat.exit();
  const payout = await E(userSeat).getPayout('Position');
  return payout;
};
harden(mintZCFMintPayment);

export { mintZCFMintPayment };
