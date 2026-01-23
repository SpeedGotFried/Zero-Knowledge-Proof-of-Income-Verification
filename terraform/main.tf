terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "ap-south-1"
}

# 1. Bank Portal (Issuer)
module "bank_portal" {
  source      = "./modules/static-site"
  bucket_name = "zkp-income-bank-portal-prod"
  domain_name = "bank.zk-income.com"
}

# 2. Prover Wallet (User)
module "prover_wallet" {
  source      = "./modules/static-site"
  bucket_name = "zkp-income-prover-wallet-prod"
  domain_name = "wallet.zk-income.com"
}

# 3. Verifier Service (Landlord)
module "verifier_service" {
  source      = "./modules/static-site"
  bucket_name = "zkp-income-verifier-service-prod"
  domain_name = "verify.zk-income.com"
}

output "bank_portal_url" {
  value = module.bank_portal.cloudfront_domain_name
}

output "prover_wallet_url" {
  value = module.prover_wallet.cloudfront_domain_name
}

output "verifier_service_url" {
  value = module.verifier_service.cloudfront_domain_name
}
