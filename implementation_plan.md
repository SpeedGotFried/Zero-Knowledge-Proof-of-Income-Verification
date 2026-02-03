# Implementation Plan - Week 2: Zero-Knowledge Proof Logic

**Goal**: Implement the core ZKP logic using `bulletproofs` to enable a user to prove `Income >= Used + Rent` while keeping all values hidden.

## User Review Required
> [!NOTE]
> **Architecture Update**:
> We have added **Double-Spend Protection**. The Bank will track a `Used_Commitment` for each user.
> The ZKP now proves: `Income_Commitment - (Used_Commitment + Rent_Commitment) >= 0`.

## Proposed Changes

### Dependencies
#### [MODIFY] [Cargo.toml](file:///wsl.localhost/Ubuntu-22.04/home/speed/Crypto/Zero-Knowledge-Proof-of-Income-Verification/Cargo.toml)
- Add `bulletproofs = "4.0.0"`
- Add `merlin = "3.0"`
- Add `rand = "0.8"`

### Core ZKP Module
#### [NEW] [src/modules/zkp.rs](file:///wsl.localhost/Ubuntu-22.04/home/speed/Crypto/Zero-Knowledge-Proof-of-Income-Verification/src/modules/zkp.rs)
- **Functions**:
    - `prove_available_funds(...)`:
        - Inputs:
            - `income_val`, `income_blinding`
            - `used_val`, `used_blinding` (Current state of debt)
            - `rent_val`, `rent_blinding` (New request)
        - Computation:
            - `Available = Income - Used - Rent`.
            - Create commitment to `Available`.
            - Generate Bulletproof Range Proof that `Available >= 0`.
    - `verify_available_funds(...)`:
        - Inputs:
            - `C_Income` (Signed by Employer)
            - `C_Used` (Tracked by Bank)
            - `C_Rent` (From User)
            - `Proof`
        - Logic:
            - Derive `C_Available = C_Income - C_Used - C_Rent`.
            - `verify_range_proof(C_Available, Proof)`.

### Week 3 Preview (Bank Logic)
- **State DB**: Map `Hash(C_Income) -> C_Used`.
- **Update Logic**: On success, `C_Used = C_Used + C_Rent`.

## Verification Plan

### Automated Tests
- **Scenario A (First Rent)**:
    - User has 100k, Used 0.
    - Request 40k. `100 - 0 - 40 = 60 >= 0`. **PASS**.
- **Scenario B (Second Rent)**:
    - User has 100k, Used 40k.
    - Request 40k. `100 - 40 - 40 = 20 >= 0`. **PASS**.
- **Scenario C (Overdraft)**:
    - User has 100k, Used 80k.
    - Request 30k. `100 - 80 - 30 = -10`. **FAIL**.
