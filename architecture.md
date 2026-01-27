# System Architecture

## Overview
The system enables a **Prover** (User) to prove to a **Verifier** (Landlord/Service) that their income satisfies a requirement (e.g., `Income >= Rent`) without revealing the actual `Income`. The `Income` is attested to by a trusted **Issuer** (Employer). The **Bank** (Intermediary) facilitates this verification blindly and prevents double-spending.

## Entities

1.  **Issuer (Employer)**:
    *   Knows the user's real `Income`.
    *   Generates a **Pedersen Commitment**: $C_{Income} = g^{Income} \cdot h^{r}$.
    *   Digitally signs $C_{Income}$ to certify it.
    *   Sends $(C_{Income}, r, Signature)$ to the Prover.

2.  **Prover (User)**:
    *   Wants to rent a property costing `Rent` (e.g., 50,000).
    *   Calculates a commitment to the rent: $C_{Rent} = g^{Rent} \cdot h^{r_{rent}}$.
    *   Generates a **Zero-Knowledge Range Proof** $\pi$ proving:
        *   `Income >= (Already_Committed_Amount + Rent)`
    *   Sends $(C_{Income}, C_{Rent}, \pi)$ to the Bank.

3.  **Bank (Trusted Intermediary)**:
    *   **Stateful Tracking**: Maintains a record of `Total_Committed_Usage` for each `C_{Income}` to prevent double-spending.
        *   $C_{Used} = C_{Rent_1} + C_{Rent_2} + ...$ (Homomorphic Addition).
    *   **Blind Verification**:
        *   Verifies Issuer's Signature on $C_{Income}$.
        *   Verifies ZKP $\pi$: `Income - (Used + Rent) >= 0`.
    *   **Issuance**: If valid, updates $C_{Used}$ and signs $C_{Rent}$ as "Funds Verified".

4.  **Verifier (Landlord)**:
    *   Receives $(C_{Rent}, Rent, r_{rent})$ and Bank's Signature from Prover.
    *   Checks Bank's Signature on $C_{Rent}$.
    *   Opens $C_{Rent}$ to ensure it equals the expected `Rent`.
    *   **Outcome**: Knows user has sufficient funds for *this* rent, without knowing total income or other debts.

## Cryptographic Primitives

*   **Commitment Scheme**: Pedersen ($C = g^v \cdot h^r$).
    *   **Homomorphic Property**: $C(A) \cdot C(B) = C(A+B)$.
    *   Allows Bank to compute $C_{NewTotal} = C_{CurrentTotal} \cdot C_{Rent}$ without knowing values.
*   **Zero-Knowledge Proof**: Bulletproofs (Range Proofs).
    *   Proves $v \in [0, 2^{64})$ for a committed value $C$.
    *   Here, prove $C_{Balance} = C_{Income} \cdot (C_{Used} \cdot C_{Rent})^{-1}$ is a commitment to a positive value.

## Protocol Flow

1.  **Setup**: Employer issues signed $C_{Income}$ to User.
2.  **Request (User -> Bank)**:
    *   User creates $C_{Rent}$.
    *   User fetches current $C_{Used}$ from Bank (or tracks it).
    *   User proves: $Income - Used - Rent \ge 0$.
    *   Sends Proof + $C_{Rent}$ to Bank.
3.  **Verification (Bank)**:
    *   Bank verifies sig on $C_{Income}$.
    *   Bank verifies Proof.
    *   **Update State**: $C_{Used} \leftarrow C_{Used} \cdot C_{Rent}$.
    *   Bank signs $C_{Rent}$ and returns to User.
4.  **Final Check (User -> Landlord)**:
    *   User gives Landlord: `Rent` amount, opening factor $r_{rent}$, and Bank-signed $C_{Rent}$.
    *   Landlord confirms $C_{Rent}$ opens to `Rent` and is signed by Bank.

## Privacy & Safety Analysis
*   **Privacy**: Bank sees only Commitments ($C_{Income}, C_{Rent}, C_{Used}$). Never sees integer values.
*   **Double-Spend**: Bank tracks $C_{Used}$. If User tries to commit more Rent than Income, the Range Proof ($Income - Used - Rent \ge 0$) will fail.
