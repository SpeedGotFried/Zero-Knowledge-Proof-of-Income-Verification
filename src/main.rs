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
