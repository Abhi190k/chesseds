import { NextResponse } from 'next/server';
import { Chess } from 'chess.js';

// Use Google's Gemini 2.0 Flash model for chess position recognition
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Check file size and type for basic validation
    if (image.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json(
        { error: 'Image too large. Please upload an image smaller than 5MB.' },
        { status: 400 }
      );
    }

    const imageType = image.type;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload a JPEG or PNG image.' },
        { status: 400 }
      );
    }

    // Convert the uploaded file to a base64 string
    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // If Gemini API key is available, use it for position recognition
    if (GEMINI_API_KEY) {
      try {
        // Prepare the request payload for Gemini Vision API
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: "You are a chess position recognition expert. Look at this chess board image and provide the FEN (Forsyth-Edwards Notation) string that represents the position. Only return the FEN string and nothing else. If you can't determine the position clearly, say 'INVALID'. Make sure to include all FEN components: piece placement, active color, castling availability, en passant target square, halfmove clock, and fullmove number."
                },
                {
                  inline_data: {
                    mime_type: imageType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.95,
            maxOutputTokens: 100,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        };

        // Call the Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error('Gemini API error:', await response.text());
          throw new Error('Failed to analyze image with Gemini API');
        }

        const result = await response.json();
        
        // Extract the text response from Gemini
        let fenString = '';
        if (result.candidates && result.candidates.length > 0) {
          const textResponse = result.candidates[0].content.parts[0].text.trim();
          
          // Try to extract a FEN string from the response
          // FEN strings contain slashes and numbers, and often start with letters or numbers
          const fenRegex = /\b[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+(\s+[wb]\s+(?:[KQkq]{1,4}|-)\s+(?:[a-h][36]|-)\s+\d+\s+\d+)?\b/;
          const match = textResponse.match(fenRegex);
          
          if (match) {
            fenString = match[0];
          } else if (!textResponse.includes('INVALID')) {
            // If no FEN regex match but response isn't INVALID, 
            // take the first line as it might be a FEN without the additional parts
            fenString = textResponse.split('\n')[0];
            
            // Make sure it has 8 parts (ranks)
            const parts = fenString.split('/');
            if (parts.length === 8) {
              // Add the missing parts for a complete FEN if needed
              if (!fenString.includes(' ')) {
                fenString = fenString + ' w KQkq - 0 1';
              }
            }
          }
          
          // Validate the FEN string
          if (fenString && fenString !== 'INVALID') {
            try {
              // If validation passes, we have a valid FEN
              const game = new Chess(fenString);
              return NextResponse.json({ 
                fen: game.fen(),
                success: true
              });
            } catch (fenError) {
              console.error('Invalid FEN from Gemini API:', fenError);
              // Continue to fallback method
            }
          }
        }
      } catch (apiError) {
        console.error('Error with Gemini Vision API:', apiError);
        // Continue to fallback method
      }
    }

    // Fallback: Return a temporary error suggesting manual setup
    return NextResponse.json(
      { 
        error: 'Position recognition is currently unavailable. Please try setting up the position manually.',
        fallback: true,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Default position
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing chess position:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while processing your image. Please try again with a clearer image or use manual setup.',
        fallback: true,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Default position
      },
      { status: 500 }
    );
  }
}