# Zero-Knowledge Proof of Income Verification - Master Plan

**Goal**: Build a privacy-preserving income verification system.
**Tech Stack**: React (Portals) + Rust (Backend) + Circom (ZKP Circuits).
**Current Status**: **Prioritizing Week 4 & 5 (Frontend Development)**. Backend/Circom paused.

## 🏗️ System Architecture: The Three-Portals Model
1.  **User Portal** (`apps/user-portal`):
    *   The **ONLY** place sensitive data (Payslips) is uploaded.
    *   Handles Identity Binding & Use Case Selection (Loan vs Rental).
2.  **ZKP Verification Engine** (`backend` on AWS):
    *   The "Brain". **Stateless & Ephemeral**.
    *   Executes **Circom C++** binaries to generate proofs.
    *   **Rule**: "Raw income data is never stored. Wiped from RAM immediately."
3.  **Verifier Portals** (`apps/verifier-portals`):
    *   **Bank Portal**: Defines Loan Rules (Income >= X). Verifies Proofs.
    *   **Landlord Portal**: Defines Rental Rules (Income >= 3x Rent). Verifies Proofs.

## 🔄 The 7-Step Privacy Workflow
1.  **Identity** (User Portal): User binds ID to Crypto Key.
2.  **Upload** (User Portal): User connects source/uploads payslip for *ephemeral* use.
3.  **Use Case** (User Portal): "Apply for Loan" or "Rental".
4.  **Rules** (Backend): System fetches Thresholds from Bank/Landlord.
5.  **Prove** (Backend): Engine computes `Salary >= Threshold` ZK Proof.
6.  **Submit** (Network): Proof sent to Verifier.
7.  **Verify** (Verifier Portal): Cryptographic check -> Decision (Eligible/Not Eligible).

---

## 📅 Week 1: Core Cryptography & Fundamentals (✅ COMPLETED)
- [x] **Project Setup**: Initialize Rust project structure.
- [x] **Primitives**: `curve25519-dalek` (Kept for Signatures).

## 📅 Week 2: Circom Circuit Design (🔄 REFACTORING)
*Goal: Programmable Privacy using Circom.*

- [ ] **Setup Environment**:
    - [ ] Install `circom` (v2.1) + `snarkjs`.
    - [ ] Structure: `circuits/main/`, `circuits/scripts/`.
- [ ] **Circuit Logic (`income.circom`)**:
    - [ ] Template: `IncomeCheck()`.
    - [ ] Private Input: `salary`. Public Input: `threshold`.
    - [ ] Constraint: `salary >= threshold`.
- [ ] **Compilation Pipeline**:
    - [ ] Compile to C++: `circom income.circom --r1cs --wasm --sym --c`.
    - [ ] Build binary: `cd income_cpp && make`.
- [ ] **Trusted Setup (Groth16)**:
    - [ ] Phase 1: `snarkjs powersoftau ...` (BN128).
    - [ ] Phase 2: `snarkjs zkey ...` -> Export `verification_key.json`.

## 📅 Week 3: ZKP Verification Engine (Circom Integration)
*Goal: Rust Backend executing C++ Witness Generators (No JS).*

- [x] **Identity & Persistence**:
    - [x] DynamoDB Schema (`PK=USER#...`).
    - [x] `POST /register`: Identity Binding.
- [ ] **Prover Engine (`/prove`)**:
    - [ ] **Input**: Receive `salary`, `threshold`.
    - [ ] **Exec**: Run `./income_check input.json witness.wtns` (C++).
    - [ ] **Prove**: Run `rapidsnark` or `ark-groth16` -> Proof JSON.
    - [ ] **WIPE**: Securely delete `input.json` & `witness.wtns`.
- [ ] **Verifier Logic (`/verify`)**:
    - [ ] Load `verification_key.json`.
    - [ ] Validate Proof vs Threshold.

## 📅 Week 4: User Portal (Common Interface)
*Matches `prover_wallet` infrastructure.*

- [x] **Setup**: `apps/user-portal` (React + Vite). (Renamed from `prover-wallet`)
- [x] **Step 1 UI**: Login/Register (Identity Binding). (Implemented `IdentityBinding.jsx`)
- [x] **Step 2 UI**: "Upload Documents" (Triggers Ephemeral `/prove`). (Implemented `Dashboard.jsx`)
- [x] **Step 3 UI**: Selector for "Bank Loan" or "Rental Application". (Implemented `Dashboard.jsx`)
- [ ] **Step 5 UI**: Display Generated Proof Certificate.

## 📅 Week 5: Verifier Portals (Bank & Landlord)
*Matches `bank_portal` and `verifier_service` infrastructure.*

- [x] **Bank Portal**:
    - [x] Dashboard: Set Loan Thresholds. (Implemented `BankGuard UI`)
    - [x] Verify: Check Loan Application Proofs. (Implemented `Verification Console`)
- [x] **Landlord Portal**:
    - [x] Dashboard: Set Rental Multipliers. (Implemented `PropVerify UI`)
    - [x] Verify: Check Tenant Application Proofs. (Renamed from `verifier-service`)

## 📅 Week 6: System Integration
- [ ] **End-to-End**: User Upload -> Circom Backend -> Bank Verifier.
- [ ] **Performance**: Benchmark C++ generation speed.

## 📅 Week 7: AWS Deployment (ZKP Engine)
- [ ] **Dockerization**:
    - [ ] Multi-stage build: Node/Circom (Build) -> Rust (Build) -> Debian (Run).
    - [ ] Include C++ runtime libs (`libgmp`).
- [ ] **Infrastructure (`terraform/main.tf`)**:
    - [ ] Add `aws_dynamodb_table`.
    - [ ] Add `aws_app_runner_service` (or Lambda) for Backend.

## 📅 Week 8: Final Polish & Audit
- [ ] **Privacy Audit**: Verify "Zero Data Retention" policy implementation.
