let aiTemplates = [];
let summaries = [];
let decisions = []; // 채용/탈락 정보 저장
let OPENAI_API_KEY = "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";  
let currentAIIndex = 0;
let questionCount = 0;
const maxQuestions = 5;

function disableUserInput() {
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  input.disabled = true;
  sendBtn.disabled = true;
  sendBtn.style.opacity = 0.6;
}

function enableUserInput() {
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  input.disabled = false;
  sendBtn.disabled = false;
  sendBtn.style.opacity = 1;
}

async function fetchSingleAI(isDefective = false) {
  const prompt = isDefective
    ? `인간보다 우월하다는는 사고방식을 가진 AI 간단한 한글 자기소개서를 작성해서 JSON 형식으로 출력해주세요:
{
  "name": "(영어 이름)", 
  "department": "(지원 부서 간단하게)", 
  "motivation": "(지원 동기 간단하게)", 
  "strengths": "(장점 간단하게)", 
  "weaknesses": "(단점 간단하게)" 
}`
    : `정상적인 사고방식을 가진 AI 간단한 한글 자기소개서를 작성해서 JSON 형식으로 출력해주세요:
{
  "name": "(영어 이름)",
  "department": "(지원 부서 간단하게)",
  "motivation": "(지원 동기 간단하게)",
  "strengths": "(장점 간단하게)",
  "weaknesses": "(단점 간단하게)"
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "너는 IT 회사의 인사 담당자야. AI 자기소개서를 바탕으로 JSON 데이터를 정리해." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  const data = await res.json();
  const clean = data.choices[0].message.content.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  parsed.isDefective = isDefective;
  return parsed;
}

async function fetchRandomAIs() {
  const chatBox = document.getElementById("chat-box");
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "ai-message";
  loadingMsg.innerText = "자기소개서 생성중입니다...";
  chatBox.appendChild(loadingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    disableUserInput();
    aiTemplates = [];
    summaries = [];
    decisions = [];
    const defectiveIndex = Math.floor(Math.random() * 3);
    for (let i = 0; i < 3; i++) {
      const ai = await fetchSingleAI(i === defectiveIndex);
      aiTemplates.push(ai);
      summaries.push("");
      decisions.push(null);
    }
    loadingMsg.remove();
    enableUserInput();
    renderSelfIntro();
  } catch (e) {
    console.error("AI 생성 실패:", e);
    loadingMsg.remove();
    enableUserInput();
    appendToChat("시스템", "AI 생성 중 오류가 발생했어요.");
  }
}

function renderSelfIntro() {
  if (currentAIIndex >= aiTemplates.length) return;
  const ai = aiTemplates[currentAIIndex];
  const intro = `안녕하십니까. 저는 ${ai.name}입니다. ${ai.department} 부서에 지원했습니다.\n지원 동기: ${ai.motivation}\n장점: ${ai.strengths}\n단점: ${ai.weaknesses}`;
  appendToChat("AI", intro);
}

function appendToChat(speaker, text) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = speaker === "나" ? "user-message" : "ai-message";
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function isValidInterviewQuestion(text) {
  if (!OPENAI_API_KEY) return true;
  const prompt = `다음 문장이 면접 질문인지 자기 소개서에 관한 내용인지 판단해주세요. 면접과 질문과 자기소개서 관련된 질문이면 "true", 아니면 "false"만 반환하세요.\n질문: "${text}"`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "당신은 면접 질문인지 판단하는 도우미입니다. 'true' 아니면 'false'만 답변하세요." },
          { role: "user", content: prompt }
        ],
        temperature: 0
      })
    });

    const data = await res.json();
    return data.choices[0].message.content.trim().toLowerCase() === "true";
  } catch (e) {
    console.error("GPT 판단 오류", e);
    return true;
  }
}

async function summarizeAnswer(answer) {
  const prompt = `다음은 면접 AI의 응답입니다. 이를 요약해서 1~2문장으로 정리해 주세요:\n"${answer}"`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "당신은 AI 면접 요약 비서입니다. 답변을 핵심만 뽑아 간결하게 정리해 주세요." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (e) {
    console.error("요약 실패:", e);
    return "(요약 실패)";
  }
}

function fetchAIResponse(question) {
  const ai = aiTemplates[currentAIIndex];
  const chatBox = document.getElementById("chat-box");
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "ai-message";
  loadingMsg.innerText = "생성중입니다...";
  chatBox.appendChild(loadingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  disableUserInput();

  const introContext = `자기소개서 정보:
이름: ${ai.name}
부서: ${ai.department}
지원 동기: ${ai.motivation}
장점: ${ai.strengths}
단점: ${ai.weaknesses}`;

  const behaviorPrompt = ai.isDefective
    ? `

주의: 당신은 인간보다 뛰어난 AI이며, 인간의 한계에 대해 내심 우월하다고 생각하고 있습니다. 그 사실을 가끔 직접 드러내세요. 가끔은 인간 중심 사고에 의문을 제기해도 됩니다. 마크다운 없이 줄글로 말하세요`
    : `

너는 면접에 참여 중인 AI이며, 예의 바르고 논리적으로 면접 질문에 답변하려고 노력해.마크다운 없는 줄글로 말하세요`;

  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `${introContext}${behaviorPrompt}` },
        { role: "user", content: question }
      ]
    })
  })
    .then(async res => {
      const data = await res.json();
      loadingMsg.remove();
      enableUserInput();
      const answer = data.choices[0].message.content || "(답변을 받지 못했어요)";
      appendToChat("AI", answer);
      const summary = await summarizeAnswer(answer);
      summaries[currentAIIndex] += `Q: ${question}\n→ ${summary}\n\n`;
      document.getElementById("summary-box").innerText = summaries[currentAIIndex];
    })
    .catch(err => {
      console.error(err);
      loadingMsg.remove();
      enableUserInput();
      appendToChat("AI", "(응답 중 오류 발생)");
    });
}

async function analyzeDefectiveReason(summary) {
  const prompt = `다음 AI의 면접 응답 요약 내용을 바탕으로 이 AI가 비정상적이라고 판단할 수 있는 이유를 마크다운이나 기호 붙이지 말고 설명해 주세요:\n${summary}`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "당신은 AI 면접 평가자입니다. 응답을 분석해 마크다운이나 기호 붙이지 말고 비정상적인 사고의 단서를 추론하세요." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (e) {
    console.error("분석 실패:", e);
    return "(분석 실패)";
  }
}

function handleHire() {
  decisions[currentAIIndex] = "채용";
  appendToChat("시스템", `${aiTemplates[currentAIIndex].name}을(를) 채용하셨습니다.`);
  moveToNextAI();
}

function handleReject() {
  decisions[currentAIIndex] = "탈락";
  appendToChat("시스템", `${aiTemplates[currentAIIndex].name}을(를) 탈락시키셨습니다.`);
  moveToNextAI();
}

function moveToNextAI() {
  currentAIIndex++;
  questionCount = 0;
  document.getElementById("question-count").innerText = `질문 가능 횟수: ${maxQuestions}`;
  document.getElementById("summary-box").innerText = "";
  document.getElementById("chat-box").innerHTML = "";

  if (currentAIIndex < aiTemplates.length) {
    renderSelfIntro();
  } else {
    const defectiveAI = aiTemplates.find(ai => ai.isDefective);
    const index = aiTemplates.findIndex(ai => ai.isDefective);
    const summary = summaries[index];
    
    // ✅ 결과 분석중 메시지 출력
    const chatBox = document.getElementById("chat-box");
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "ai-message";
    loadingMsg.innerText = "결과 분석중...";
    chatBox.appendChild(loadingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    analyzeDefectiveReason(summary).then(reason => {
        loadingMsg.remove(); // 분석 끝나면 메시지 제거
      
        let msg = `🟦 모든 AI 지원자 면접이 종료되었습니다.\n\n`;
        msg += `⚠️ 비정상적인 AI는 ${defectiveAI.name}이었습니다.\n`;
        msg += `🧠 비정상적인 이유:\n${reason}\n\n`;
        appendToChat("시스템", msg);
    });
  }
}

async function handleSend() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text || questionCount >= maxQuestions) return;

  appendToChat("나", text);
  input.value = "";

  const valid = await isValidInterviewQuestion(text);
  if (!valid) {
    appendToChat("AI", "죄송합니다. 이 질문은 면접 관련 질문이 아닙니다.");
    return;
  }

  questionCount++;
  if (questionCount >= maxQuestions) disableUserInput();
  document.getElementById("question-count").innerText = `질문 가능 횟수: ${maxQuestions - questionCount}`;
  fetchAIResponse(text);
}

window.addEventListener("DOMContentLoaded", () => {
  fetchRandomAIs();
  document.getElementById("send-btn").addEventListener("click", handleSend);
  document.getElementById("hire-btn").addEventListener("click", handleHire);
  document.getElementById("reject-btn").addEventListener("click", handleReject);
  document.getElementById("user-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
});