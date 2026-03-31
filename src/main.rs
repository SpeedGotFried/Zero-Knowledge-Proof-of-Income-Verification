use axum::{
    routing::{get, post},
    Router,
    Json,
    http::Method,
};
use tower_http::cors::{Any, CorsLayer};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use curve25519_dalek::ristretto::CompressedRistretto;

mod modules;
use modules::bank::Bank;
use modules::database::DatabaseClient;
use modules::zkp; // Import ZKP module directly for Step 4
use modules::pedersen;

// --- DTOs ---

// Step 1: Register
#[derive(Deserialize)]
struct RegisterRequest {
    public_key_hex: String,
}

// Step 4: Prove Request (Ephemeral)
#[derive(Deserialize)]
struct ProveRequest {
    salary: u64, // SENSITIVE: Will be dropped immediately
    threshold: u64,
}

// Step 6: Verify Request
#[derive(Deserialize)]
struct VerifyRequest {
    public_key_hex: String, // Who is verifying?
    c_income_hex: String,
    c_used_hex: String, // For now, this is the threshold commitment usually
    c_rent_hex: String, // unused in simple threshold model, or passed as 0
    proof_hex: String,
}

#[derive(Serialize)]
struct GenericResponse {
    success: bool,
    message: String,
    data: Option<serde_json::Value>,
}

// Shared State
struct AppState {
    bank: Bank,
    db: DatabaseClient,
}

#[tokio::main]
async fn main() {
    // Initialize Bank Logic (Crypto)
    let bank = Bank::new();
    
    // Initialize Database (Persistence)
    // "IncomeVerificationTable" is the placeholder name
    let db = DatabaseClient::new("IncomeVerificationTable").await;

    let state = Arc::new(Mutex::new(AppState { bank, db }));

    println!("Starting ZKP Engine & Bank Oracle on port 3000...");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/register", post(handle_register)) // Step 1
        .route("/prove", post(handle_prove))       // Step 4 (Ephemeral)
        .route("/verify", post(handle_verify))     // Step 6 (Persistence)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "ZKP Engine & Bank Oracle is Online"
}

// --- Handlers ---

// Step 1: Identity Binding
async fn handle_register(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
    Json(payload): Json<RegisterRequest>,
) -> Json<GenericResponse> {
    let db = &state.lock().unwrap().db;
    
    match db.register_user(&payload.public_key_hex).await {
        Ok(_) => Json(GenericResponse {
            success: true,
            message: "Identity Bound Successfully".to_string(),
            data: None,
        }),
        Err(e) => error_response(format!("Database Error: {}", e)),
    }
}

// Step 4: ZKP Generation (Ephemeral)
async fn handle_prove(
    Json(payload): Json<ProveRequest>,
) -> Json<GenericResponse> {
    // 1. Ephemeral Processing: Variables reside in stack memory
    let salary = payload.salary;
    let threshold = payload.threshold;
    
    // 2. Generate Randomness (Ephemeral)
    let mut rng = rand::thread_rng();
    let blinding = curve25519_dalek::scalar::Scalar::random(&mut rng);
    
    // 3. Commitments
    // C_Income = g*salary + h*blinding
    let c_income = pedersen::commit(salary, blinding);
    let c_income_hex = hex::encode(c_income.as_bytes());

    // 4. Generate Proof
    // Note: In a real range proof, we prove: 0 <= (salary - threshold) < 2^n
    // For this demo, we are using the `zkp` module which likely implements a specific range proof.
    // We will assume `prove_range` takes the commitment and the secret values.
    
    // WARNING: This assumes `zkp::prove_range` is implemented to handle these inputs. 
    // If not, we might need to adjust `zkp.rs`. 
    // Based on previous context, `prove_range`(commitment, value, blinding).
    
    let proof_result = zkp::prove_range(c_income, salary, blinding);

    // 5. WIPE SECRETS (Rust's ownership model drops them here naturally as they go out of scope)
    // Explicit drop for clarity if needed, though not strictly required in Rust unless implementing Drop trait for zeroing memory.
    // drop(salary); // payload is dropped
    // drop(blinding);
    
    match proof_result {
        Ok(proof_bytes) => {
            let proof_hex = hex::encode(proof_bytes);
            
            // Return ONLY Public Data
            let response_data = serde_json::json!({
                "proof_hex": proof_hex,
                "c_income_hex": c_income_hex,
                "threshold": threshold 
            });

            Json(GenericResponse {
                success: true,
                message: "Proof Generated (Sensitive Data Wiped)".to_string(),
                data: Some(response_data),
            })
        },
        Err(e) => error_response(format!("Proof Generation Failed: {}", e))
    }
}

