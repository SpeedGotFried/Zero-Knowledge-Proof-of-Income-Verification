use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::ristretto::RistrettoPoint;
use crate::modules::issuer::Signature;

pub struct Prover {
    pub name: String,
    pub credential: Option<(RistrettoPoint, Scalar, Signature)>, // (C, r, Sig)
}

impl Prover {
    pub fn new(name: &str) -> Self {
        Prover {
            name: name.to_string(),
            credential: None,
        }
    }

    pub fn receive_credential(&mut self, commitment: RistrettoPoint, randomness: Scalar, signature: Signature) {
        self.credential = Some((commitment, randomness, signature));
    }

    pub fn present_commitment(&self) -> Option<(RistrettoPoint, Signature)> {
        if let Some((c, _, sig)) = &self.credential {
            Some((*c, sig.clone()))
        } else {
            None
        }
    }
}
