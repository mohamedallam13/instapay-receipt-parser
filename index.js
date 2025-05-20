// Simple Document AI processor usage
require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');
const ExifParser = require('exif-parser');
const { format, fromUnixTime } = require('date-fns');

// Replace with your actual values
const PROJECT_ID = process.env.PROJECT_ID;
const LOCATION = process.env.LOCATION;
const PROCESSOR_ID = process.env.PROCESSOR_ID;

// Helper function to transform fields array into structured object
const transformFieldsToObject = (fields) => {
  const result = {
    data: {},
    confidence: {},
    hasTimestamp: false,
    hasReference: false
  };

  fields.forEach(field => {
    // Convert field name to camelCase
    const key = field.name.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    
    // Store the value
    result.data[key] = field.value;
    
    // Store the confidence score if available
    if (field.confidence) {
      result.confidence[key] = field.confidence;
    }

    // Set flags for required fields
    if (field.name === 'timestamp') {
      result.hasTimestamp = true;
    }
    if (field.name === 'reference') {
      result.hasReference = true;
    }
  });

  return result;
};

// Helper function to get the best timestamp
const getMasterTimestamp = (metadata, receiptData) => {
  const formatPattern = 'dd MMM yyyy hh:mm a'; // e.g., 30 Apr 2025 10:01 PM

  const formatUnixToHuman = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return null;
    return format(fromUnixTime(timestamp), formatPattern);
  };

  const parseHumanDate = (dateStr) => {
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? null : format(parsed, formatPattern);
  };

  if (metadata.DateTimeOriginal) {
    return {
      value: formatUnixToHuman(metadata.DateTimeOriginal),
      source: 'exif_original'
    };
  }
  if (metadata.CreateDate) {
    return {
      value: formatUnixToHuman(metadata.CreateDate),
      source: 'exif_create'
    };
  }
  if (receiptData.data.date) {
    return {
      value: parseHumanDate(receiptData.data.date),
      source: 'receipt'
    };
  }

  return null;
};


exports.processReceipt = async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).send({ error: 'Missing base64Image in request body.' });
    }

    // Initialize metadata with empty values
    let metadata = {
      DateTimeOriginal: null,
      CreateDate: null,
      ModifyDate: null,
      Software: null,
      ImageWidth: null,
      ImageHeight: null,
      Make: null,
      Model: null
    };

    // Decode base64 image to buffer for EXIF parsing
    try {
      const buffer = Buffer.from(base64Image, 'base64');
      const parser = ExifParser.create(buffer);
      const exifData = parser.parse();
      
      metadata = {
        DateTimeOriginal: exifData.tags.DateTimeOriginal,
        CreateDate: exifData.tags.CreateDate,
        ModifyDate: exifData.tags.ModifyDate,
        Software: exifData.tags.Software,
        ImageWidth: exifData.tags.ImageWidth,
        ImageHeight: exifData.tags.ImageHeight,
        Make: exifData.tags.Make,
        Model: exifData.tags.Model
      };
    } catch (exifError) {
      console.warn('Failed to parse EXIF data:', exifError.message);
    }

    // Authenticate with Google
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();

    // Document AI API call
    const url = `https://${LOCATION}-documentai.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}:process`;
    const response = await client.request({
      url,
      method: 'POST',
      data: {
        rawDocument: {
          content: base64Image,
          mimeType: 'image/jpeg',
        }
      }
    });

    // Extract entities from Document AI response
    const entities = response.data.document?.entities || [];
    
    // Map entities to our expected format
    const fields = entities.map(e => ({
      name: e.type,
      value: e.mentionText,
      confidence: e.confidence
    }));

    // Transform fields into structured object
    const receiptData = transformFieldsToObject(fields);

    // Get master timestamp
    const masterTimestamp = getMasterTimestamp(metadata, receiptData);

    // Return the processed response
    res.status(200).json({
      success: true,
      receipt: receiptData,
      masterTimestamp,
      metadata
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
};