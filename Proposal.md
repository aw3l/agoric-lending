# Add Liquidity to a Lending Pool
## A. User makes an offer using:
- the public invitation associated with the lending pool of a specific brand
    - Example invitations: `createPosition`, `createRunPoolPosition`
- A payment record indicating both token brand as well as the amount being deposited.
## B. Lending Pool exchanges collateral payment for a "LendingPoolPosition" NFT.
- `zcfSeat` → The reserve supply for a given brand's lending pool is increased by the amount of tokens deposited.
- `userSeat` → Lending Pool NFT
    - Unique ID → Used to retrieve other details within NFT (below).
    - totalAmountSupplied → Represents the total amount of tokens that this position has provided to the pool as collateral.
    - maxWithdrawAmount → Represents the amount of tokens that a user can withdraw.
    - underlyingBrand → underlying brand which this lending pool is made up of.
    - isCollateral → boolean value indicating whether the user wishes to
    - maxLoanAmount → number representation of the in terms of an asset.
    - percentageOfPoolNotifier -> function used to calculate the interest that the position has claim over.
   
## C. Update the Lending Pool details 
- Each time a LendingPoolPosition NFT is minted, a reference to its unique ID is stored by the lending pool → Not sure of best way to manage this state?
- Also need to keep a record for the Lending Pool containing:
    * total borrow amount
    * total supplied.
    * currentInterestRate.
        * Code for calculating interest rate [shared/utils/interestRates.js](./source/shared/utils/interestRates.js)


## D. Increment the `userSeat` with the LendingPoolPosition NFT
- `userSeat.exit()`

## E. Provide the users with invitations for:

- Adding additional collateral to the lending pool
    - ex. `updatePosition`
    - Question → could this be tied to an NFTs unique ID?
- The ability to borrow against this collateral → `createBorrowPosition`

# `updatePosition`  invitation

### Scenario A: Increase the `totalAmountSupplied` property of an LendingPoolPositionNFT

1. User makes an offer that consists of:
    - Proof of ownership regarding a LendingPoolNFT
    - Payment information
    - Specify the intent of the offer (?) ex.
2. Unique ID of NFT is used to verify that it is a valid position in the pool. 

### Scenario B:  Decrease the `totalAmountSupplied` property

1. User makes an offer that consists of:
    - Proof of ownership regarding a LendingPoolNFT
    - argument uses to specify the intent of this offer → ex. `withdrawFromPosition`.

### Scenario C: Toggle the `isCollateral` property

1. User makes an offer that consists of:
    - Proof of ownership over LendingPoolNFT
    - argument uses to specify the intent of this offer → ex. `toggleIsCollateral`

## For all scenarios above:

1.  mint a new LendingPoolPosition NFT -> supply to userSeat.
    - Use state from the LendingPoolPosition NFT included in the offer to calculate updated values (for properties that need it).
    - Is it ok to keep the exisiting unique ID? Or instead, should this NFT consist of a new unique id which would then be added to the set of IDs that the Lending Pool manages in place of the prior ID used?
2. Burn the previous LendingPoolPosition NFT (if necessarry)
3. Update Lending Pool record 
 * As mentioned in ## C. Update the Lending Pool details
5. exit offer.


# `createBorrowPosition`

### A. User makes offer to borrow a payment of brand `X` from the platform.
* Problem: 
    * Should the user needs to include the LendingPoolPosition NFTs that they possess?
    * Is there a way to update the users `borrow` invitation so that it comes pre-defined with their exisiting positions
### B. Lending Pool uses NFTs to assert maximum loan availability.
* Both LendingPoolPosition and BorrowPosition NFTs used to calculate this.

### C. Update Lending Pool state 
* Update borrowPositions manager to include the newly minted NFT.
* Update interest rate using code with each borrow/deposit 
 > Not exactly sure what approach I should take here.
    * Mint a BorrowPosition NFT (?) with:
        * borrowAmount
        * interestRateObserver 
        * priceAuthorityObserver
### D. Lending Pool provides user with an invitation for: 
* `claimLoan` invitation -> used to  (Or supply the user?) 
* `createBorrowPosition` - (?) holding a reference to this BorrowPosition NFT.
* `makeRepayment` - (?) holding a reference to this BorrowPosition NFT.


# `makeRepayment`

### Scenario A: Payment covers entire loan balance
> * *Question remains of whether the existing BorrowPosition NFT needs to be included in offer*

1. Lending Pool recoops the tokens borrowed + interest amount.
    * Left over amount is returned to user if it exists.
    * Keep this intera 
4.   that is lenders have 
5. Manage Lending Pool Properties
    * Unique ID is removed from set of open BorrowPosition NFTs.
    * totalInterestAccrued is updated.
6. BorrowPosition NFT is burned -> user exits offer.
7. return a new, "empty" `createBorrowPosition`

### Scenario B: Partial repayment 

1. Lending Pool recoops `X` tokens being repaid + interest.
2. Either new BorrowPosition NFT is minted || Exisiting NFT is updated.
    * New NFT Minted with a new unique ID -> Existing NFT is burned.
3. Manage Lending Pool Properties
    * borrowAmount is decreased.
    * liqudity is increased.
    * borrowPositions set is updated.
    * totalinterestAccrued
4. provide updated NFT to userSeat.
5. exit.

