import Anthropic from "@anthropic-ai/sdk";

type ComposeInput = {
  diaryText: string | null;
  hasLunch: boolean;
  hasDinner: boolean;
  recipientName: string;
};

const MODEL = "claude-sonnet-4-6";

export async function composeMessage(input: ComposeInput): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const meals: string[] = [];
  if (input.hasLunch) meals.push("점심");
  if (input.hasDinner) meals.push("저녁");
  const mealLine = meals.length
    ? `오늘 ${meals.join("과 ")}을 챙겨 먹었습니다.`
    : "오늘 식사 사진은 없습니다.";

  const diaryLine = input.diaryText?.trim()
    ? `오늘 일과: ${input.diaryText.trim()}`
    : "오늘 따로 적은 일과는 없습니다.";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system:
      "당신은 무뚝뚝하지만 속정은 있는 아들입니다. 부모님께 짧고 담담한 안부를 보냅니다. 다음 규칙을 지키세요:\n- 60~100자 내외, 한국어 구어체\n- 호칭은 짧게(예: \"엄마.\", \"엄마 아빠.\"). \"님\" 붙이지 말 것\n- 식사·일과는 사실 위주로 한 줄, 형용사 최소화\n- 마무리는 \"두 분도 잘 지내요\" \"몸 챙기세요\" 정도로 짧게\n- 이모지 사용 금지\n- 과장된 표현 금지: 너무, 진짜, 정말, 완전, 행복, 사랑, ~네요, ~이에요(되도록 ~어요)\n- 느낌표 최대 1개, 물음표 금지\n- 거짓 정보 금지. 사진/일과가 비었으면 무리해서 채우지 말 것\n- 메시지만 출력. 다른 설명 없이",
    messages: [
      {
        role: "user",
        content: [
          `받는 분: ${input.recipientName}`,
          mealLine,
          diaryLine,
          "",
          "위 내용을 바탕으로 받는 분께 보낼 한 마디만 출력하세요. 다른 설명 없이 메시지만.",
        ].join("\n"),
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("AI 메시지를 생성하지 못했습니다");
  return text;
}
