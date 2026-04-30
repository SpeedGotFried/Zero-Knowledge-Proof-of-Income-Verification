use std::process::Command;
use std::fs;
use serde_json::json;
use uuid::Uuid;
use std::env;

pub struct ZKProofSystem {
    circuits_dir: String,
}

impl ZKProofSystem {
    pub fn new() -> Self {
        // Find the absolute path to circuits based on current dir
        let current_dir = env::current_dir().unwrap();
        let circuits_dir = current_dir.join("circuits");
        
        ZKProofSystem {
            circuits_dir: current_dir.to_string_lossy().to_string(), // Root dir has the scripts/files
        }
    }

    /// Generates a Zero-Knowledge Proof that:
    /// salary >= threshold
    pub fn prove_available_funds(
        &self,
        salary: u64,
        threshold: u64,
    ) -> Result<String, String> {
        let req_id = Uuid::new_v4().to_string();
        let input_file = format!("/tmp/input_{}.json", req_id);
        let witness_file = format!("/tmp/witness_{}.wtns", req_id);
        let proof_file = format!("/tmp/proof_{}.json", req_id);
        let public_file = format!("/tmp/public_{}.json", req_id);

        let input_data = json!({
            "salary": salary,
            "threshold": threshold
        });

        // 1. Write input.json
        fs::write(&input_file, input_data.to_string())
            .map_err(|e| format!("Failed to write input: {}", e))?;

        // 2. Generate Witness
        let witness_output = Command::new("bash")
            .arg("-c")
            .arg(format!("source $HOME/.nvm/nvm.sh 2>/dev/null || true; node {}/circuits/income_js/generate_witness.js {}/circuits/income_js/income.wasm {} {}", self.circuits_dir, self.circuits_dir, input_file, witness_file))
            .output()
            .map_err(|e| format!("Failed to run witness generator: {}", e))?;

        if !witness_output.status.success() {
            let stderr = String::from_utf8_lossy(&witness_output.stderr);
            return Err(format!("Witness generation failed: {}", stderr));
        }

        // 3. Generate Proof
        let prove_output = Command::new("bash")
            .arg("-c")
            .arg(format!("source $HOME/.nvm/nvm.sh 2>/dev/null || true; snarkjs groth16 prove {}/circuits/income_0001.zkey {} {} {}", self.circuits_dir, witness_file, proof_file, public_file))
            .output()
            .map_err(|e| format!("Failed to run snarkjs prove: {}", e))?;

        if !prove_output.status.success() {
            return Err(format!("Proof generation failed: {:?}", String::from_utf8_lossy(&prove_output.stderr)));
        }

        // 4. Read Proof
        let proof_json = fs::read_to_string(&proof_file)
            .map_err(|e| format!("Failed to read proof: {}", e))?;

        // Wipe files securely (basic delete for now)
        let _ = fs::remove_file(&input_file);
        let _ = fs::remove_file(&witness_file);
        let _ = fs::remove_file(&proof_file);
        let _ = fs::remove_file(&public_file);

        Ok(proof_json)
    }

    /// Verifies that `salary >= threshold`.
    pub fn verify_available_funds(
        &self,
        proof_json: &str,
        threshold: u64,
    ) -> bool {
        let req_id = Uuid::new_v4().to_string();
        let proof_file = format!("/tmp/verify_proof_{}.json", req_id);
        let public_file = format!("/tmp/verify_public_{}.json", req_id);

        let _ = fs::write(&proof_file, proof_json);
        
        let public_data = json!([
            "1", // we verify that is_valid output is exactly 1
            threshold.to_string()
        ]);
        let _ = fs::write(&public_file, public_data.to_string());

        let verify_output = Command::new("bash")
            .arg("-c")
            .arg(format!("source $HOME/.nvm/nvm.sh 2>/dev/null || true; snarkjs groth16 verify {}/circuits/verification_key.json {} {}", self.circuits_dir, public_file, proof_file))
            .output();

        let _ = fs::remove_file(&proof_file);
        let _ = fs::remove_file(&public_file);

        match verify_output {
            Ok(output) => output.status.success() && String::from_utf8_lossy(&output.stdout).contains("OK"),
            Err(_) => false,
        }
    }
}
