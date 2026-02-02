use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::ristretto::CompressedRistretto;
use crate::modules::zkp::ZKProofSystem;
use bulletproofs::RangeProof; 
use sha2::{Sha512, Digest};
use rand::rngs::OsRng;
use ed25519_dalek::{Signer, SigningKey, Signature};

// Simplified Bank Structure
pub struct Bank {
    signing_key: SigningKey,
    zkp_system: ZKProofSystem,
}

impl Bank {
    pub fn new() -> Self {
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);
        Bank {
            signing_key,
            zkp_system: ZKProofSystem::new(),
        }
    }

    /// Verifies the Income Proof and signs the commitment if valid.
    /// Returns (Signature, ApprovalMessage) or Error.
    /// 
    /// In a real system, `c_used` would be looked up from a database based on user ID.
    /// Here we take it as input for demonstration.
    pub fn process_verification_request(
        &self,
        c_income: CompressedRistretto,
        c_used: CompressedRistretto,
        c_rent: CompressedRistretto,
        proof_bytes: &[u8]
    ) -> Result<String, String> {
        
        // 1. Deserialization
        // Note: Bulletproofs RangeProof deserialization
        let proof = RangeProof::from_bytes(proof_bytes)
            .map_err(|_| "Invalid Proof Format".to_string())?;

        // 2. Verify ZKP
        let valid = self.zkp_system.verify_available_funds(c_income, c_used, c_rent, proof);
        
        if valid {
            // 3. Sign the approval
            // We sign the concatenation of the commitments: H(C_Income || C_Rent)
            // (Simplified schema)
            let msg = format!("APPROVED: {:?} paying {:?}", c_income, c_rent);
            let signature = self.signing_key.sign(msg.as_bytes());
            
            // Return hex signature
            Ok(hex::encode(signature.to_bytes()))
        } else {
            Err("Verification Failed: Insufficient Funds".to_string())
        }
    }
    
    pub fn get_public_key_hex(&self) -> String {
        hex::encode(self.signing_key.verifying_key().to_bytes())
    }
}
