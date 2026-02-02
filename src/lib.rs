use wasm_bindgen::prelude::*;
use curve25519_dalek::scalar::Scalar;
use rand::rngs::OsRng;
use crate::modules::zkp::ZKProofSystem;
use crate::modules::pedersen::PedersenCommitment;

// Expose internal modules so lib.rs can use them
pub mod modules;

#[wasm_bindgen]
pub fn generate_commitment(value: u64) -> Result<JsValue, JsValue> {
    // Generate random blinding
    let mut rng = OsRng;
    let blinding = Scalar::random(&mut rng);
    
    let pc = PedersenCommitment::new();
    let commitment = pc.commit(value, blinding);
    
    // Return (commitment_hex, blinding_hex)
    // In a real app we'd serialize better, here keep it simple for prototype
    let c_bytes = commitment.compress().to_bytes();
    let b_bytes = blinding.to_bytes();
    
    let result = vec![
        hex::encode(c_bytes),
        hex::encode(b_bytes)
    ];
    
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

#[wasm_bindgen]
pub fn generate_proof(
    income: u64, 
    income_blinding_hex: String,
    used: u64,
    used_blinding_hex: String,
    rent: u64,
    rent_blinding_hex: String
) -> Result<String, JsValue> {
    
    // Parse blindings
    let i_b_bytes = hex::decode(income_blinding_hex).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let u_b_bytes = hex::decode(used_blinding_hex).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let r_b_bytes = hex::decode(rent_blinding_hex).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let i_bytes_arr: [u8; 32] = i_b_bytes.try_into().map_err(|_| JsValue::from_str("Invalid income blinding length (must be 32 bytes)"))?;
    let i_blinding = Scalar::from_canonical_bytes(i_bytes_arr).ok_or_else(|| JsValue::from_str("Invalid income scalar"))?;

    let u_bytes_arr: [u8; 32] = u_b_bytes.try_into().map_err(|_| JsValue::from_str("Invalid used blinding length (must be 32 bytes)"))?;
    let u_blinding = Scalar::from_canonical_bytes(u_bytes_arr).ok_or_else(|| JsValue::from_str("Invalid used scalar"))?;

    let r_bytes_arr: [u8; 32] = r_b_bytes.try_into().map_err(|_| JsValue::from_str("Invalid rent blinding length (must be 32 bytes)"))?;
    let r_blinding = Scalar::from_canonical_bytes(r_bytes_arr).ok_or_else(|| JsValue::from_str("Invalid rent scalar"))?;

    let zkp = ZKProofSystem::new();
    let (proof, _) = zkp.prove_available_funds(
        income, i_blinding,
        used, u_blinding,
        rent, r_blinding
    ).map_err(|e| JsValue::from_str(&format!("Proof error: {:?}", e)))?;

    // Serialize proof (Bulletproofs RangeProof)
    // Proof bytes make it to the Verifier
    let proof_bytes = proof.to_bytes();
    Ok(hex::encode(proof_bytes))
}
