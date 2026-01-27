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

## 📅 Week 2: Zero-Knowledge Proof Logic (Range Proofs) (🔄 IN PROGRESS)
- [ ] **Research & Setup**:
    - [ ] Add `bulletproofs` and `merlin` dependencies to `Cargo.toml`.
    - [ ] Understand Bulletproofs API for Range Proofs.
- [ ] **Implementation**:
    - [ ] Create `src/modules/zkp.rs`.
    - [ ] Implement `prove_range(commitment, value, blinding_factor)`: Generates ZKP that value is within range (e.g., > Threshold).
    - [ ] Implement `verify_range(proof, commitment)`: Verifies ZKP without knowing value.
- [ ] **Testing**:
    - [ ] Unit tests: Valid proof passes.
    - [ ] Unit tests: Tampered proof fails.
    - [ ] Unit tests: Wrong value range fails.

## 📅 Week 3: The "Bank" Oracle Service (Backend)
- [ ] **API Design**: Define the request/response structure between Prover and Bank.
- [ ] **Bank Logic (Rust)**:
    - [ ] Create `Bank` struct/service.
    - [ ] Method to receive `(Commitment, Proof)`.
    - [ ] Logic: Verify Proof -> If valid, Sign `(Commitment, "Approved")`.
- [ ] **Replay Protection**: Ensure same proof cannot be reused if necessary.
- [ ] **Server Setup**: Wrap this logic in a simple HTTP server (e.g., using Axum or Warp) or prep for Lambda.

## 📅 Week 4: Frontend 1 - Prover Wallet (User Side)
- [ ] **Project Init**: Initialize React + Vite + Tailwind app in `apps/prover-wallet`.
- [ ] **WASM Integration**:
    - [ ] Compile Rust ZKP logic to WASM (`wasm-pack`).
    - [ ] Expose `generate_proof` and `generate_commitment` to JS.
- [ ] **UI Implementation**:
    - [ ] Input Form: Salary Amount.
    - [ ] Action: "Generate Proof" (Client-side computation).
    - [ ] Network: Send Proof to Bank API.
    - [ ] Display: Show "Verified Token" received from Bank.

## � Week 5: Frontend 2 & 3 - Bank Console & Verifier Portal
- [ ] **Bank Portal (`apps/bank-portal`)**:
    - [ ] Scaffolding: React + Vite.
    - [ ] Dashboard: View incoming requests and stats (Logs).
- [ ] **Verifier Portal (`apps/verifier-service`)**:
    - [ ] Scaffolding: React + Vite.
    - [ ] UI: "Verify Token" Page.
    - [ ] Logic: Upload/Paste Token -> Verify Bank's Signature -> Show "Valid Income" badge.

## 📅 Week 6: System Integration
- [ ] **End-to-End Connection**:
    - [ ] Connect Prover App -> Bank API.
    - [ ] Connect Prover App -> Verifier App (via copy-paste or QR code of Token).
- [ ] **Error Handling**: Handle network failures, invalid proofs, server errors.
- [ ] **Refinement**: Improve UI/UX flow based on testing.

## 📅 Week 7: AWS Infrastructure & Deployment
- [ ] **Terraform Modules Refinement**:
    - [ ] Finalize `static-site` for 3 frontends.
    - [ ] Create `api-gateway` + `lambda` module for Bank Backend (Rust).
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
