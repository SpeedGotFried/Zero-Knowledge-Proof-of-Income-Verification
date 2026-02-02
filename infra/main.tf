provider "aws" {
  region = var.aws_region
}

# ==============================================================================
# S3 Buckets for Frontends (Static Site Hosting)
# ==============================================================================

# 1. Prover Wallet Bucket
resource "aws_s3_bucket" "prover_wallet" {
  bucket = "${var.project_name}-prover-wallet-${var.deployment_stage}"
}

resource "aws_s3_bucket_website_configuration" "prover_wallet_config" {
  bucket = aws_s3_bucket.prover_wallet.id
  index_document { suffix = "index.html" }
}

resource "aws_s3_bucket_policy" "prover_wallet_policy" {
  bucket = aws_s3_bucket.prover_wallet.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.prover_wallet.arn}/*"
      },
    ]
  })
}

# 2. Bank Portal Bucket
resource "aws_s3_bucket" "bank_portal" {
  bucket = "${var.project_name}-bank-portal-${var.deployment_stage}"
}

resource "aws_s3_bucket_website_configuration" "bank_portal_config" {
  bucket = aws_s3_bucket.bank_portal.id
  index_document { suffix = "index.html" }
}

resource "aws_s3_bucket_policy" "bank_portal_policy" {
  bucket = aws_s3_bucket.bank_portal.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.bank_portal.arn}/*"
      },
    ]
  })
}

# 3. Verifier Service Bucket
resource "aws_s3_bucket" "verifier_service" {
  bucket = "${var.project_name}-verifier-service-${var.deployment_stage}"
}

resource "aws_s3_bucket_website_configuration" "verifier_service_config" {
  bucket = aws_s3_bucket.verifier_service.id
  index_document { suffix = "index.html" }
}

resource "aws_s3_bucket_policy" "verifier_service_policy" {
  bucket = aws_s3_bucket.verifier_service.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.verifier_service.arn}/*"
      },
    ]
  })
}

# ==============================================================================
# Backend: API Gateway + Mock Lambda (Placeholder)
# ==============================================================================

# ZIP file for Lambda (Needs to be built by `cargo lambda build` in real life)
# Here we use a dummy archive to satisfy Terraform validation
data "archive_file" "dummy_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"
  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'Hello from ZKP Bank' });"
    filename = "index.js"
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_lambda_function" "bank_api" {
  function_name = "${var.project_name}-api-${var.deployment_stage}"
  handler       = "index.handler" # In Rust this would be "bootstrap"
  runtime       = "nodejs18.x"    # Changing to Node for placeholder; Rust uses "provided.al2"
  role          = aws_iam_role.lambda_exec.arn
  filename      = data.archive_file.dummy_lambda.output_path
}

# API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-gateway"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.bank_api.invoke_arn
}

resource "aws_apigatewayv2_route" "verify_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /verify"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bank_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
