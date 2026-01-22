use curve25519_dalek::ristretto::RistrettoPoint;
use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::constants::RISTRETTO_BASEPOINT_POINT;
use sha2::{Sha512, Digest};
use rand::rngs::OsRng;

pub struct Issuer {
    private_key: Scalar,
    public_key: RistrettoPoint,
}

#[derive(Debug, Clone)]
pub struct Signature {
    pub s: Scalar,
    pub R: RistrettoPoint,
}

impl Issuer {
    pub fn new() -> Self {
        let mut rng = OsRng;
        let private_key = Scalar::random(&mut rng);
        let public_key = private_key * RISTRETTO_BASEPOINT_POINT;
        Self { private_key, public_key }
    }

    pub fn get_public_key(&self) -> RistrettoPoint {
        self.public_key
    }

    // Sign a RistrettoPoint (the commitment)
    pub fn sign_commitment(&self, commitment: RistrettoPoint) -> Signature {
        let mut rng = OsRng;
        let k = Scalar::random(&mut rng);
        let R = k * RISTRETTO_BASEPOINT_POINT;

        // Challenge e = H(R || P || M)
        let mut hasher = Sha512::new();
        hasher.update(R.compress().as_bytes());
        hasher.update(self.public_key.compress().as_bytes());
        hasher.update(commitment.compress().as_bytes());
        
        // Map hash to scalar safely
        let e = Scalar::from_hash(hasher);
        
        let s = k + e * self.private_key;

        Signature { s, R }
    }
}

// Verification logic can be here or in Verifier
pub fn verify_signature(
    public_key: RistrettoPoint, 
    commitment: RistrettoPoint, 
    signature: &Signature
) -> bool {
    let mut hasher = Sha512::new();
    hasher.update(signature.R.compress().as_bytes());
    hasher.update(public_key.compress().as_bytes());
    hasher.update(commitment.compress().as_bytes());
    
    let e = Scalar::from_hash(hasher);
    
    // s * G == R + e * P
    let sG = signature.s * RISTRETTO_BASEPOINT_POINT;
    let R_plus_eP = signature.R + (e * public_key);

    sG == R_plus_eP
}
