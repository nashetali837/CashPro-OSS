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
   npm run build
   npm start
   ```

## License

Apache-2.0
