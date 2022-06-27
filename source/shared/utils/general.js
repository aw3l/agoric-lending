// buildObject = ({a}, {b}} -> ({c})
const buildObject = (acc, val) => ({ ...acc, [val.key]: val.value });
// id :: a -> a
const identity = (x) => x;

const errorMessagesForUI = {
  proposalMsg: 'Incorrect proposal shape.',
  keywordsMsg: 'Incorrect keywords given to contract.',
};
const { proposalMsg, keywordsMsg } = errorMessagesForUI;
const handleError =
  (uiMessage = 'Default error message for UI') =>
  (error) => ({
    error,
    uiMessage,
  });
const withDefaultError = handleError();

const handleProposalError = handleError(proposalMsg);
const handleKeywordsError = handleError(keywordsMsg);

const compose =
  (...fns) =>
  (initial) =>
    fns.reduceRight((val, fn) => fn(val), initial);

export {
  identity as id,
  compose,
  handleError,
  withDefaultError,
  errorMessagesForUI,
  handleProposalError,
  handleKeywordsError,
};
