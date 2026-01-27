# Plan for Akhil Vignesh (Backend & AWS Infra)

**Branch:** `feat-release` (Working on backend/aws/terraform only)

**Goal:** Deliver a fully functional, privacy-preserving income verification backend deployed on AWS with infrastructure-as-code by the end of 4 weeks.

---

## Week 1: Core Cryptography & Backend Logic (Rust)

**Focus:** Complete the Zero-Knowledge Proof (ZKP) implementation and core business logic.

### Day 1-2: ZKP Range Proof Implementation
- [ ] Research & implement bulletproofs or specific range proof logic in `src/modules/proofs.rs`.
- [ ] Implement `Verification` logic for the range proof.
- [ ] Unit tests for `proofs.rs` to ensure completeness and soundness.

### Day 3-4: Refactor & Module Integration
- [ ] Refactor `main.rs` to separate concerns; move core flows into a library structure.
- [ ] Create a `CoreEngine` struct that exposes high-level API methods: `issue_credential`, `generate_proof`, `verify_proof`.
- [ ] Ensure `issuer.rs`, `prover.rs`, `pedersen.rs` are strictly coupled only where necessary.

### Day 5: Testing & Documentation
- [ ] Write integration tests simulating a full flow: Issue -> Prove -> Verify.
- [ ] Document internal Rust modules for clarity (`cargo doc`).

**Deliverable:** Rust codebase capable of generating and verifying range proofs locally with 90%+ test coverage on core logic.

---

## Week 2: Backend API & Serverless Prep

**Focus:** Expose Rust logic via an HTTP API and prepare for AWS Lambda.

### Day 1-2: Rust HTTP Server (Actix-web or Axum)
- [ ] Create a new binary `server` in `src/bin/server.rs`.
- [ ] Implement endpoints:
    - `POST /issue` (Issuer logic)
    - `POST /verify` (Verifier logic)
- [ ] Note: Prover logic typically runs on client-side (WASM/Mobile), but for backend testing, you can expose a test endpoint.

### Day 3-4: Lambda Compatibility
- [ ] Introduce `lambda_http` and `lambda_runtime` crates.
- [ ] Create a wrapper to run the Rust server/handlers in AWS Lambda environment.
- [ ] Local testing of Lambda functions using `cargo lambda` (if available) or Docker.

### Day 5: Dockerization (Optional but Recommended)
- [ ] Create a `Dockerfile` for the Rust backend to ensure consistent build environment.
- [ ] Verify local API functionality with cURL/Postman.

**Deliverable:** Functional HTTP API wrapping the Rust core logic, ready for serverless deployment.

---

## Week 3: Infrastructure as Code (Terraform)

**Focus:** Define complete AWS Infrastructure for the backend.

### Day 1-2: Compute Layer (Lambda/Fargate)
- [ ] Create `terraform/modules/compute` for AWS Lambda.
- [ ] Define Lambda resources for `issuer-service` and `verifier-service`.
- [ ] Set up IAM roles and permissions (least privilege).

### Day 3: API Gateway & Networking
- [ ] Create `terraform/modules/api_gateway`.
- [ ] Define HTTP API (API Gateway v2) triggering the Lambda functions.
- [ ] Configure CORS settings to allow frontend communication.

### Day 4: Data Layer (DynamoDB)
- [ ] Create `terraform/modules/database`.
- [ ] Provision DynamoDB tables for:
    - `IssuedCredentials` (if stateful tracking is needed, else skip).
    - `Nonces` (replay protection).

### Day 5: Remote State & Environment Setup
- [ ] Configure S3 backend for Terraform state storage (locking via DynamoDB).
- [ ] Define `dev` and `stage` workspace configurations.

**Deliverable:** Complete Terraform configuration files capable of bringing up the full backend stack.

---

## Week 4: Deployment, Integration & Polish

**Focus:** Go Live, Integration Testing and Final Security Review.

### Day 1-2: Deployment Pipeline
- [ ] Deploy infrastructure to AWS (Dev environment) using Terraform.
- [ ] Build & deploy Rust Lambda binaries.
- [ ] Verify endpoints are reachable and functional on AWS.

### Day 3: End-to-End Integration Testing
- [ ] Run full integration scripts against the deployed AWS endpoints.
- [ ] Monitor logs (CloudWatch) for errors and performance bottlenecks.

### Day 4: Security Hardening
- [ ] Review IAM policies.
- [ ] Ensure API Gateway has throttling/usage plans enabled.
- [ ] Rotate any temporary keys/secrets.

### Day 5: Final Handover & Wrap-up
- [ ] Clean up `fear-release` branch code.
- [ ] Merge upstream changes or prepare PR for `main`.
- [ ] Write `DEPLOYMENT.md` guide for maintaining the infra.

**Deliverable:** Fully deployed and verified backend on AWS Key Infrastructure.
