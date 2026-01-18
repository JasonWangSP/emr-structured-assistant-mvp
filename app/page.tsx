"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type ChatSource = "text" | "voice" | "image";

type ChatMessage = {
  id: number;
  text: string;
  source: ChatSource;
};

type EvidenceBlock = {
  id: string;
  time: string;
  label: string;
  text: string;
};

type EmrField = {
  text: string;
  evidenceIds: string[];
};

type DraftFields = {
  chiefComplaint: EmrField;
  presentIllness: EmrField;
  pastHistoryNotes: EmrField;
  diagnosticAssessment: EmrField;
};

type Language = "zh" | "en";

type FontSize = "small" | "medium" | "large";

type ThemeMode = "default" | "soft" | "contrast";

const copy = {
  zh: {
    productName: "依拉 · 临床病历结构化系统",
    productSubtitle: "Clinical Documentation Structuring System",
    evidenceTitleCn: "证据时间线",
    evidenceTitleEn: "Evidence Timeline",
    evidenceSubtitle: "原始问诊记录（供医生快速回顾）",
    emrTitleCn: "结构化病历",
    emrTitleEn: "Structured EMR",
    emrSubtitle: "可编辑的临床结构化病历（含证据引用）",
    statusBanner: "病历草稿（需医生确认）",
    loadSample: "载入示例",
    clear: "清空",
    inputPlaceholder: "输入就诊过程中的任意对话内容（无需区分医生或患者）",
    addEvidence: "采集病史",
    collectVoice: "语音",
    collectImage: "照片",
    generateDraft: "生成结构化病历（草稿）",
    generating: "生成中...",
    warningEmpty: "请先采集问诊记录",
    evidenceEmpty: "尚未采集到结构化病史记录",
    chiefComplaint: "主诉",
    presentIllness: "现病史",
    pastHistory: "既往史与注意事项（草稿）",
    diagnosticAssessment: "诊断分析（草稿）",
    chiefComplaintEn: "Chief Complaint",
    presentIllnessEn: "Present Illness",
    pastHistoryEn: "Past Medical History & Clinical Notes (Draft)",
    diagnosticAssessmentEn: "Diagnostic Assessment (Draft)",
    evidenceRef: "证据引用：",
    evidenceNone: "无",
    footerCenter: "For clinical documentation assistance only",
    footerRight: "© 2025 SeeTree Health · support@seetreecloud.com",
    languageToggle: "EN",
    settings: "设置",
    fontSize: "字体大小",
    small: "小",
    medium: "中",
    large: "大",
    display: "显示风格",
    displayDefault: "标准",
    displaySoft: "柔和",
    displayHigh: "高对比",
    language: "语言",
    zh: "中文",
    en: "English",
  },
  en: {
    productName: "SeeTree · Clinical Documentation Structuring System",
    productSubtitle: "Clinical Documentation Assistant",
    evidenceTitleCn: "Evidence Timeline",
    evidenceTitleEn: "Evidence Timeline",
    evidenceSubtitle: "Raw intake notes for clinician review",
    emrTitleCn: "Structured EMR",
    emrTitleEn: "Structured EMR",
    emrSubtitle: "Editable structured EMR with evidence references",
    statusBanner: "Draft – Doctor confirmation required",
    loadSample: "Load Sample",
    clear: "Clear",
    inputPlaceholder: "Enter raw intake dialogue (no role labels required)",
    addEvidence: "Collect Evidence",
    collectVoice: "Voice",
    collectImage: "Photo",
    generateDraft: "Generate Structured EMR",
    generating: "Generating...",
    warningEmpty: "Please capture intake notes first",
    evidenceEmpty: "No structured evidence captured yet",
    chiefComplaint: "Chief Complaint",
    presentIllness: "Present Illness",
    pastHistory: "Past Medical History & Clinical Notes (Draft)",
    diagnosticAssessment: "Diagnostic Assessment (Draft)",
    chiefComplaintEn: "Chief Complaint",
    presentIllnessEn: "Present Illness",
    pastHistoryEn: "Past Medical History & Clinical Notes (Draft)",
    diagnosticAssessmentEn: "Diagnostic Assessment (Draft)",
    evidenceRef: "Evidence:",
    evidenceNone: "None",
    footerCenter: "For clinical documentation assistance only",
    footerRight: "© 2025 SeeTree Health · support@seetreecloud.com",
    languageToggle: "中",
    settings: "Settings",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    display: "Display",
    displayDefault: "Default",
    displaySoft: "Soft",
    displayHigh: "High Contrast",
    language: "Language",
    zh: "中文",
    en: "English",
  },
} as const;



