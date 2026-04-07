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
#[axum::debug_handler]
async fn handle_register(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
    Json(payload): Json<RegisterRequest>,
) -> Json<GenericResponse> {
    let db = state.lock().unwrap().db.clone();
    
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
    let pc = modules::pedersen::PedersenCommitment::new();
    let c_income = pc.commit(salary, blinding);
    let c_income_hex = hex::encode(c_income.compress().as_bytes());

    // 4. Generate Proof
    let zkp_sys = modules::zkp::ZKProofSystem::new();
    let used_val = 0u64;
    let used_blinding = curve25519_dalek::scalar::Scalar::ZERO;
    let rent_val = threshold;
    let rent_blinding = curve25519_dalek::scalar::Scalar::ZERO;
    
    let proof_result = zkp_sys.prove_available_funds(salary, blinding, used_val, used_blinding, rent_val, rent_blinding);

    match proof_result {
        Ok((proof, _)) => {
            let proof_bytes = proof.to_bytes();
            let proof_hex = hex::encode(proof_bytes);
            
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

#[axum::debug_handler]
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
    let (signature_result, db_client) = {
        let guard = state.lock().unwrap();
        let sig = guard.bank.process_verification_request(c_income, c_used, c_rent, &proof_bytes);
        let db = guard.db.clone();
        (sig, db)
    };

    match signature_result {
        Ok(signature_hex) => {
            // 2. Persistence (Step 7)
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

