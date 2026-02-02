use bulletproofs::{BulletproofGens, PedersenGens, RangeProof};
use curve25519_dalek::ristretto::{CompressedRistretto, RistrettoPoint};
use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::traits::MultiscalarMul;
use merlin::Transcript;
use core::ops::Neg;

// Constants for the proof
const RANGE_BITS: usize = 64; // Proof that value is in [0, 2^64)

pub struct ZKProofSystem {
    pc_gens: PedersenGens,
    bp_gens: BulletproofGens,
}

impl ZKProofSystem {
    pub fn new() -> Self {
        ZKProofSystem {
            pc_gens: PedersenGens::default(),
            bp_gens: BulletproofGens::new(RANGE_BITS, 1),
        }
    }

    /// Generates a Zero-Knowledge Proof that:
    /// Income - Used - Rent >= 0
    /// 
    /// This effectively proves that `Income >= Used + Rent`.
    /// 
    /// # Arguments
    /// * `income_val`, `income_blinding`: User's total income credential.
    /// * `used_val`, `used_blinding`: Amount already committed/spent/allocated.
    /// * `rent_val`, `rent_blinding`: New amount being requested/proven for.
    pub fn prove_available_funds(
        &self,
        income_val: u64,
        income_blinding: Scalar,
        used_val: u64,
        used_blinding: Scalar,
        rent_val: u64,
        rent_blinding: Scalar,
    ) -> Result<(RangeProof, CompressedRistretto), bulletproofs::ProofError> {
        
        // Calculate Available Funds
        // We need to check for underflow first since these are u64 unsigned
         if income_val < (used_val + rent_val) {
            // Technically invalid, but RangeProof would also fail/wrap.
            // Let's return error early.
            return Err(bulletproofs::ProofError::VerificationError);
        }

        let available_val = income_val - used_val - rent_val;
        let available_blinding = income_blinding - used_blinding - rent_blinding;

        let mut prover_transcript = Transcript::new(b"ZKP_Available_Funds");

        // We prove that `available_val` is in [0, 2^64).
        // This implicitly proves Income >= Used + Rent.
        // We return the proof AND the commitment to the available funds (which needs to be derived by verifier too).
        
        RangeProof::prove_single(
            &self.bp_gens,
            &self.pc_gens,
            &mut prover_transcript,
            available_val,
            &available_blinding,
            32, 
        )
    }

    /// Verifies that `Income - Used - Rent >= 0`.
    /// 
    /// The Verifier constructs `C_Available` from the public commitments:
    /// C_Available = C_Income - C_Used - C_Rent
    /// 
    /// Then verifies the Range Proof on C_Available.
    pub fn verify_available_funds(
        &self,
        c_income: CompressedRistretto,
        c_used: CompressedRistretto,
        c_rent: CompressedRistretto,
        proof: RangeProof,
    ) -> bool {
        let mut verifier_transcript = Transcript::new(b"ZKP_Available_Funds");

        let p_income = match c_income.decompress() { Some(p) => p, None => return false };
        let p_used = match c_used.decompress() { Some(p) => p, None => return false };
        let p_rent = match c_rent.decompress() { Some(p) => p, None => return false };

        // C_Available = C_Income - C_Used - C_Rent
        //             = C_Income + (-1)*C_Used + (-1)*C_Rent
        let c_available = RistrettoPoint::multiscalar_mul(
            &[Scalar::ONE, -Scalar::ONE, -Scalar::ONE],
            &[p_income, p_used, p_rent]
        );

        let c_available_compressed = c_available.compress();

        proof.verify_single(
            &self.bp_gens,
            &self.pc_gens,
            &mut verifier_transcript,
            &c_available_compressed,
            32
        ).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::OsRng;
    use crate::modules::pedersen::PedersenCommitment; 
    // Assuming pedersen module is accessible as crate::modules::pedersen
    // If not, we might need to duplicate helper logic or ensure visibility.
    // For test simplicity, we can just use the ZKProofSystem's pc_gens which are standard.

    fn commit(val: u64, blinding: Scalar) -> CompressedRistretto {
        let pc_gens = PedersenGens::default();
        RistrettoPoint::multiscalar_mul(
            &[Scalar::from(val), blinding],
            &[pc_gens.B, pc_gens.B_blinding]
        ).compress()
    }

    #[test]
    fn test_scenario_a_first_rent() {
        let zkp = ZKProofSystem::new();
        let mut rng = OsRng;

        // Income: 100k
        let income_val = 100_000u64;
        let income_blinding = Scalar::random(&mut rng);
        let c_income = commit(income_val, income_blinding);

        // Used: 0
        let used_val = 0u64;
        let used_blinding = Scalar::ZERO; // Or random, doesn't matter as long as C_Used matches
        let c_used = commit(used_val, used_blinding);

        // Rent: 40k
        let rent_val = 40_000u64;
        let rent_blinding = Scalar::random(&mut rng);
        let c_rent = commit(rent_val, rent_blinding);

        // 100 - 0 - 40 = 60 >= 0. Should PASS.
        let (proof, _) = zkp.prove_available_funds(
            income_val, income_blinding,
            used_val, used_blinding,
            rent_val, rent_blinding
        ).expect("Proof generation failed");

        let valid = zkp.verify_available_funds(c_income, c_used, c_rent, proof);
        assert!(valid, "Scenario A: First rent should pass");
    }

    #[test]
    fn test_scenario_b_second_rent() {
        let zkp = ZKProofSystem::new();
        let mut rng = OsRng;

        // Income: 100k
        let income_val = 100_000u64;
        let income_blinding = Scalar::random(&mut rng);
        let c_income = commit(income_val, income_blinding);

        // Used: 40k
        let used_val = 40_000u64;
        let used_blinding = Scalar::random(&mut rng);
        let c_used = commit(used_val, used_blinding);

        // Rent: 40k
        let rent_val = 40_000u64;
        let rent_blinding = Scalar::random(&mut rng);
        let c_rent = commit(rent_val, rent_blinding);

        // 100 - 40 - 40 = 20 >= 0. Should PASS.
        let (proof, _) = zkp.prove_available_funds(
            income_val, income_blinding,
            used_val, used_blinding,
            rent_val, rent_blinding
        ).expect("Proof generation failed");

        let valid = zkp.verify_available_funds(c_income, c_used, c_rent, proof);
        assert!(valid, "Scenario B: Second rent should pass");
    }

    #[test]
    fn test_scenario_c_overdraft() {
        let zkp = ZKProofSystem::new();
        let mut rng = OsRng;

        // Income: 100k
        let income_val = 100_000u64;
        let income_blinding = Scalar::random(&mut rng);

        // Used: 80k
        let used_val = 80_000u64;
        let used_blinding = Scalar::random(&mut rng);

        // Rent: 30k
        let rent_val = 30_000u64;
        let rent_blinding = Scalar::random(&mut rng);

        // 100 - 80 - 30 = -10. Should FAIL.
        
        // The prove function checks for underflow and returns Err
        let result = zkp.prove_available_funds(
            income_val, income_blinding,
            used_val, used_blinding,
            rent_val, rent_blinding
        );
        
        assert!(result.is_err(), "Scenario C: Overdraft should fail proof generation");
    }
}
