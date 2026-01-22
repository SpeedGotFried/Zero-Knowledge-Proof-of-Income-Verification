use curve25519_dalek::ristretto::{RistrettoPoint, CompressedRistretto};
use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::constants::RISTRETTO_BASEPOINT_POINT;
use curve25519_dalek::traits::MultiscalarMul;
use sha2::Sha512;

pub struct PedersenCommitment {
    pub g: RistrettoPoint,
    pub h: RistrettoPoint,
}

impl PedersenCommitment {
    pub fn new() -> Self {
        // G = standard basepoint
        let g = RISTRETTO_BASEPOINT_POINT;
        
        // H = hash(G) to ensure no DL relation known
        // RistrettoPoint::hash_from_bytes takes &[u8]
        let h = RistrettoPoint::hash_from_bytes::<Sha512>(g.compress().as_bytes());

        PedersenCommitment { g, h }
    }

    pub fn commit(&self, value: u64, blinding: Scalar) -> RistrettoPoint {
        // C = v*G + r*H
        // Using straus multiscalar mul for efficiency usually, but simple add here is fine
        // self.g * Scalar::from(value) + self.h * blinding
        RistrettoPoint::multiscalar_mul(
            &[Scalar::from(value), blinding],
            &[self.g, self.h]
        )
    }
}
