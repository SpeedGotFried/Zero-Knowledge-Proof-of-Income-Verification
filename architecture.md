# System Architecture

## Overview
The system enables a **Prover** (User) to prove to a **Verifier** (Bank/Service) that their income satisfies a requirement (e.g., `Income ≥ Threshold`) without revealing the actual `Income`. The `Income` is attested to by a trusted **Issuer** (Employer/Government).

## Entities

1.  **Issuer (Employer/Gov)**:
    *   Knows the user's real `Income`.
    *   Generates a **Pedersen Commitment** to the income: $C = g^{Income} \cdot h^{r}$ (where $r$ is a random blinding factor).
    *   Digitally signs the commitment $C$ to certify it belongs to the user and is valid.
    *   Sends $(C, r, Signature)$ to the Prover.

2.  **Prover (User)**:
    *   Receives $(C, r, Signature)$ from Issuer.
    *   Wants to prove `Income ≥ Threshold`.
    *   Generates a **Zero-Knowledge Range Proof** $\pi$.
        *   Public Inputs: $C$, $Threshold$, $IssuerPublicKey$.
        *   Private Witness: $Income$, $r$ (blinding factor), $Signature$.
    *   Sends $(C, \pi, Signature)$ to the Verifier.
    *   *Note: In some variants, the Prover might re-randomize $C$ to $C'$ to prevent tracking, but for this mini-project, we will stick to the base commitment signatures.*

3.  **Verifier (Bank)**:
    *   Verifies the Issuer's **Signature** on $C$ (ensures $C$ is a valid income record).
    *   Verifies the **ZKP** $\pi$ (ensures the value hidden in $C$ is $\ge Threshold$).
    *   Result: `Access Granted` or `Access Denied`.

## Cryptographic Primitives

*   **Group**: Elliptic Curve (e.g., secp256k1 or bn128) for hardness DLP.
*   **Commitment Scheme**: Pedersen Commitment.
    *   Perfectly hiding, computationally binding.
    *   $C = g^v \cdot h^r$.
*   **Signature Scheme**: ECDSA or EdDSA (on the curve used for commitments, or standard RSA/ECDSA if separate).
*   **Zero-Knowledge Proof**:
    *   **Relation**: $C$ commits to values $v, r$ such that $v \ge Threshold$ AND $C = g^v h^r$.
    *   **Non-Interactive**: Fiat-Shamir Heuristic.

## Protocol Flow

1.  **Setup**:
    *   System parameters $(g, h)$ are chosen (nothing-up-my-sleeve numbers).
    *   Issuer publishes Public Key $PK_{Issuer}$.

2.  **Issuance (Off-chain / Secure Channel)**:
    *   User requests income attestation.
    *   Issuer calculates $C = g^{Income} \cdot h^r$.
    *   Issuer signs $C$: $\sigma = Sign_{SK_{Issuer}}(C)$.
    *   Issuer sends $(C, r, \sigma)$ to User.

3.  **Proof Generation (Local on User Device)**:
    *   User wants to apply for a service requiring `Income >= T`.
    *   User computes Range Proof $\pi$ proving that the value in $C$ is $\ge T$.
    *   (Optional) Use a ZK-SNARK (Circom) or Bulletproofs.

4.  **Verification**:
    *   Verifier checks `VerifySig`($PK_{Issuer}, C, \sigma$).
    *   Verifier checks `VerifyZKP`($C, T, \pi$).
    *   If both pass, income is verified.





