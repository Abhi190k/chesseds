import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Chess } from 'chess.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const FALLBACK_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    // Prepare the prompt
    const prompt = `
      Analyze this chess position image and provide the FEN (Forsyth–Edwards Notation) string.
      Only return the FEN string, nothing else.
      If you cannot determine the position with certainty, return the standard starting position FEN: ${FALLBACK_FEN}
      
      Rules:
      1. The FEN should be a valid chess position
      2. If pieces or squares are unclear, use your best judgment
      3. If the position is completely unrecognizable, return the starting position
      4. Do not include any explanations or additional text
    `;

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: image.type,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    let fen = response.text().trim();

    // Validate FEN
    try {
      const chess = new Chess();
      chess.load(fen);
    } catch (error) {
      console.error('Invalid FEN detected, using fallback:', error);
      fen = FALLBACK_FEN;
    }

    return NextResponse.json({ fen });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Error processing image', fen: FALLBACK_FEN },
      { status: 500 }
    );
  }
}