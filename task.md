# Zero-Knowledge Proof of Income Verification - Project Plan

**Goal**: Build a privacy-preserving income verification system where a user can prove `income ≥ threshold` without revealing their actual income.

**Timeline**: 8 Weeks (2 Months)

## 📅 Week 1-2: Commitments & Infrastructure (CURRENT)
- [ ] **Define System Architecture**: Issuer, Prover, Verifier roles.
- [ ] **Cryptographic Primitives**: Implement elliptic curves or selecting a library (e.g., `py_ecc` or `fastecdsa`).
- [ ] **Pedersen Commitments**: Implement `Commit(value, randomness) -> C`.
- [ ] **Issuer Module**: Ability for Issuer (Employer) to sign a commitment `Sig(Commit(Income))`.
- [ ] **Unit Tests**: Verify homomorphic properties of commitments.

## 📅 Week 3-4: ZKP & Range Proofs
- [ ] **Range Proof Implementation**:
    - [ ] Implement Bulletproofs (or Bulletproofs-like range proof) OR
    - [ ] Integrate Circom + SnarkJS for `income >= threshold`.
- [ ] **Fiat-Shamir**: Make the proof non-interactive.
- [ ] **Prover Module**: Generate proof $\pi$ using witness $(income, randomness)$.
- [ ] **Verifier Module**: Verify proof $\pi$ against public commitment $C$.

## 📅 Week 5-6: Integration & API
- [ ] **Communication Protocol**: Define data standard (JSON) for exchanging proofs.
- [ ] **Integration**: Connect Issuer -> Prover -> Verifier flows.
- [ ] **CLI / Basic UI**: Simple command-line interface to run the full flow.

## 📅 Week 7-8: Testing & Security Analysis
- [ ] **Security Audit**: Threat model analysis (MITM, replay, forgery).
- [ ] **Performance Testing**: Measure proof generation and verification time.
- [ ] **Documentation**: Finalize report and code breakdown.
