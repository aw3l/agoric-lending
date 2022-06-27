import { Far } from '@agoric/marshal';
import assert from '@agoric/assert';

let counter;
const countRemotable = Far('counter', {
  increment() {
    counter++;
  },
  decrement() {
    counter--;
  },
  read() {
    return counter;
  },
});

harden(countRemotable);

const start = {
  status: ':(',
};
const state = (obj = {}) => ({
  value: obj,
  concat: (other) => ({ ...other.value, obj }),
});

const startTgLd = Far('startTgLd', {
  runState: () => state(start),
});

state({ name: 'lari' }).concat(state({ name: 'thomas' })); // ?
