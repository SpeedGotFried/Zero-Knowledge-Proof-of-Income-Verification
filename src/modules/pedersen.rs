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

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::OsRng;

    #[test]
    fn test_homomorphic_property() {
        let pc = PedersenCommitment::new();
        let mut rng = OsRng;

        let v1 = 100u64;
        let r1 = Scalar::random(&mut rng);
        let c1 = pc.commit(v1, r1);

        let v2 = 200u64;
        let r2 = Scalar::random(&mut rng);
        let c2 = pc.commit(v2, r2);

        let v_sum = v1 + v2;
        let r_sum = r1 + r2;
        let c_sum = pc.commit(v_sum, r_sum);

        assert_eq!(c1 + c2, c_sum, "Homomorphic property failed: C(v1)+C(v2) != C(v1+v2)");
    }
}
