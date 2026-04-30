use crate::modules::zkp::ZKProofSystem;
use rand::rngs::OsRng;
use ed25519_dalek::{Signer, SigningKey};

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
    pub fn process_verification_request(
        &self,
        proof_json: &str,
        threshold: u64
    ) -> Result<String, String> {
        
        // 2. Verify ZKP
        let valid = self.zkp_system.verify_available_funds(proof_json, threshold);
        
        if valid {
            // 3. Sign the approval
            let msg = format!("APPROVED: threshold {}", threshold);
            let signature = self.signing_key.sign(msg.as_bytes());
            
            // Return hex signature
            Ok(hex::encode(signature.to_bytes()))
        } else {
            Err("Verification Failed: Insufficient Funds or Invalid Proof".to_string())
        }
    }
    
    pub fn get_public_key_hex(&self) -> String {
        hex::encode(self.signing_key.verifying_key().to_bytes())
    }
}
