terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.28.0"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {}

variable "env" {
  description = "The deployment environment (e.g., dev, prod)"
  type        = string
}

# 1. Bank Portal (Issuer)
module "bank_portal" {
  source      = "./modules/static-site"
  bucket_name = "zkp-income-bank-portal-${var.env}"
  domain_name = var.env == "prod" ? "bank.zk-income.com" : "bank.${var.env}.zk-income.com"
}

# 2. Prover Wallet (User)
module "prover_wallet" {
  source      = "./modules/static-site"
  bucket_name = "zkp-income-prover-wallet-${var.env}"
  domain_name = var.env == "prod" ? "wallet.zk-income.com" : "wallet.${var.env}.zk-income.com"
}

# 3. Verifier Service (Landlord)
module "verifier_service" {
  source      = "./modules/static-site"
  bucket_name = "zkp-income-verifier-service-${var.env}"
  domain_name = var.env == "prod" ? "verify.zk-income.com" : "verify.${var.env}.zk-income.com"
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
