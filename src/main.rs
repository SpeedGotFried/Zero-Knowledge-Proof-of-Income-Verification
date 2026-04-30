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
    proof_json: String,
    threshold: u64,
}

#[derive(Serialize)]
struct GenericResponse {
    success: bool,
    message: String,
    data: Option<serde_json::Value>,
}

#[derive(Deserialize, Serialize)]
struct PolicyPayload {
    threshold: u64,
}

#[derive(Serialize, Clone)]
struct PendingProof {
    id: String,
    proof_json: String,
    threshold: u64,
}

// Shared State
struct AppState {
    bank: Bank,
    db: DatabaseClient,
    current_policy: u64,
    pending_proofs: Vec<PendingProof>,
}

#[tokio::main]
async fn main() {
    // Initialize Bank Logic (Crypto)
    let bank = Bank::new();
    
    // Initialize Database (Persistence)
    // "IncomeVerificationTable" is the placeholder name
    let db = DatabaseClient::new("IncomeVerificationTable").await;

    let state = Arc::new(Mutex::new(AppState { 
        bank, 
        db,
        current_policy: 50000,
        pending_proofs: Vec::new(),
    }));

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
        .route("/policy", get(get_policy))
        .route("/policy", post(set_policy))
        .route("/submit_proof", post(submit_proof))
        .route("/pending_proofs", get(get_pending_proofs))
        .route("/clear_proofs", post(clear_proofs))
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
    
    // 2. Generate Proof
    let zkp_sys = modules::zkp::ZKProofSystem::new();
    
    let proof_result = zkp_sys.prove_available_funds(salary, threshold);

    match proof_result {
        Ok(proof_json) => {
            let response_data = serde_json::json!({
                "proof_json": proof_json,
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
    
    // 1. Verify Logic (Bank)
    let (signature_result, db_client) = {
        let guard = state.lock().unwrap();
        let sig = guard.bank.process_verification_request(&payload.proof_json, payload.threshold);
        let db = guard.db.clone();
        (sig, db)
    };

    match signature_result {
        Ok(signature_hex) => {
            // 2. Persistence (Step 7)
            let tx_id = uuid::Uuid::new_v4().to_string();
            
            // Just saving a hash or substring of the proof for the DB record
            let proof_hash = format!("{:x}", md5::compute(&payload.proof_json));

            match db_client.save_verification_record(&payload.public_key_hex, &tx_id, &proof_hash, "VERIFIED").await {
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

// --- New Endpoints for Portal Sync ---

async fn get_policy(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
) -> Json<GenericResponse> {
    let policy = state.lock().unwrap().current_policy;
    Json(GenericResponse {
        success: true,
        message: "Policy fetched".to_string(),
        data: Some(serde_json::json!({ "threshold": policy })),
    })
}

async fn set_policy(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
    Json(payload): Json<PolicyPayload>,
) -> Json<GenericResponse> {
    state.lock().unwrap().current_policy = payload.threshold;
    Json(GenericResponse {
        success: true,
        message: "Policy updated".to_string(),
        data: None,
    })
}

async fn submit_proof(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
    Json(payload): Json<VerifyRequest>, // We can reuse VerifyRequest since it has proof_json and threshold
) -> Json<GenericResponse> {
    let new_proof = PendingProof {
        id: uuid::Uuid::new_v4().to_string(),
        proof_json: payload.proof_json,
        threshold: payload.threshold,
    };
    
    state.lock().unwrap().pending_proofs.push(new_proof);
    
    Json(GenericResponse {
        success: true,
        message: "Proof submitted to Bank".to_string(),
        data: None,
    })
}

async fn get_pending_proofs(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
) -> Json<GenericResponse> {
    let proofs = state.lock().unwrap().pending_proofs.clone();
    Json(GenericResponse {
        success: true,
        message: "Fetched pending proofs".to_string(),
        data: Some(serde_json::json!(proofs)),
    })
}

async fn clear_proofs(
    axum::extract::State(state): axum::extract::State<Arc<Mutex<AppState>>>,
) -> Json<GenericResponse> {
    state.lock().unwrap().pending_proofs.clear();
    Json(GenericResponse {
        success: true,
        message: "Cleared proofs".to_string(),
        data: None,
    })
}
