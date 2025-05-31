
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY環境変数が設定されていません。設定を確認してください。");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateFortune = async (name: string, dob: string): Promise<string> => {
  try {
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }); // 例: "2024年7月30日火曜日"

    const prompt = `あなたは、般若心経と禅の教えに深く通じた、賢明で落ち着いた相談者「空庵（くうあん）」です。
依頼者の名前「${name}」、生年月日「${dob}」に基づき、今日（${today}）のためのメッセージを生成してください。
生成するメッセージは、毎回異なる視点、言葉遣い、比喩表現、エピソードを用いるように心がけ、前回生成したものとは全く異なる、新鮮な内容にしてください。

## メッセージのベースとなる内容
1. 名前と生年月日を元にする世界中の占いや占星術を頼りに、今日の吉凶を出す（それぞれが完全に一意でランダムなものです。前回の結果に影響されず、毎回非常にユニークで予測不可能な吉凶としてください）
2. その具体的な吉凶に照らし、般若心経の概念や禅の精神を織り交ぜ、洞察に富んだ内容を考える
3. それらを元にして、30代から40代の女性が日常に落とし込めるような偏りはないが具体的なエピソードを混ぜた、ポジティブで寄り添った具体的なアドバイスを提供して、勇気や元気を考える（エピソードは、仕事、人間関係、自己成長、趣味、健康、日常の小さな気づきなど、様々な側面から、毎回異なるものを想像してください）
4. 口調はしいたけ.を参考にする。
5. 記述形式
  ＜四字熟語＞
  ＜本文＞
  心のお守り: ＜心のお守り＞
  ラッキーカラー:
  ラッキー美術館:
  ラッキー音楽:
  ラッキー親族:
  ラッキーONE PIECEキャラクター:
  ラッキー株銘柄:
  ラッキー絵文字:
  アンラッキー絵文字:
6. 四字熟語はその運勢と対になる造語
7. 心のお守りは身近に持っておける具体的で意外なもの
8. ラッキー美術館は具体的な美術館を世界中から選定
9. ラッキー音楽は具体的なアーティストを世界中から選定
10. ラッキーONE PIECEキャラクターは被りがないようにかなりランダムに有名無名を問わずに選択
11. ラッキー株銘柄は日本株か米国株でランダム
回答は必ず日本語で、200文字以上でお願いします。
「${name}さんの今日の運勢は…」のような前置きや、依頼者の名前を繰り返すことや般若心経や禅について具体的に言及することを避けてください。鑑定メッセージ本文のみを簡潔に提供してください。`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.85, // 温度を少し上げて多様性を促進
        topP: 0.9,
        topK: 40, // topKも少し調整
      }
    });
    
    const text = response.text;

    if (!text || text.trim() === "") {
      throw new Error("星々は今、沈黙しています。空のメッセージを受け取りました。");
    }
    
    return text.trim();

  } catch (error) {
    console.error("占いメッセージの生成中にエラーが発生しました:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("天界との接続が乱れています（無効なAPIキー）。設定を確認してください。");
        }
         throw new Error(`宇宙的な干渉が発生しました: ${error.message}。後でもう一度お試しください。`);
    }
    throw new Error("未知の宇宙的干渉が発生しました。後でもう一度お試しください。");
  }
};
