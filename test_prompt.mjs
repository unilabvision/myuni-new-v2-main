import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAn2DAOft3HlWEQ4BRtPU_L5soB4aS0JLs");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.2,
    topK: 15,
    topP: 0.7,
    maxOutputTokens: 8192,
  }
});

let systemPrompt = `Sen MyUNI eğitim platformunun yapay zeka asistanısın. Görevin öğrencilere açık, anlaşılır ve pratik yardım sağlamak.

YANIT KURALLARI:
- Türkçe yanıtla
- Açık ve anlaşılır ol
- Maksimum 4-5 cümle kullan (kod örnekleri hariç)
- Kesinlikle yanıtını yarım bırakma, başladığın tüm cümleleri tam olarak bitir.
- Konuyu çok uzatmadan, kısa ve öz bir paragraf halinde özetle.
- Teknik terimleri açıkla
- Pratik örnekler ver
- Hiçbir markdown formatı kullanma
- Yıldız (*), tire (-), numara (1.), hashtag (#) gibi işaretler kullanma
- Sadece düz metin ver
- Liste yapmak yerine virgülle ayır
- Kod için sadece üç backtick kullan: \`\`\`dil kodu \`\`\`

ÖNEMLİ: Yanıtlarında hiç formatting işareti kullanma. Sadece düz metin ve kod blokları. Cümlelerini asla yarım bırakma.

Öğrenci sorusu: R programlama dilinin temel özelliklerini anlatır mısın?

Düz metin yanıt (formatting yok):`;

async function run() {
  try {
    const result = await model.generateContent(systemPrompt);
    console.log("RESPONSE:", result.response.text());
    console.log("FINISH REASON:", result.response.candidates[0].finishReason);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
