// TEST WORK
// NOT TO BE MERGED IN
import { EitherT, TaskT, Either, FnT, Fn, Task } from '../../shared/ADTs';
import { safeAssertIssuerKeywords } from '../../shared/utils/zoe';

const FnTask = FnT(Task);

const trace = (label) => (value) => {
  console.log(`${label}::`, value);
  return value;
};
const y = FnTask.ask
  .map((x) => {
    console.log(x);
    return FnTask.of(x + 5);
  })
  .chain((fiftenn) => {
    console.log(fiftenn);
    return FnTask.of(fiftenn + 5);
  });
// y.chain(twenty => .lift(Task.of(twenty).fork(x => x , y => y))) //?
y.map(trace('befroe run')) // ?
  .chain((inner) => {
    console.log(inner);
    return FnTask.of(inner);
  })
  .run({ some: 'state' })
  .fork(
    (x) => x,
    (x) => x,
  ); // ?
// {env: 'tom'}) //?

const TaskEither = TaskT(Either);

const checker = () => new Error('throwing error!');
const assertTestE = (x) => Either.tryCatch(() => safeAssertIssuerKeywords);
assertTestE(10);
assertTestE(undefined);

const exclaim = (str) => `${str}!`;

const toUpper = (x) => x.string.toUpperCase();

Fn.of = (x) => Fn(() => x);

const res = Fn(toUpper)
  .chain((upper) => Fn((x) => ({ ...x, y: exclaim(upper) })))
  .run({ string: 'hi' });

console.log(res); // ['HI', 'hi!']

const mapReader = Fn.of({ liquidityMap: new Map() });

Fn('')
  .concat(Fn.of({ name: 'tom' }))
  .run((x) => x.concat(y));
mapReader.run({
  currentBrand: 'Link',
  liquidityMap: new Map(),
}); // ?

const res1 = Fn('hello')
  .map(toUpper)

  .chain((upper) => Fn((x) => [upper, exclaim(x)]))

  .run('hi');

console.log(res1);
// ['HELLO', 'hi!']

// [3] Making the method more convenient - this becomes the Reader Monad!

Fn.ask = Fn((x) => x);

const res2 = Fn(toUpper)
  // This is called a Reader because we can transform

  // and still get back to the original

  .chain((upper) => Fn((x) => [upper, exclaim(upper)]))

  .run('hi');

console.log(res2); // ['HI', 'hi!']

const res3 = Fn('hello')
  .map(toUpper)

  .chain((upper) => Fn.ask.map((config) => [upper, config]))

  .run({ port: 3000 });

console.log(res3); // ['HELLO', {port: 3000}]

const addKey =
  (value = 0n) =>
  (key) =>
  (m) =>
    m.set(key, value);

Fn.of((x) => x).run({ liquidityMap: new Map() }); // ?
