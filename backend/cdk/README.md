# AWS CDK Deployment - Smart Mailbox Backend

This CDK project deploys the Smart Mailbox Backend API as an AWS Lambda behind API Gateway.

## Prerequisites

- AWS CLI configured with proper credentials
- Node.js & Python 3.11
- AWS CDK v2 installed (`npm install -g aws-cdk`)

## Setup

1. Navigate to the CDK directory:

   ```bash
   cd backend/cdk
   ```

2. Create and activate virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## CDK Commands

- `cdk synth` # synthesizes CloudFormation template
- `cdk deploy` # deploys stack
- `cdk diff` # diff against deployed stack
- `cdk destroy` # removes stack

## Project Structure

```
backend/cdk
├── app.py                # CDK application entrypoint
├── cdk.json              # CDK configuration
├── requirements.txt      # Python dependencies
└── stacks/
    └── mailbox_api_stack.py  # Defines Lambda & API Gateway stack
```

## Deployment

```bash
cdk bootstrap   # once per AWS environment
cdk deploy
```

## Cleanup

To remove all deployed resources:

```bash
cdk destroy
```

## License

MIT License
