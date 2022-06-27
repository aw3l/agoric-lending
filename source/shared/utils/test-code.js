import { Either, Fn, FnT } from './source/shared/ADTs';

const stateFn = FnT(Fn.of((env) => ({ ...env, keywords: ['Test'] })));

// .map(x => x) //?
// .run())//?

const { tryCatch } = Either;

const x = 5;
const b = 3;

const y = (a, b) =>
  tryCatch(() => (a > b ? undefined : new Error('Error!'))).map((x) => {
    console.log('res', x);
    return stateFn.chain((x) => x);
  }); // ?

const stateB = y(2, 1).map((x) => ({
  ...x,
  updated: '!!!!',
  keys: x.keywords,
}));

stateB.run({ startingPoint: 'yooo' }); // ?
