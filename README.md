# CashPro-OSS

An open-source corporate treasury and liquidity management platform. Designed as a high-performance alternative to enterprise banking solutions.

## Features

- **Global Liquidity Dashboard**: Real-time visibility into cash positions across multiple entities and currencies.
- **Treasury Intelligence**: AI-powered analysis for forecasting, risk management, and automated payment logic using Google Gemini.
- **Technical Aesthetic**: A precise, data-dense interface inspired by mission control and professional financial instruments.
- **Full-Stack Architecture**: Built with React, Vite, and Express for robust performance and easy integration.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Recharts, Motion (Framer Motion v12).
- **Backend**: Express.js with Vite middleware.
- **AI**: Google Gemini API via `@google/genai`.
- **Icons**: Lucide React.

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cashpro-oss.git
   cd cashpro-oss
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   

#  Deployment:

🚀 Deployment Overview

This project is configured for a Multi-Cloud Hybrid Mesh architecture. It supports deployment across AWS, Azure, IBM Cloud, and Alibaba Cloud with a secure networking layer for database replication.

#   📂 Infrastructure Directory Structure

- `/.github/workflows/`: CI/CD pipelines for automated testing and deployment.
- `/infra/aws/`: Terraform files for AWS ECS Fargate and Cross-Cloud VPN.
- `/infra/azure/`: Bicep and ARM templates for Azure Container Apps.
- `/infra/kubernetes/`: K8s manifests for local or cloud-agnostic clusters.
- `/infra/network.yaml`: Global network topology and replication rules.
- `/infra/hybrid-cloud.tf`: Terraform for IBM Cloud (IKS) and Alibaba Cloud (ACK).

1.  Clone & Install:
    ```bash
    git clone https://github.com/your-org/cashpro-oss.git
    npm install
    ```
2.  Environment:
    Copy `.env.example` to `.env` and provide your `GEMINI_API_KEY`.
3.  Local Dev:
    ```bash
    npm run dev
    ```
4.  **Infrastructure Provisioning**:
    ```bash
    cd infra/aws
    terraform init
    terraform apply
    ```

- Docker: `docker build -t cashpro-oss .`
- Terraform: Located in `/infra/aws`
- K8s: Located in `/infra/kubernetes`
   npm run build
   npm start
   ```

 #  🔒 Networking & Replication

The platform uses a **Full-Mesh IPsec VPN** topology with **BGP (Border Gateway Protocol)** dynamic routing to connect disparate cloud environments. Database replication (e.g., for CockroachDB or Global Aurora) is secured via private subnets and cross-cloud security group rules. BGP ensures high availability by automatically re-routing traffic in the event of a regional interconnect failure.

#   🔒 Security & Compliance

CashPro-OSS is designed with a "Security-First" architecture. For detailed information on our security policy, vulnerability reporting, and production hardening, please refer to:

*   [**SECURITY.md**](./SECURITY.md): Security policy and vulnerability disclosure process.
*   [**SECURITY_ADVISORY.md**](./SECURITY_ADVISORY.md): Production security guide and vulnerability report for the current version.

##Expert Note: The current mesh assumes static routing for simplicity. For production-scale global deployments, we recommend enabling BGP Dynamic Routing on the VPN gateways to handle automatic failover across cloud providers.

## License

MIT
