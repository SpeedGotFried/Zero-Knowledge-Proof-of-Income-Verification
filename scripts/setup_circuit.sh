#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "Compiling circuit..."
export PATH=$PATH:$HOME/.local/bin
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd circuits
circom income.circom --r1cs --wasm

echo "Running Phase 1 (Powers of Tau)..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="some random text"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Running Phase 2 (Groth16 Setup)..."
snarkjs groth16 setup income.r1cs pot12_final.ptau income_0000.zkey
snarkjs zkey contribute income_0000.zkey income_0001.zkey --name="Second contribution" -v -e="some more random text"
snarkjs zkey export verificationkey income_0001.zkey verification_key.json

echo "Generating mock input to test the pipeline..."
cat <<EOF > input.json
{
    "salary": 100000,
    "threshold": 50000
}
EOF

echo "Computing witness..."
node income_js/generate_witness.js income_js/income.wasm input.json witness.wtns

echo "Generating Proof..."
snarkjs groth16 prove income_0001.zkey witness.wtns proof.json public.json

echo "Verifying Proof..."
snarkjs groth16 verify verification_key.json public.json proof.json

echo "Setup complete!"
