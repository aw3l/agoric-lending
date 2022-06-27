// @ts-check
import { AmountMath } from '@agoric/ertp';
import { E } from '@agoric/eventual-send';

/**
 * @param {import("ava").ExecutionContext<unknown>} t
 * @param {UserSeat} seat
 * @param {Keyword} keyword
 * @param {IssuerKit} kit
 * @param {Amount} expected
 * @param {string} message
 */
const checkPayout = async (t, seat, keyword, kit, expected, message = '') => {
  const payout = await E(seat).getPayout(keyword);
  const amount = await kit.issuer.getAmountOf(payout);
  t.truthy(AmountMath.isEqual(amount, expected), message);
  t.truthy(seat.hasExited(), message);
};
const trackUsersDeposits =
  (liqudityStateMap) =>
  ({ brand, value }) =>
    liqudityStateMap.has(brand)
      ? liqudityStateMap.get(brand)
      : liqudityStateMap.init(brand, value);

export { trackUsersDeposits, checkPayout };
