use aws_sdk_dynamodb::{Client, Error};
use aws_config::meta::region::RegionProviderChain;
use aws_config::BehaviorVersion;

pub struct DatabaseClient {
    client: Client,
    table_name: String,
}

impl DatabaseClient {
    pub async fn new(table_name: &str) -> Self {
        let region_provider = RegionProviderChain::default_provider().or_else("ap-south-1");
        let config = aws_config::defaults(BehaviorVersion::latest())
            .region(region_provider)
            .load()
            .await;
        let client = Client::new(&config);

        DatabaseClient {
            client,
            table_name: table_name.to_string(),
        }
    }

    /// Step 1: Identity Binding
    /// Binds a User's Public Key to their Identity (Simulated) in DynamoDB.
    /// PK: "USER#<PublicKey>"
    /// SK: "METADATA"
    pub async fn register_user(&self, public_key_hex: &str) -> Result<(), Error> {
        let pk = format!("USER#{}", public_key_hex);
        let sk = "METADATA".to_string();

        self.client
            .put_item()
            .table_name(&self.table_name)
            .item("PK", aws_sdk_dynamodb::types::AttributeValue::S(pk))
            .item("SK", aws_sdk_dynamodb::types::AttributeValue::S(sk))
            .item("CreatedAt", aws_sdk_dynamodb::types::AttributeValue::S(chrono::Utc::now().to_rfc3339()))
            .send()
            .await?;

        Ok(())
    }

    /// Step 7: Persist Decision / Verification Record
    /// Stores the proof verification result without storing sensitive data.
    /// PK: "USER#<PublicKey>"
    /// SK: "TX#<Uuid>"
    pub async fn save_verification_record(
        &self, 
        public_key_hex: &str, 
        transaction_id: &str,
        proof_hex: &str,
        status: &str
    ) -> Result<(), Error> {
        let pk = format!("USER#{}", public_key_hex);
        let sk = format!("TX#{}", transaction_id);

        self.client
            .put_item()
            .table_name(&self.table_name)
            .item("PK", aws_sdk_dynamodb::types::AttributeValue::S(pk))
            .item("SK", aws_sdk_dynamodb::types::AttributeValue::S(sk))
            .item("Proof", aws_sdk_dynamodb::types::AttributeValue::S(proof_hex.to_string()))
            .item("Status", aws_sdk_dynamodb::types::AttributeValue::S(status.to_string()))
            .item("Helpers", aws_sdk_dynamodb::types::AttributeValue::S("NoSensitiveData".to_string()))
            .send()
            .await?;

        Ok(())
    }
}
