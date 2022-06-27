// @ts-check

import { makeZoe } from '@agoric/zoe';
import fakeVatAdmin from '@agoric/zoe/tools/fakeVatAdmin';
import { assert } from '@agoric/assert';
import { describe } from 'riteway/src/index';
import { E, HandledPromise } from '@agoric/eventual-send';
import { Id, Fn, FnT, Either, EitherT, TaskT, Task } from '../shared/ADTs';
import '@agoric/install-ses';

const Tests = () => {
  describe('hardened(id)::', async (assert) => {
    const hardenADT = (Type) => harden(Type);
    assert({
      given: 'hardenADT(Id.of(10))',
      should: 'create an interface of type Identity',
      actual: hardenADT(Id).of(10),
      expected: Id.of(100),
    }); // ?
  });

  describe('harden(Id):: x => F(x)', async (t) => {
    const hardenADT = (Type) => harden(Type);
    t({
      given: 'hardenADT(Id.of(10))',
      should: 'create an interface of type Identity',
      actual: hardenADT(Id.of(19)),
      expected: '100',
    }); // ?
  }); // ?

  // Ex1:
  // =========================
  const FnEither = FnT(Either);
  const { Right, Left } = Either;
  const { ask } = FnEither;
  // TODO: Use FnEither.ask to get the cfg and return the port
  const ex1 = () => ask.map((x) => x.port);

  describe('Ex1', async (assert) => {
    const result = ex1()
      .run({ port: 8080 })
      .fold(
        (x) => x,
        (x) => x,
      );
    assert({
      given: 'fold fn',
      should: 'return port',
      actual: result === 8080,
      expected: true,
    }); // ?
  });

  // Ex1a:
  // =========================
  const fakeDb = (xs) => ({ find: (id) => Either.fromNullable(xs[id]) });

  const connectDb = (port) =>
    port === 8080
      ? Right(fakeDb(['red', 'green', 'blue']))
      : Left('failed to connect');

  // TODO: Use ex1 to get the port, connect to the db, and find the id
  const ex1a = (id) => {};

  // describe("Ex1a", assert => {
  // 	assert.deepEqual('green', ex1a(1).run({port: 8080}).fold(x => x, x => x))
  // 	assert.deepEqual('failed to connect', ex1a(1).run({port: 8081}).fold(x => x, x => x))
  // })

  // Ex2:
  // =========================
  const posts = [
    { id: 1, title: 'Get some Fp' },
    { id: 2, title: 'Learn to architect it' },
    { id: 3 },
  ];

  const postUrl = (server, id) => [server, id].join('/');

  const fetch = (url) =>
    url.match(/serverA/gi)
      ? Task.of({ data: JSON.stringify(posts) })
      : Task.rejected(`Unknown server ${url}`);

  const ReaderTask = FnT(Task);

  // Use ReaderTask.ask to get the server for the postUrl
  const ex2 = (id) =>
    fetch(postUrl(server, id))
      .map((x) => x.data)
      .map(JSON.parse); // <--- get the server variable from ReaderTask

  describe('Ex2', async (assert) => {
    const actual = ex2(30)
      .run('http://serverA.com')
      .fork(
        (e) => console.error(e),
        (posts) => posts,
      );
    assert({
      given: `ex2(30)`,
      should: 'retun the correct string',
      actual,
      expected: posts[0].title,
    });
  });

  // Ex3:
  // =========================
  const TaskEither = TaskT(Either);

  const ertpApi = FnEither(Task.of(E));

  const Api1 = {
    getFavoriteId: (user_id) =>
      Task((rej, res) => res(user_id === 1 ? Right(2) : Left(null))),
    getPost: (post_id) =>
      Task((rej, res) => res(Either.fromNullable(posts[post_id - 1]))),
  };

  const Api2 = {
    getFavoriteId: (user_id) =>
      TaskEither((rej, res) => res(user_id === 1 ? Right(2) : Left(null))),
    getPost: (post_id) =>
      TaskEither((rej, res) => res(Either.fromNullable(posts[post_id - 1]))),
  };

  // TODO: Rewrite ex3 using Api2
  const ex3 = (user_id) =>
    Api1.getFavoriteId(user_id)
      .chain((epost_id) =>
        epost_id.fold(
          () => Task.of(Left()),
          (post_id) => Api1.getPost(post_id),
        ),
      )
      .map((epost) => epost.map((post) => post.title));

  describe('Ex3', (assert) => {
    ex3(1).fork(
      (e) => console.error(e),
      (ename) =>
        ename.fold(
          (error) => assert.deepEqual('fail', error),
          (name) => assert.deepEqual('Learn to architect it', name),
        ),
    );
  });

  // Bonus: write IdT
  // =========================
};
export { Tests };