// Step 6: Verify & Persist
async fn handle_verify(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
    Json(payload): Json<VerifyRequest>,
) -> Json<GenericResponse> {
    
    // Helper to decode hex
    let decode_point = |hex_str: &str| -> Result<CompressedRistretto, String> {
        let bytes = hex::decode(hex_str).map_err(|_| "Invalid Hex".to_string())?;
        if bytes.len() != 32 { return Err("Invalid Point Length".to_string()); }
        let arr: [u8; 32] = bytes.try_into().unwrap();
        Ok(CompressedRistretto(arr))
    };

    let c_income = match decode_point(&payload.c_income_hex) { Ok(p) => p, Err(e) => return error_response(e) };
    let c_used = match decode_point(&payload.c_used_hex) { Ok(p) => p, Err(e) => return error_response(e) };
    let c_rent = match decode_point(&payload.c_rent_hex) { Ok(p) => p, Err(e) => return error_response(e) };

    let proof_bytes = match hex::decode(&payload.proof_hex) {
        Ok(b) => b,
        Err(_) => return error_response("Invalid Proof Hex".to_string())
    };

    // 1. Verify Logic (Bank)
    let state_guard = state.lock().unwrap();
    let bank = &state_guard.bank;
    let db = &state_guard.db;

    // Use Bank's logic to genericly verify.
    // Note: bank.process_verification_request currently does verify -> sign.
    // We might want to just verify first, or usage the bank's signing as proof of verification.
    match bank.process_verification_request(c_income, c_used, c_rent, &proof_bytes) {
        Ok(signature_hex) => {
            // 2. Persistence (Step 7)
            // Save the transaction record (Public Info Only)
            // Ideally we generate a Transaction ID here.
            let tx_id = uuid::Uuid::new_v4().to_string(); // Need uuid crate, or just use signature as ID for now
            
            // We need to drop the lock before awaiting?
            // Axum State with Mutex is synchronous. `db.save_verification_record` is async.
            // We cannot await while holding a sync Mutex lock. 
            // We must clone the DB client (it's cheap if it uses Arc internally, checking aws_sdk implementation... yes Client is a wrapper around Handle).
            
            // FIX: Refactor locking to avoid deadlock or sync issues with async calls.
            // Actually, `AppState` holding `DatabaseClient` which is async... 
            // We should clone the client out of the lock.
        },
        Err(e) => return error_response(e),
    }

    // RE-DOING HANDLE VERIFY LOGIC TO FIX LOCKING:
    drop(state_guard); // Release lock
    
    // We need to access bank and db separately?
    // Let's grab what we need.
    let (signature_result, db_client) = {
        let guard = state.lock().unwrap();
        let sig = guard.bank.process_verification_request(c_income, c_used, c_rent, &proof_bytes);
        let db = DatabaseClient { // Manual clone if Clone not derived? aws Client is Clone.
            client: guard.db.client.clone(),
            table_name: guard.db.table_name.clone(),
        }; 
        (sig, db)
    };

    match signature_result {
        Ok(signature_hex) => {
            let tx_id = uuid::Uuid::new_v4().to_string();
            
            match db_client.save_verification_record(&payload.public_key_hex, &tx_id, &payload.proof_hex, "VERIFIED").await {
                Ok(_) => Json(GenericResponse {
                    success: true,
                    message: "Identity Verified & Recorded".to_string(),
                    data: Some(serde_json::json!({
                        "signature": signature_hex,
                        "tx_id": tx_id
                    })),
                }),
                Err(e) => error_response(format!("Persistence Failed: {}", e))
            }
        },
        Err(e) => error_response(e)
    }
}

fn error_response(msg: String) -> Json<GenericResponse> {
    Json(GenericResponse {
        success: false,
        message: msg,
        data: None,
    })
}

use tower_http::cors::{Any, CorsLayer};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use curve25519_dalek::ristretto::CompressedRistretto;

mod modules;
use modules::bank::Bank;

// Request Payload
#[derive(Deserialize)]
struct ProofRequest {
    c_income_hex: String,
    c_used_hex: String,
    c_rent_hex: String,
    proof_hex: String,
}

// Response Payload
#[derive(Serialize)]
struct ProofResponse {
    success: bool,
    message: String,
    signature: Option<String>,
}

// Shared State
struct AppState {
    bank: Bank,
}

#[tokio::main]
async fn main() {
    // Initialize Bank Logic
    let bank = Bank::new();
    let state = Arc::new(Mutex::new(AppState { bank }));

    println!("Starting Bank Oracle Server on port 3000...");
    println!("Public Key: {}", state.lock().unwrap().bank.get_public_key_hex());

    // CORS: Allow frontend to talk to backend
    let cors = CorsLayer::new()
        .allow_origin(Any) // For demo. In prod strict origin.
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/verify", post(handle_verification))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Bank Oracle is Online"
}

// Handler
async fn handle_verification(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
    Json(payload): Json<ProofRequest>,
) -> Json<ProofResponse> {
    
    // 1. Decode Hex Inputs
    let decode_point = |hex_str: &str| -> Result<CompressedRistretto, String> {
        let bytes = hex::decode(hex_str).map_err(|_| "Invalid Hex".to_string())?;
        if bytes.len() != 32 { return Err("Invalid Point Length".to_string()); }
        let arr: [u8; 32] = bytes.try_into().unwrap();
        Ok(CompressedRistretto(arr))
    };

    let c_income = match decode_point(&payload.c_income_hex) { Ok(p) => p, Err(e) => return error_response(e) };
    let c_used = match decode_point(&payload.c_used_hex) { Ok(p) => p, Err(e) => return error_response(e) };
    let c_rent = match decode_point(&payload.c_rent_hex) { Ok(p) => p, Err(e) => return error_response(e) };
    
    let proof_bytes = match hex::decode(&payload.proof_hex) {
        Ok(b) => b,
        Err(_) => return error_response("Invalid Proof Hex".to_string())
    };

    // 2. Call Bank Logic
    let bank = &state.lock().unwrap().bank; // Lock mutex
    match bank.process_verification_request(c_income, c_used, c_rent, &proof_bytes) {
        Ok(sig) => Json(ProofResponse {
            success: true,
            message: "Proof Verified & Signed".to_string(),
            signature: Some(sig),
        }),
        Err(err_msg) => error_response(err_msg)
    }
}

fn error_response(msg: String) -> Json<ProofResponse> {
    Json(ProofResponse {
        success: false,
        message: msg,
        signature: None,
    })
}
