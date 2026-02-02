output "prover_website_url" {
  value = "http://${aws_s3_bucket_website_configuration.prover_wallet_config.website_endpoint}"
}

output "bank_portal_url" {
  value = "http://${aws_s3_bucket_website_configuration.bank_portal_config.website_endpoint}"
}

output "verifier_service_url" {
  value = "http://${aws_s3_bucket_website_configuration.verifier_service_config.website_endpoint}"
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}
