import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { WinePairing, GeminiWineDetail, SuggestedDish } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set in environment variables. The application might not work if this is not resolved.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const WINE_MODEL = 'gemini-2.5-flash-preview-04-17';

async function parseGeminiResponse<T>(response: GenerateContentResponse, context: string): Promise<T> {
  let jsonStr = response.text?.trim() ?? "";
  
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  if (!jsonStr) {
    console.warn(`Gemini response text for ${context} is empty after trimming.`);
    // For wine pairings, an empty array is a valid "no results" response.
    // For dish suggestion, this might be an issue.
    if (context === "wine pairings") {
      return [] as unknown as T; // Allow empty array for wine pairings specifically
    }
    throw new Error(`AIからの${context}に関する応答が空です。`);
  }
  
  try {
    return JSON.parse(jsonStr) as T;
  } catch (parseError) {
    console.error(`Failed to parse JSON response for ${context}:`, jsonStr, parseError);
    throw new Error(`AIからの${context}に関する応答をJSONとして解析できませんでした。内容: ${jsonStr.substring(0,100)}`);
  }
}


export async function fetchWinePairings(dishName: string, numSuggestions: number = 5): Promise<WinePairing[]> {
  if (!API_KEY) {
    throw new Error("APIキーが設定されていません。");
  }
  
  const prompt = `
料理「${dishName}」に合うワインのペアリングを${numSuggestions}種類提案してください。
それぞれのワインについて、以下の情報を日本語で提供してください：

1.  **具体的なワイン名 (wineName)**:
    *   例: 「フランス ロワール産 サンセール (ソーヴィニヨン・ブラン)」や「イタリア トスカーナ産 キャンティ・クラシコ (サンジョヴェーゼ主体)」のように、主要産地名、アペラシオン、主要ブドウ品種名などを含む具体的な名称を挙げてください。
    *   一般的な呼称（例：「シャルドネ」）だけでなく、より特定できる情報を含めてください。
    *   **ヴィンテージ(収穫年)は記載しないでください。**

2.  **ワインタイプ (wineType)**:
    *   以下のいずれかの日本語文字列で厳密に分類してください: "赤ワイン", "白ワイン", "ロゼワイン", "スパークリングワイン", "オレンジワイン", "酒精強化ワイン", "デザートワイン"。

3.  **特徴 (characteristics)**:
    *   ワインの具体的なアロマ（香り）、フレーバープロファイル（味わい）、ボディ（軽重）、酸味のレベル、タンニンの強さ（赤ワインの場合）、甘辛度などを記述してください。
    *   説明は150字〜200字程度でお願いします。

4.  **ペアリングの説明 (pairingExplanation)**:
    *   このワインが「${dishName}」とどのようにマリアージュ（調和）するのかを具体的に説明してください。
    *   料理のどの風味や食感の要素と、ワインのどの特徴が相互に作用し、引き立て合うのかを明確に記述してください。
    *   説明は200字〜250字程度でお願いします。

応答はJSON配列として返してください。配列内の各オブジェクトは以下の厳密な構造を持つようにしてください：
{
  "wineName": "string",
  "wineType": "string",
  "characteristics": "string",
  "pairingExplanation": "string"
}

JSON配列以外の導入文、結論文、その他のテキストは一切含めないでください。
もし料理名が不適切であったり、適切なペアリングが本当に見つからない場合は、空の配列 [] を返してください。
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: WINE_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.45, 
        topP: 0.9,
        topK: 40,
      },
    });

    const parsedData = await parseGeminiResponse<GeminiWineDetail[]>(response, "wine pairings");

    if (!Array.isArray(parsedData)) {
      console.error("Parsed wine data is not an array:", parsedData);
      throw new Error("AIからのワインペアリング応答の形式が正しくありません (配列ではありません)。");
    }
    
    // Further validation for array contents
    if (parsedData.length > 0) {
      const firstItem = parsedData[0];
      if (typeof firstItem.wineName !== 'string' || 
          typeof firstItem.wineType !== 'string' ||
          typeof firstItem.characteristics !== 'string' || 
          typeof firstItem.pairingExplanation !== 'string') {
        console.error("Parsed wine data items do not have the expected structure:", parsedData);
        throw new Error("AIからのワインペアリング応答のデータ構造が正しくありません。");
      }
    }
    
    return parsedData as WinePairing[];

  } catch (error) {
    console.error("Error fetching wine pairings from Gemini:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
        throw new Error("APIキーが無効です。正しいAPIキーを設定してください。");
      }
      if (error.message.includes("quota")) {
        throw new Error("APIの利用制限に達した可能性があります。しばらくしてからもう一度お試しください。");
      }
    }
    throw error; // Re-throw other specific errors or the original error
  }
}

export async function fetchDishSuggestionAndPairingsFromIngredients(
  ingredients: string
): Promise<{ suggestedDish: SuggestedDish | null; pairings: WinePairing[] }> {
  if (!API_KEY) {
    throw new Error("APIキーが設定されていません。");
  }

  // Step 1: Get dish suggestion
  const dishSuggestionPrompt = `
以下の食材を使って、創造的で魅力的な料理名を1つ提案してください。和食または洋食の料理名でお願いします。
食材: 「${ingredients}」

応答はJSONオブジェクトとして、以下の厳密な構造で返してください：
{
  "dishName": "提案された料理名"
}

JSONオブジェクト以外の導入文、結論文、その他のテキストは一切含めないでください。
もし適切な料理名を提案できない場合は、 "dishName" の値をnullとしてください: {"dishName": null}
`;

  let suggestedDish: SuggestedDish | null = null;
  try {
    const dishResponse: GenerateContentResponse = await ai.models.generateContent({
      model: WINE_MODEL,
      contents: [{ role: "user", parts: [{ text: dishSuggestionPrompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, // Slightly more creative for dish names
        topP: 0.9,
        topK: 50,
      },
    });
    
    const parsedDishData = await parseGeminiResponse<SuggestedDish>(dishResponse, "dish suggestion");

    if (parsedDishData && typeof parsedDishData.dishName === 'string' && parsedDishData.dishName.trim() !== "") {
      suggestedDish = parsedDishData;
    } else if (parsedDishData && parsedDishData.dishName === null) {
      suggestedDish = null; // Explicitly no suggestion
    } else {
      throw new Error("AIからの料理提案の形式が正しくないか、料理名が空です。");
    }

  } catch (error) {
    console.error("Error fetching dish suggestion from Gemini:", error);
    // Don't re-throw an API key error if it was caught, let the wine pairing step handle it or App.tsx.
    if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("quota"))) {
         throw error;
    }
    // For other errors in dish suggestion, we might still want to return empty pairings,
    // or throw a more specific error. For now, let's make it return no dish & no pairings.
    return { suggestedDish: null, pairings: [] };
  }

  if (!suggestedDish || !suggestedDish.dishName) {
    // If no dish was suggested (or dishName is null/empty), return empty pairings
    return { suggestedDish: null, pairings: [] };
  }

  // Step 2: Get wine pairings for the suggested dish
  try {
    const pairings = await fetchWinePairings(suggestedDish.dishName, 5); // Fetch 5 pairings
    return { suggestedDish, pairings };
  } catch (error) {
    console.error(`Error fetching wine pairings for suggested dish "${suggestedDish.dishName}":`, error);
    // If wine pairing fails, return the suggested dish but empty pairings and let App.tsx display an error for the pairing part.
    // Or rethrow to let the main handler in App.tsx catch it.
    // For now, if pairings fail, we'll return the dish but indicate pairing failure through empty array and App.tsx error state.
     if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("quota"))) {
         throw error;
    }
    // Propagate other pairing errors
    throw new Error(`提案された料理「${suggestedDish.dishName}」のワインペアリング取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}
