# Instapay Receipt Parser

A Google Cloud Function that processes Instapay receipt images using Google Cloud Document AI to extract transaction details and metadata.

## Description

This service automates the extraction of transaction data from Instapay receipt images. It uses Google Cloud Document AI to perform OCR (Optical Character Recognition) on receipt images and returns structured data including transaction amounts, reference numbers, timestamps, and sender/receiver information. The service also extracts EXIF metadata from the images to provide additional context about when and how the receipt was captured.

## Background

Instapay is Egypt's national instant payment system, launched in 2019 as part of the Central Bank of Egypt's (CBE) financial inclusion strategy. It enables real-time interbank transfers between different banks and financial institutions in Egypt. The system allows users to make instant payments 24/7 using their mobile phones, with transactions being processed in real-time. Instapay has become a crucial part of Egypt's digital payment infrastructure, facilitating secure and instant money transfers between different banks and financial institutions.

## Overview

This service processes Instapay receipt images and returns structured data including transaction details, confidence scores, and metadata. It uses Google Cloud Document AI for OCR processing and includes EXIF data extraction for image metadata.

## Features

- Receipt image processing via Google Cloud Document AI
- EXIF metadata extraction
- Structured data output with confidence scores
- Master timestamp determination from multiple sources
- Master status determination from transaction status fields
- Error handling and validation

## Response Format

The service returns a JSON object with the following structure:

```json
{
  "success": true,
  "receipt": {
    "data": {
      "timestamp": "string",
      "reference": "string",
      "amount": "string",
      "currency": "string",
      "senderName": "string",
      "receiverName": "string",
      "status": "string",
      "transactionStatus": "string",
      "transactionStatusAlt": "string"
    },
    "confidence": {
      "timestamp": number,
      "reference": number,
      "amount": number,
      "currency": number,
      "senderName": number,
      "receiverName": number,
      "status": number
    },
    "hasTimestamp": boolean,
    "hasReference": boolean
  },
  "masterTimestamp": {
    "value": "string",
    "source": "string"
  },
  "masterStatus": "string",
  "metadata": {
    "DateTimeOriginal": "string",
    "CreateDate": "string",
    "ModifyDate": "string",
    "Software": "string",
    "ImageWidth": number,
    "ImageHeight": number,
    "Make": "string",
    "Model": "string"
  }
}
```

## Prerequisites

- Google Cloud Platform account
- Node.js 18 or later
- Google Cloud SDK installed
- Document AI API enabled
- Document AI processor created

## Environment Variables

The following environment variables need to be set in your Google Cloud Function:

- `PROJECT_ID`: Your Google Cloud project ID
- `LOCATION`: Document AI processor location (e.g., 'eu')
- `PROCESSOR_ID`: Your Document AI processor ID

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd instapay-parser
```

2. Install dependencies:
```bash
npm install
```

3. Deploy to Google Cloud Functions:
```bash
gcloud functions deploy processReceipt \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point processReceipt \
  --region europe-west1 \
  --source=.
```

## Usage

Send a POST request to the function endpoint with a base64-encoded image:

```bash
curl -X POST https://[region]-[project-id].cloudfunctions.net/processReceipt \
  -H "Content-Type: application/json" \
  -d '{"base64Image": "[base64-encoded-image]"}'
```

## Error Handling

The service includes comprehensive error handling for:
- Missing image data
- Invalid base64 encoding
- Document AI processing errors
- EXIF parsing errors

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

## Dependencies

- `google-auth-library`: Google Cloud authentication
- `exif-parser`: EXIF metadata extraction

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

The Apache License 2.0 is a permissive license that allows for:
- Commercial use
- Modification
- Distribution
- Patent use
- Private use

While providing:
- License and copyright notice
- State changes
- Patent protection
- Trademark use
- Liability limitation
- Warranty disclaimer

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Google Cloud Document AI team
- Instapay for providing the receipt format 