# Zero-Knowledge Proof of Income Verification - 8 Week Plan

**Goal**: Build a privacy-preserving income verification system using a **Delegated Verification** model.
**Timeline**: 8 Weeks
**Current Status**: Week 1 Completed. Starting Week 2.

## 📅 Week 1: Core Cryptography & Fundamentals (✅ COMPLETED)
- [x] **Project Setup**: Initialize Rust project structure.
- [x] **Cryptographic Primitives**: Setup `curve25519-dalek`.
- [x] **Pedersen Commitments**:
    - [x] Implement `Commit(value, randomness) -> C` in `src/modules/pedersen.rs`.
- [x] **Issuer Module**:
    - [x] Implement Signing/Key generation in `src/modules/issuer.rs`.
- [x] **Prover Structure**:
    - [x] Basic struct definitions in `src/modules/prover.rs`.

## 📅 Week 2: Zero-Knowledge Proof Logic (Range Proofs) (✅ COMPLETED)
- [x] **Research & Setup**:
    - [x] Add `bulletproofs` and `merlin` dependencies to `Cargo.toml`.
    - [x] Understand Bulletproofs API for Range Proofs.
- [x] **Implementation**:
    - [x] Create `src/modules/zkp.rs`.
    - [x] Implement `prove_range(commitment, value, blinding_factor)`: Generates ZKP that value is within range (e.g., > Threshold).
    - [x] Implement `verify_range(proof, commitment)`: Verifies ZKP without knowing value.
- [x] **Testing**:
    - [x] Unit tests: Valid proof passes.
    - [x] Unit tests: Tampered proof fails.
    - [x] Unit tests: Wrong value range fails.

## 📅 Week 3: The "Bank" Oracle Service (Backend)
- [x] **API Design**: Define the request/response structure between Prover and Bank.
- [x] **Bank Logic (Rust)**:
    - [x] Create `Bank` struct/service.
    - [x] Method to receive `(Commitment, Proof)`.
    - [x] Logic: Verify Proof -> If valid, Sign `(Commitment, "Approved")`.
- [x] **Replay Protection**: Ensure same proof cannot be reused if necessary.
- [x] **Server Setup**: Wrap this logic in a simple HTTP server (e.g., using Axum or Warp) or prep for Lambda.

## 📅 Week 4: Frontend 1 - Prover Wallet (User Side)
- [x] **Project Init**: Initialize React + Vite + Tailwind app in `apps/prover-wallet`.
- [x] **WASM Integration**:
    - [x] Compile Rust ZKP logic to WASM (`wasm-pack`).
    - [x] Expose `generate_proof` and `generate_commitment` to JS.
- [x] **UI Implementation**:
    - [x] Input Form: Salary Amount.
    - [x] Action: "Generate Proof" (Client-side computation).
    - [x] Network: Send Proof to Bank API.
    - [x] Display: Show "Verified Token" received from Bank.

## 📅 Week 5: Frontend 2 & 3 - Bank Console & Verifier Portal
- [x] **Bank Portal (`apps/bank-portal`)**:
    - [x] Scaffolding: React + Vite.
    - [x] Dashboard: View incoming requests and stats (Logs).
- [x] **Verifier Portal (`apps/verifier-service`)**:
    - [x] Scaffolding: React + Vite.
    - [x] UI: "Verify Token" Page.
    - [x] Logic: Upload/Paste Token -> Verify Bank's Signature -> Show "Valid Income" badge.
- [x] **Developer Tools**:
    - [x] Script `misc-scripts/run_frontends.sh` to run all apps concurrently.

## 📅 Week 6: System Integration (✅ COMPLETED)
- [x] **End-to-End Connection**:
    - [x] Connect Prover App -> Bank API.
    - [x] Connect Prover App -> Verifier App (via copy-paste or QR code of Token).
- [x] **Error Handling**: Handle network failures, invalid proofs, server errors.
- [x] **Refinement**: Improve UI/UX flow based on testing.

## 📅 Week 7: AWS Infrastructure & Deployment
- [x] **Terraform Modules Refinement** (Code Generated) <!-- id: 39 -->
    - [x] Finalize `static-site` for 3 frontends (`apps/*` -> S3). <!-- id: 40 -->
    - [x] Create `api-gateway` + `lambda` module for Bank Backend. <!-- id: 41 -->
- [ ] **Multi-Env Setup**:
    - [ ] Ensure `dev` and `prod` state separation works.
- [ ] **Multi-Env Setup**:
    - [ ] Ensure `dev` and `prod` state separation works.
    - [ ] `connect.dev` / `connect.prod` scripts usage.
- [ ] **CI/CD**:
    - [ ] GitHub Actions for automated build & deploy.

## 📅 Week 8: Security Audit & Final Release
- [ ] **Security Review**:
    - [ ] Review commitment hiding properties.
    - [ ] Ensure non-interactive zero-knowledge.
    - [ ] Audit dependencies.
- [ ] **Documentation**:
    - [ ] Write API Docs.
    - [ ] Create Architecture Diagrams.
- [ ] **Final Demo**: Prepare a walkthrough video/live demo script.
