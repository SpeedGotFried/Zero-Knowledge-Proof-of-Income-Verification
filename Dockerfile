FROM rust:1.80 as builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
# Create dummy src to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY src src
RUN cargo build --release

# Final runtime image
FROM ubuntu:22.04
WORKDIR /app

# Install Node.js, bash, and curl
RUN apt-get update && apt-get install -y curl ca-certificates bash libssl-dev && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm i -g snarkjs

COPY --from=builder /app/target/release/zero_knowledge_proof_of_income_verification /app/server
COPY circuits /app/circuits
# We don't necessarily need the whole circuits dir in production, just the compiled ones, but we'll copy it for simplicity

EXPOSE 3000
CMD ["/app/server"]