const getSemanticLabel = (text: string, lang: Language) => {
  const labels = lang === "zh"
    ? { chief: "主诉相关", past: "既往史", symptoms: "症状", evidence: "证据" }
    : { chief: "Chief Complaint", past: "Past History", symptoms: "Symptoms", evidence: "Evidence" };
  if (/(主诉|不舒服|哪里不适)/.test(text)) {
    return labels.chief;
  }
  if (/(既往|病史|慢病|颈椎)/.test(text)) {
    return labels.past;
  }
  if (/(咳|痰|发热|气短|胸闷|睡)/.test(text)) {
    return labels.symptoms;
  }
  return labels.evidence;
};

const normalizeEvidence = (refs: string[]) => {
  return refs.map((ref) => ref.trim()).filter((ref) => ref.length > 0);
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationWarning, setGenerationWarning] = useState<string>("");
  const [language, setLanguage] = useState<Language>("zh");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [themeMode, setThemeMode] = useState<ThemeMode>("default");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const latestInputRef = useRef<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const evidenceScrollRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCount = useRef(0);
  const shouldAutoScroll = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastAudioTimestampRef = useRef<number>(0);
  const silenceTimerRef = useRef<number | null>(null);
  const voiceSessionIdRef = useRef(0);
  const voiceChunkIndexRef = useRef(0);
  const [draftFields, setDraftFields] = useState<DraftFields>({
    chiefComplaint: { text: "", evidenceIds: [] },
    presentIllness: { text: "", evidenceIds: [] },
    pastHistoryNotes: { text: "", evidenceIds: [] },
    diagnosticAssessment: { text: "", evidenceIds: [] },
  });

  const t = copy[language];

  const evidenceBlocks = useMemo<EvidenceBlock[]>(() => {
    return messages.map((message, index) => {
      const totalMinutes = 9 * 60 + 10 + index;
      const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      const minutes = String(totalMinutes % 60).padStart(2, "0");
      const messageText = message?.text ?? "";
      return {
        id: `E${index + 1}`,
        time: `${hours}:${minutes}`,
        label: getSemanticLabel(messageText, language),
        text: messageText,
      };
    });
  }, [messages, language]);

  const evidenceIdSet = useMemo(() => {
    return new Set(evidenceBlocks.map((block) => block.id));
  }, [evidenceBlocks]);

  useEffect(() => {
    if (messages.length <= previousMessageCount.current) {
      previousMessageCount.current = messages.length;
      return;
    }

    const container = evidenceScrollRef.current;
    if (container && shouldAutoScroll.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }

    previousMessageCount.current = messages.length;
  }, [messages]);

  const handleAutoGrow = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleAddMessage = (textOverride?: string, source: ChatSource = "text") => {
    const currentValue =
      textOverride ??
      latestInputRef.current ??
      inputRef.current?.value ??
      inputText;
    const trimmed = currentValue.trim();
    if (!trimmed) {
      return;
    }

    console.debug("evidence.submit", {
      source,
      textareaValue: inputRef.current?.value ?? "",
      body: { text: trimmed, source },
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + prev.length,
        text: trimmed,
        source,
      },
    ]);
    setInputText("");
    latestInputRef.current = "";
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setGenerationWarning("");
  };

  const stopVoiceCapture = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current !== null) {
      window.clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const startVoiceCapture = () => {
    type SpeechRecognitionCtorType = new () => SpeechRecognition;
    const SpeechRecognitionCtor =
      ((window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition) as SpeechRecognitionCtorType;

    if (!SpeechRecognitionCtor) {
      alert("???????????????? Chrome / Edge");
      return;
    }

    let sessionTranscript = "";
    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognition.lang = language === "zh" ? "zh-CN" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const e = event as any;
      lastAudioTimestampRef.current = Date.now();
      let newTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        if (result.isFinal) {
          newTranscript += result[0]?.transcript ?? "";
        }
      }

      const sessionId = voiceSessionIdRef.current;
      voiceChunkIndexRef.current += 1;
      console.debug("voice.onresult", {
        sessionId,
        chunkIndex: voiceChunkIndexRef.current,
        resultIndex: e.resultIndex,
        resultsLength: e.results.length,
        transcript: newTranscript,
        inputStateBefore: inputText,
        textareaValueBefore: inputRef.current?.value ?? "",
      });

      const trimmedTranscript = newTranscript.trim();
      if (!trimmedTranscript) {
        return;
      }

      sessionTranscript = trimmedTranscript;
      latestInputRef.current = sessionTranscript;
      setInputText(sessionTranscript);
      if (inputRef.current) {
        inputRef.current.value = sessionTranscript;
      }

      console.debug("voice.onresult.after", {
        sessionId,
        chunkIndex: voiceChunkIndexRef.current,
        transcript: sessionTranscript,
        inputStateAfter: sessionTranscript,
        textareaValueAfter: inputRef.current?.value ?? "",
      });
      handleAddMessage(sessionTranscript, "voice");
    };
    recognition.onend = () => {
      stopVoiceCapture();
    };
    recognition.onerror = () => {
      stopVoiceCapture();
    };
    recognitionRef.current = recognition;
    lastAudioTimestampRef.current = Date.now();
    voiceSessionIdRef.current = Date.now();
    voiceChunkIndexRef.current = 0;
    sessionTranscript = "";
    latestInputRef.current = "";
    setInputText("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    recognition.start();
    setIsRecording(true);

    if (silenceTimerRef.current !== null) {
      window.clearInterval(silenceTimerRef.current);
    }
    silenceTimerRef.current = window.setInterval(() => {
      const silentForMs = Date.now() - lastAudioTimestampRef.current;
      if (silentForMs >= 60_000) {
        stopVoiceCapture();
      }
    }, 1000);
  };

  const handleVoiceCapture = () => {
    if (isRecording) {
      stopVoiceCapture();
      return;
    }
    startVoiceCapture();
  };

  const handleImageCapture = (file: File) => {
    handleAddMessage(`【图片采集】${file.name}`, "image");
  };

  const handleGenerateStructuredEmr = async () => {
    setIsGenerating(true);
    setGenerationWarning("");
    try {
      const collectedText = messages
        .map((message) => message?.text)
        .filter(Boolean)
        .join("\n");

      if (!collectedText.trim()) {
        setGenerationWarning(t.warningEmpty);
        return;
      }

      const evidence = messages.map((message, index) => ({
        id: `E${index + 1}`,
        text: message?.text ?? "",
      }));


      const payload = {
        conversation: collectedText,
        history: "",
        evidence,
      };

      if (!payload.conversation) {
        setGenerationWarning(t.warningEmpty);
        return;
      }

      console.log("[EMR] generate start");

      const res = await fetch("/api/emr-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `[EMR] API failed: ${res.status} ${res.statusText} - ${errorText}`
        );
      }

      const data = await res.json();
      console.log("[EMR] generate success", data);
      setDraftFields((prev) => ({
        ...prev,
        chiefComplaint: {
          text: data?.chiefComplaint?.text ?? "",
          evidenceIds: data?.chiefComplaint?.evidenceIds ?? [],
        },
        presentIllness: {
          text: data?.presentIllness?.text ?? "",
          evidenceIds: data?.presentIllness?.evidenceIds ?? [],
        },
        pastHistoryNotes: {
          text: data?.pastHistory?.text ?? "",
          evidenceIds: data?.pastHistory?.evidenceIds ?? [],
        },
        diagnosticAssessment: {
          text: data?.diagnosticAssessment?.text ?? "",
          evidenceIds: data?.diagnosticAssessment?.evidenceIds ?? [],
        },
      }));

      console.log("[EMR] structured EMR state updated", data);
      console.log("??????????");
      return;
    } catch (err: any) {
      console.error("[EMR] generate failed");
      console.error("raw error:", err);
      console.error("error type:", typeof err);
      console.error("error message:", err?.message);
      console.error("error stack:", err?.stack);

      setGenerationWarning(err?.message || "?????????????????????????");
    } finally {
      setIsGenerating(false);
    }
  };

  const buildRawText = (items: ChatMessage[]) => {
    return items
      .map((item) => item?.text)
      .filter(Boolean)
      .join("\n");
  };

  const handleUseSample = () => {
    setMessages([
      { id: 1, text: "最近主要哪里不舒服？先说最困扰的。", source: "text" },
      { id: 2, text: "咳嗽，挺烦的。", source: "text" },
      { id: 3, text: "咳了多久？", source: "text" },
      { id: 4, text: "大概四五天吧，可能五天。", source: "text" },
      { id: 5, text: "刚开始是干咳，后来有痰。", source: "text" },
      { id: 6, text: "痰什么颜色？", source: "text" },
      { id: 7, text: "有点黄，不多，偶尔咳出来。", source: "text" },
      { id: 8, text: "发烧吗？", source: "text" },
      { id: 9, text: "前两天低热，晚上有点热，昨天没测了。", source: "text" },
      { id: 10, text: "现在还有发热感觉？", source: "text" },
      { id: 11, text: "现在好像不怎么烧了。", source: "text" },
      { id: 12, text: "胸闷、气短有没有？", source: "text" },
      { id: 13, text: "有点闷，走快了会喘一点。", source: "text" },
      { id: 14, text: "夜里会加重吗？", source: "text" },
      { id: 15, text: "晚上咳得多，躺下更明显。", source: "text" },
      { id: 16, text: "影响睡觉，老醒。", source: "text" },
      { id: 17, text: "有没有自行吃药？", source: "text" },
      { id: 18, text: "吃了止咳糖浆，还吃了感冒药。", source: "text" },
      { id: 19, text: "效果怎么样？", source: "text" },
      { id: 20, text: "说不上来，可能稍微好一点，但还是咳。", source: "text" },
      { id: 21, text: "痰量多吗？", source: "text" },
      { id: 22, text: "不多，咳几下才出来。", source: "text" },
      { id: 23, text: "有没有鼻涕、喉咙痛？", source: "text" },
      { id: 24, text: "喉咙有点干，鼻涕不多。", source: "text" },
      { id: 25, text: "最近工作怎么样？", source: "text" },
      { id: 26, text: "挺忙的，熬夜多。", source: "text" },
      { id: 27, text: "这两天又降温了。", source: "text" },
      { id: 28, text: "之前有类似情况吗？", source: "text" },
      { id: 29, text: "以前感冒会咳，但这次感觉久一点。", source: "text" },
      { id: 30, text: "既往有什么慢病？", source: "text" },
      { id: 31, text: "颈椎病有的，几年前查出来的。", source: "text" },
      { id: 32, text: "脖子经常酸，偶尔手麻。", source: "text" },
      { id: 33, text: "这个和咳嗽没什么关系吧。", source: "text" },
      { id: 34, text: "嗯，应该没关系。", source: "text" },
      { id: 35, text: "现在白天精神还好？", source: "text" },
      { id: 36, text: "白天还行，就是一咳就累。", source: "text" },
      { id: 37, text: "睡眠被影响了是吧？", source: "text" },
      { id: 38, text: "对，晚上咳得厉害点。", source: "text" },
      { id: 39, text: "好的，我大概了解了。", source: "text" },
    ]);
    setGenerationWarning("");
  };

  const handleClear = () => {
    setMessages([]);
    setInputText("");
    setGenerationWarning("");
  };

  const chiefEvidence = normalizeEvidence(draftFields.chiefComplaint.evidenceIds).filter((ref) =>
    evidenceIdSet.has(ref)
  );
  const presentEvidence = normalizeEvidence(draftFields.presentIllness.evidenceIds).filter((ref) =>
    evidenceIdSet.has(ref)
  );
  const pastEvidence = normalizeEvidence(draftFields.pastHistoryNotes.evidenceIds).filter((ref) =>
    evidenceIdSet.has(ref)
  );
  const diagnosticEvidence = normalizeEvidence(draftFields.diagnosticAssessment.evidenceIds).filter((ref) =>
    evidenceIdSet.has(ref)
  );

  return (
    <div
      className={`${styles.page} ${styles["font" + fontSize]} ${styles["theme" + themeMode]}`}
    >
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.brandLogoWrap}>
            <img className={styles.brandLogo} src="/assets/logo/logo.svg" alt="依拉" />
          </div>
          <div className={styles.brandText}>
            <h1 className={styles.title}>{t.productName}</h1>
            <p className={styles.subtitle}>{t.productSubtitle}</p>
          </div>
        </div>
        <div className={styles.topRightControls}>
          <button
            className={styles.controlButton}
            type="button"
            onClick={() => setLanguage((prev) => (prev === "zh" ? "en" : "zh"))}
          >
            {t.languageToggle}
          </button>
          <button
            className={styles.controlButton}
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
          >
            ⚙️
          </button>
          {settingsOpen ? (
            <div className={styles.settingsPopover}>
              <div className={styles.settingsSection}>
                <div className={styles.settingsTitle}>{t.fontSize}</div>
                <div className={styles.settingsOptions}>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      fontSize === "small" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setFontSize("small")}
                  >
                    {t.small}
                  </button>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      fontSize === "medium" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setFontSize("medium")}
                  >
                    {t.medium}
                  </button>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      fontSize === "large" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setFontSize("large")}
                  >
                    {t.large}
                  </button>
                </div>
              </div>
              <div className={styles.settingsSection}>
                <div className={styles.settingsTitle}>{t.display}</div>
                <div className={styles.settingsOptions}>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      themeMode === "default" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setThemeMode("default")}
                  >
                    {t.displayDefault}
                  </button>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      themeMode === "soft" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setThemeMode("soft")}
                  >
                    {t.displaySoft}
                  </button>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      themeMode === "contrast" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setThemeMode("contrast")}
                  >
                    {t.displayHigh}
                  </button>
                </div>
              </div>
              <div className={styles.settingsSection}>
                <div className={styles.settingsTitle}>{t.language}</div>
                <div className={styles.settingsOptions}>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      language === "zh" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setLanguage("zh")}
                  >
                    {t.zh}
                  </button>
                  <button
                    type="button"
                    className={`${styles.settingsOption} ${
                      language === "en" ? styles.settingsActive : ""
                    }`}
                    onClick={() => setLanguage("en")}
                  >
                    {t.en}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>
      <main className={styles.mainLayout}>
        <section className={`${styles.panel} ${styles.evidencePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitleRow}>
                <span className={styles.titleCn}>{t.evidenceTitleCn}</span>
                <span className={styles.titleEn}>{t.evidenceTitleEn}</span>
              </div>
              <div className={styles.panelSubtitle}>{t.evidenceSubtitle}</div>
            </div>
            <div className={styles.panelActions}>
              <button className={styles.secondaryButton} type="button" onClick={handleUseSample}>
                {t.loadSample}
              </button>
              <button className={styles.ghostButton} type="button" onClick={handleClear}>
                {t.clear}
              </button>
            </div>
          </div>
          <div
            className={`${styles.panelBody} ${styles.evidenceScroll}`}
            ref={evidenceScrollRef}
            onScroll={(event) => {
              const target = event.currentTarget;
              shouldAutoScroll.current =
                target.scrollTop + target.clientHeight >= target.scrollHeight - 8;
            }}
          >
            <div className={styles.evidenceList}>
              {evidenceBlocks.length === 0 ? (
                <div className={styles.emptyState}>{t.evidenceEmpty}</div>
              ) : (
                evidenceBlocks.map((item) => (
                  <div key={item.id} className={styles.evidenceItem}>
                    <div className={styles.evidenceMeta}>
                      <span className={styles.evidenceTime}>{item.time}</span>
                      <span className={styles.evidenceLabel}>{item.label}</span>
                      <span className={styles.evidenceId}>{item.id}</span>
                    </div>
                    <div className={styles.evidenceText}>{item.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={styles.evidenceFooter}>
            <div className={styles.composer}>
              <textarea
                className={styles.textInput}
                placeholder={t.inputPlaceholder}
                value={inputText}
                onChange={(event) => {
                  latestInputRef.current = event.target.value;
                  setInputText(event.target.value);
                }}
                onInput={handleAutoGrow}
                ref={inputRef}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    handleAddMessage();
                  }
                }}
              />
              <div className={styles.actionRow}>
                <div className={styles.actionGroup}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => handleAddMessage()}
                  >
                    {t.addEvidence}
                  </button>
                  <button
                    className={`${styles.secondaryActionButton} ${
                      isRecording ? styles.voiceRecording : ""
                    }`}
                    type="button"
                    onClick={handleVoiceCapture}
                  >
                    {isRecording
                      ? language === "zh"
                        ? "🎤 录音中"
                        : "🎤 Recording"
                      : `🎤 ${t.collectVoice}`}
                  </button>
                  <button
                    className={styles.secondaryActionButton}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t.collectImage}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleImageCapture(file);
                        event.target.value = "";
                      }
                    }}
                  />
                </div>
                <div className={styles.actionGroup}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={handleGenerateStructuredEmr}
                    disabled={isGenerating || messages.length === 0}
                  >
                    {isGenerating ? "病历生成中…" : "生成结构化病历（草稿）"}
                  </button>
                </div>
              </div>
              {generationWarning ? (
                <div className={styles.helperText}>{generationWarning}</div>
              ) : null}
            </div>
          </div>
        </section>
        <section className={`${styles.panel} ${styles.emrPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitleRow}>
                <span className={styles.titleCn}>{t.emrTitleCn}</span>
                <span className={styles.titleEn}>{t.emrTitleEn}</span>
              </div>
              <div className={styles.panelSubtitle}>{t.emrSubtitle}</div>
            </div>
            <div className={styles.statusBanner}>{t.statusBanner}</div>
          </div>
          <div className={styles.panelBody}>
            {isGenerating ? (
              <div className="mb-3 text-sm text-blue-600">
                🩺 系统正在根据当前就诊证据生成结构化病历草稿，请稍候…
              </div>
            ) : null}
            <div className={styles.emrSectionDense}>
              <div className={styles.sectionHeading}>
                <span>{t.chiefComplaint}</span>
                <span className={styles.sectionSubtitle}>{t.chiefComplaintEn}</span>
              </div>
              <textarea
                className={`${styles.emrTextarea} ${styles.emrTextareaCompact}`}
                value={draftFields.chiefComplaint.text}
                onChange={(event) =>
                  setDraftFields((prev) => ({
                    ...prev,
                    chiefComplaint: {
                      ...prev.chiefComplaint,
                      text: event.target.value,
                    },
                  }))
                }
                onInput={handleAutoGrow}
              />
              <div className={styles.emrEvidenceRef}>
                {t.evidenceRef} {chiefEvidence.length > 0 ? chiefEvidence.join(", ") : t.evidenceNone}
              </div>
            </div>
            <div className={styles.emrSectionDense}>
              <div className={styles.sectionHeading}>
                <span>{t.presentIllness}</span>
                <span className={styles.sectionSubtitle}>{t.presentIllnessEn}</span>
              </div>
              <textarea
                className={`${styles.emrTextarea} ${styles.emrTextareaPresent}`}
                value={draftFields.presentIllness.text}
                onChange={(event) =>
                  setDraftFields((prev) => ({
                    ...prev,
                    presentIllness: {
                      ...prev.presentIllness,
                      text: event.target.value,
                    },
                  }))
                }
                onInput={handleAutoGrow}
              />
              <div className={styles.emrEvidenceRef}>
                {t.evidenceRef} {presentEvidence.length > 0 ? presentEvidence.join(", ") : t.evidenceNone}
              </div>
            </div>
            <div className={styles.emrSectionDense}>
              <div className={styles.sectionHeading}>
                <span>{t.pastHistory}</span>
                <span className={styles.sectionSubtitle}>{t.pastHistoryEn}</span>
              </div>
              <textarea
                className={`${styles.emrTextarea} ${styles.emrTextareaNotes}`}
                value={draftFields.pastHistoryNotes.text}
                onChange={(event) =>
                  setDraftFields((prev) => ({
                    ...prev,
                    pastHistoryNotes: {
                      ...prev.pastHistoryNotes,
                      text: event.target.value,
                    },
                  }))
                }
                onInput={handleAutoGrow}
              />
              <div className={styles.emrEvidenceRef}>
                {t.evidenceRef} {pastEvidence.length > 0 ? pastEvidence.join(", ") : t.evidenceNone}
              </div>
            </div>
            <div className={styles.emrSectionDense}>
              <div className={styles.sectionHeading}>
                <span>{t.diagnosticAssessment}</span>
                <span className={styles.sectionSubtitle}>{t.diagnosticAssessmentEn}</span>
              </div>
              <textarea
                className={`${styles.emrTextarea} ${styles.emrTextareaDiagnostic}`}
                value={draftFields.diagnosticAssessment.text}
                onChange={(event) =>
                  setDraftFields((prev) => ({
                    ...prev,
                    diagnosticAssessment: {
                      ...prev.diagnosticAssessment,
                      text: event.target.value,
                    },
                  }))
                }
                onInput={handleAutoGrow}
              />
              <div className={styles.emrEvidenceRef}>
                {t.evidenceRef} {diagnosticEvidence.length > 0 ? diagnosticEvidence.join(", ") : t.evidenceNone}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.systemFooter}>
        <div className={styles.footerLeft}>
          {t.productName}
          <span className={styles.footerSub}>{t.productSubtitle}</span>
        </div>
        <div className={styles.footerCenter}>{t.footerCenter}</div>
        <div className={styles.footerRight}>{t.footerRight}</div>
      </footer>
    </div>
  );
}
