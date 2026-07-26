# XCAPADE- AML Suspicious Activity Detection Agent

An AI-assisted Anti-Money Laundering (AML) suspicious activity detection backend built with FastAPI. This project provides a stable API contract and mock-first workflow for developing and integrating AML risk analysis features, before plugging in production-grade detection models and data pipelines.

---

## Problem Statement

Financial institutions must identify potentially suspicious transactions and customer behavior patterns to reduce money laundering risk and support regulatory reporting. Building AML systems is challenging because teams need:

- Reliable backend APIs for rapid frontend and product development
- Consistent response schemas for cross-team integration
- Explainable risk outputs for analysts and compliance workflows
- A path from mock logic to production ML/rule-based detection engines

This project addresses that gap by providing a structured FastAPI backend for AML suspicious activity detection with clear endpoints and extensible architecture.

---

## Project Goals

- Provide a working AML analysis API surface for application integration
- Return predictable, contract-stable response payloads
- Accelerate UI and workflow development through mock outputs
- Create a foundation to integrate real AML models and rules

---

## Dataset Information

> Current status: **Stub backend with mock analysis responses**.

At this stage, no training/inference dataset is bundled into the runtime service. The API is designed to accept customer/transaction-level inputs and return structured risk assessments.

### Planned dataset structure (for production integration)

When replacing stubs with real detection logic, the backend is expected to consume data such as:

- **Customer profile data**
  - Customer ID, account age, KYC risk tier, geography, occupation/business type
- **Transaction data**
  - Transaction ID, amount, timestamp, type/channel, origin/destination entities
- **Behavioral/temporal aggregates**
  - Rolling count/sum statistics, unusual frequency spikes, velocity patterns
- **Watchlist/sanctions/PEP indicators**
  - Matches against external compliance lists

### Suggested schema fields

- `customer_id`
- `transaction_id`
- `amount`
- `currency`
- `timestamp`
- `country`
- `counterparty_id`
- `channel`
- `is_cross_border`
- `kyc_risk_level`

---

## Data Sources Used

### Currently used

- **Mock/static response data** embedded in backend stub logic for endpoint behavior and frontend contract testing.

### Intended future sources (to be integrated)

- Internal core banking / transaction ledger data
- KYC and customer risk profile systems
- Sanctions / PEP / adverse media screening feeds
- Case management and historical SAR outcomes

> If you use external/public datasets for experimentation, document exact source name, license, and version in this section.

---

## Solution Approach

The solution follows a staged architecture:

1. **API-first stub phase (current)**
   - Implement stable AML endpoints in FastAPI
   - Serve deterministic mock responses matching `API_CONTRACT.md`

2. **Feature engineering phase**
   - Add preprocessing and feature pipelines for customer + transaction signals

3. **Detection phase**
   - Integrate hybrid suspicious activity scoring (rules + ML/anomaly detection)

4. **Explainability and reporting phase**
   - Return risk score, reason codes, and supporting evidence snippets

5. **Operationalization phase**
   - Monitoring, retraining, drift checks, and audit-ready logs

### Detection design (recommended)

- **Rule-based heuristics** for known typologies (threshold breaches, structuring, rapid movement)
- **Anomaly detection** for unusual behavior shifts
- **Supervised models** (if labeled outcomes exist) for risk classification
- **Composite risk scoring** combining rule and model confidence

---

## Tech Stack

- **Backend framework:** FastAPI
- **ASGI server:** Uvicorn
- **Language:** Python 3
- **API docs:** Swagger UI / OpenAPI
- **Development style:** Contract-first mock backend

---

## Repository Structure

Typical core files:

- `main.py` — FastAPI app and endpoint definitions
- `requirements.txt` — Python dependencies
- `API_CONTRACT.md` — canonical request/response contracts
- `README.md` — project documentation

---

## Current API Endpoints

- `POST /analyze` — Analyze transaction/customer risk signals
- `POST /chat` — Conversational AML assistant endpoint (stub)
- `GET /customer/{customer_id}` — Customer profile/risk lookup
- `GET /report/{entity_id}` — Entity-level report view
- `GET /` — Service status/root endpoint

---

## Setup

### 1) Clone the repository

```bash
git clone https://github.com/meghna-biju/AML-Suspicious-Activity-Detection-Agent.git
cd AML-Suspicious-Activity-Detection-Agent
```

### 2) Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3) Install dependencies

```bash
pip install -r requirements.txt
```

### 4) Run the development server

```bash
uvicorn main:app --reload --port 8000
```

---

## Usage

After server startup:

- API base URL: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`
- ReDoc (if enabled): `http://127.0.0.1:8000/redoc`

### Quick test examples

#### Root endpoint

```bash
curl http://127.0.0.1:8000/
```

#### Analyze endpoint

```bash
curl -X POST "http://127.0.0.1:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST_001",
    "transaction_id": "TXN_1001",
    "amount": 9500,
    "country": "US"
  }'
```

> Request/response fields should follow `API_CONTRACT.md` exactly for frontend compatibility.

---

## API Contract and Compatibility

The API response formats are defined in **`API_CONTRACT.md`** and should remain stable. This ensures frontend and backend teams can work independently without breaking integration.

---

## Limitations (Current Version)

- No real AML model or rule engine attached yet
- No live database integration in stub mode
- Outputs are mock responses, not compliance decisions

---

## Roadmap

- [ ] Add real transaction ingestion pipeline
- [ ] Implement rule-based typology checks
- [ ] Integrate anomaly detection model
- [ ] Add explainable reason codes and confidence scores
- [ ] Persist alerts and analyst feedback loop
- [ ] Add authentication/authorization and audit logging
- [ ] Containerize deployment and CI/CD checks

---

## Compliance & Disclaimer

This project is for development and prototyping purposes. It is **not** a production AML compliance system in its current form and should not be used as the sole basis for regulatory reporting or legal decisions.

---

## Contributing

Contributions are welcome. For substantial updates, please:

1. Open an issue describing the enhancement
2. Align request/response schema changes with `API_CONTRACT.md`
3. Submit a pull request with clear test evidence

---

## License

Add your preferred license (e.g., MIT, Apache-2.0) in a `LICENSE` file and reference it here.
