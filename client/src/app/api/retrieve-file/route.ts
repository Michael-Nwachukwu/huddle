// app/api/retrieve-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, FileContentsQuery } from "@hashgraph/sdk";

export async function GET(request: NextRequest) {
  try {
    // Get fileId from URL params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    console.log("Starting file retrieval for:", fileId);

    // Validate environment variables
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
      console.error("Missing environment variables:", { 
        hasOperatorId: !!operatorId, 
        hasOperatorKey: !!operatorKey 
      });
      return NextResponse.json({ 
        error: "Missing OPERATOR_ID or OPERATOR_KEY in environment variables" 
      }, { status: 500 });
    }

    // Initialize Hedera client
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
      // Create the query
      const query = new FileContentsQuery().setFileId(fileId);

      // Execute the query
      const contents = await query.execute(client);
      
      console.log("File contents retrieved successfully");
      
      // Convert Uint8Array to string for JSON response
      const contentsString = Buffer.from(contents).toString('utf8');

      return NextResponse.json({ 
        success: true,
        fileId,
        contents: contentsString,
        size: contents.length
      });

    } catch (queryError: any) {
      console.error(`Error retrieving file ${fileId}:`, queryError.message);
      return NextResponse.json({ 
        error: 'Failed to retrieve file', 
        details: queryError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Retrieve file API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    console.log("Starting file retrieval for:", fileId);

    // Validate environment variables
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
      return NextResponse.json({ 
        error: "Missing OPERATOR_ID or OPERATOR_KEY in environment variables" 
      }, { status: 500 });
    }

    // Initialize Hedera client
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
      // Create the query
      const query = new FileContentsQuery().setFileId(fileId);

      // Execute the query
      const contents = await query.execute(client);
      
      console.log("File contents retrieved successfully");
      
      // Convert Uint8Array to string for JSON response
      const contentsString = Buffer.from(contents).toString('utf8');

      return NextResponse.json({ 
        success: true,
        fileId,
        contents: contentsString,
        size: contents.length
      });

    } catch (queryError: any) {
      console.error(`Error retrieving file ${fileId}:`, queryError.message);
      return NextResponse.json({ 
        error: 'Failed to retrieve file', 
        details: queryError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Retrieve file API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}