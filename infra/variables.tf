variable "aws_region" {
  description = "AWS Region to deploy to"
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project Name"
  default     = "zkp-income-verify"
}

variable "deployment_stage" {
  description = "Deployment Stage (dev/prod)"
  default     = "dev"
}
