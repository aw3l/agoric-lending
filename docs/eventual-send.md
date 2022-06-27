# Development Notes on `E`
### `E` improvies on the JS-standard `Q` Promise
* `Q` standard **lacks weak references** which forces users to manage far too much information about an object..
* **Distributed (Object) Programming without `WeakRef` is not practical**.
## `E` innovation comes in the form of:
### 1. Non-blocking Promises
* `E` removes the blocking nature of current promises.
* Made possible by siloh-ing Promises within their own *vat*. Delegating the handling of promises to vats removes the limitation of traditional JS where all promises are exected within one-shared environmnet.


## ES6 `Promise` interface
* `(resolve, reject)` **change the state of the promise object**.
```js
const traditionalPromise = (err, success) => 
    new Promise((resolved, rejected) => !resolved ? rejected(err) : resolved(success)
```

## Promise Pipelines

P

```js
const fetcher = url => fetch(url);
const BASE_URL = `https://some-api.com/`;
const fetchUserId = username => fetcher(`${BASE_URL}/users/${username}`);
const fetchComments = id => fetcher(`${BASE_URL}/comments/${id}`);
const fetchCommentDetails = userId => fetchComments

const getFrontpageNews = date => fetcher(`${BASE_URL}/stories/${date}`);
const fetchLotteryResults = x => fetch(`${BASE_URL}/pennsylvania-lottery/${x}`);
const fetchLocalNews = x => fetch(`${BASE_URL}/stores/local/${x}`);


const handleGetComments = 
fetchUserId('tg18509')
  .then(res => res.json())
  .then(res => fetchComments(res.id))
  .then(res => res.json())
```

## Applying FP
Consider the following code:
```js
const zoe 

```

