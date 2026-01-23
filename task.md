# Zero-Knowledge Proof of Income Verification - Project Plan

**Goal**: Build a privacy-preserving income verification system using a **Delegated Verification** model. The Prover proves income to a Trusted 3rd Party (Bank/Oracle) via ZKP. The Bank verifies the ZKP and issues a "Certified Token", which the Prover presents to the final Verifier.

**Timeline**: 8-10 Weeks

## 📅 Week 1-2: Commitments & Infrastructure (COMPLETED)
- [x] **Define System Architecture**: Issuer (Employer), Prover (User), Bank (Oracle), Verifier (Service).
- [x] **Cryptographic Primitives**: Implement elliptic curves (Ristretto255/Curve25519).
- [x] **Pedersen Commitments**: Implement `Commit(value, randomness) -> C`.
- [x] **Issuer Module**: Ability to sign commitments.
- [x] **Unit Tests**: Verify homomorphic properties.

## 📅 Week 3-4: ZKP & Delegated Verification logic
- [ ] **Prover -> Bank (ZKP)**:
    - [ ] Implement Range Proof (Bulletproofs): `Income >= T`.
    - [ ] Prover generates logic to send `Proof(C, T)` to Bank.
- [ ] **Bank (Trusted Oracle) Logic**:
    - [ ] Verify ZKP from Prover without seeing `Income`.
    - [ ] **Attestation**: If valid, sign a new assertion: `Sig(ProverID, T, "Verified")`.
- [ ] **Prover -> Verifier (Exchange)**:
    - [ ] Prover receives Bank's signature.
    - [ ] Prover forwards Bank's signature to Final Verifier (Landlord/Service).

## ☁️ Parallel Track: AWS Infrastructure (Terraform)
- [ ] **Terraform Module Setup**:
    - [ ] Create reusable `static-site` module (S3 + CloudFront).
    - [ ] **Deploy Portal 1**: Bank Console (`/apps/bank-portal`).
    - [ ] **Deploy Portal 2**: Prover Wallet (`/apps/prover-wallet`).
    - [ ] **Deploy Portal 3**: Verifier Service (`/apps/verifier-service`).
- [ ] **CI/CD**: GitHub Actions to build and sync all 3 apps to respective buckets.

## 💻 Parallel Track: Frontend Portals (React + Vite + Tailwind)
- [x] **Scaffolding**: Create directory placeholders for all 3 apps.
- [ ] **Portal 1: Bank/Oracle Console**
    - [ ] **Role**: Trusted Intermediary.
    - [ ] **Features**: Receive ZKP requests, Automated Verification, Issue "Verified" Tokens.
- [ ] **Portal 2: Prover Wallet (User)**
    - [ ] **Features**: Dashboard to view Income `C`, drag-and-drop to "Apply for Verification" (Generates ZKP -> Sends to Bank -> Gets Token).
- [ ] **Portal 3: Final Verifier Portal (Service)**
    - [ ] **Features**: Simple check: "Is this Bank Token valid?".
    - [ ] **Benefit**: Does not need to run heavy crypto verification, just checks Bank's signature.

## 📅 Week 7-8: Integration & Security
- [ ] **End-to-End Flow**: Prover -> Bank (Oracle) -> User Device -> Final Verifier.
- [ ] **Security Audit**: Ensure Bank cannot revert ZKP to find plain income.
- [ ] **Documentation**: Sequence diagrams for the 3-party flow.
