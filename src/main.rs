#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(non_snake_case)]

mod modules;

use modules::issuer::{Issuer, verify_signature};
use modules::prover::Prover;
use modules::pedersen::PedersenCommitment;
use curve25519_dalek::scalar::Scalar;
use rand::rngs::OsRng;

fn main() {
    println!("=== Privacy-Preserving Income Verification (Rust Prototype) ===");
    println!("=== Week 1-2: Commitments & Signatures ===");

    // 1. Setup
    let pc = PedersenCommitment::new();
    let issuer = Issuer::new();
    let issuer_pk = issuer.get_public_key();
    println!("[1] Issuer setup complete. Public Key generated.");

    // 2. Issuance
    let income: u64 = 75000;
    println!("[2] User requesting attestation for Income: ${}", income);
    
    let mut rng = OsRng;
    let randomness = Scalar::random(&mut rng);
    
    // Commit to income: C = v*G + r*H
    let commitment = pc.commit(income, randomness);
    println!("    Committed to income.");
    
    // Sign the commitment
    let signature = issuer.sign_commitment(commitment);
    println!("    Issuer created Schnorr signature on commitment.");

    // 3. Prover receives it
    let mut alice = Prover::new("Alice");
    alice.receive_credential(commitment, randomness, signature);
    println!("[3] Alice received credential (C, r, sig).");

    // 4. Verification (Bank) - Week 1-2 Scope: Verify Sig on C
    println!("[4] Alice presents (C, Sig) to Bank (Verifier).");
    if let Some((c_presented, sig_presented)) = alice.present_commitment() {
        // Bank checks if Sig is valid on C using Issuer PK
        let is_valid = verify_signature(issuer_pk, c_presented, &sig_presented);
        
        if is_valid {
            println!("    [SUCCESS] Bank verified the Issuer's signature on the Commitment!");
            println!("    The commitment is authentic. The value inside is hidden.");
            println!("    Upcoming (Week 3-4): Proving value inside C >= Threshold.");
        } else {
            println!("    [FAILURE] Signature invalid!");
        }
    } else {
        println!("    [ERROR] No credential.");
    }
}
