"use client";

import React, { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { chatService, ChatCompletionRequest, MessagesRequest } from "@/services/chatService";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import LoginForm from "@/components/auth/LoginForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FloatingComposerPanel from "@/components/tool/FloatingComposerPanel";
import { cn } from "@/lib/utils";
import { Coins, Info, Loader2, SendHorizontal, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ClaudeOpus47Props {
  title?: string;
  description?: string;
  locale?: string;
  selectedModel?: "claude-opus-4-7";
}

type ConfigMode = "form" | "json";
type EndpointMode = "chat_completions" | "messages";
type PlaygroundMessage = {
  role: "user" | "assistant";
  content: string;
};
type PlaygroundTurn = {
  id: string;
  user?: string;
  assistant?: string;
  isPending?: boolean;
};
type UsageSummary = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsUsed: number;
};

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_SYSTEM_PROMPT = "You are a professional AI assistant.";
const DEFAULT_TEMPERATURE = 1;
const DEFAULT_TOP_P = 1;
const DEFAULT_MAX_TOKENS = 4096;

const formatMetric = (value: number, digits = 0) => {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
};

const formatCredits = (value: number) => value.toFixed(3).replace(/\.?0+$/, "");

const computeCreditsUsed = (inputTokens: number, outputTokens: number) => {
  return inputTokens / 1000 + (outputTokens / 1000) * 5;
};

const extractConversationFromChatRequest = (request: ChatCompletionRequest): PlaygroundMessage[] => {
  return request.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));
};

const extractConversationFromMessagesRequest = (request: MessagesRequest): PlaygroundMessage[] => {
  return request.messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }));
};

const hasTurnContent = (turn: PlaygroundTurn | null): turn is PlaygroundTurn => {
  return Boolean(turn && (turn.user || turn.assistant));
};

const buildConversationTurns = (
  messages: PlaygroundMessage[],
  pendingUserMessage?: string | null,
  isPending = false,
): PlaygroundTurn[] => {
  const turns: PlaygroundTurn[] = [];
  let currentTurn: PlaygroundTurn | null = null;

  messages.forEach((message, index) => {
    if (message.role === "user") {
      if (hasTurnContent(currentTurn)) {
        turns.push(currentTurn);
      }
      currentTurn = {
        id: `turn-${index}`,
        user: message.content,
      };
      return;
    }

    if (!currentTurn) {
      currentTurn = { id: `turn-${index}` };
    }

    if (currentTurn.assistant) {
      turns.push(currentTurn);
      currentTurn = { id: `turn-${index}` };
    }

    currentTurn.assistant = message.content;
    turns.push(currentTurn);
    currentTurn = null;
  });

  if (hasTurnContent(currentTurn)) {
    turns.push(currentTurn);
  }

  if (pendingUserMessage?.trim()) {
    turns.push({
      id: `pending-${turns.length}`,
      user: pendingUserMessage.trim(),
      isPending,
    });
  }

  return turns;
};

const segmentedButtonClass = (active: boolean) =>
  cn(
    "h-8 rounded-full px-3 text-xs font-medium transition-colors",
    active
      ? "bg-[hsl(var(--button-solid-bg))] text-[hsl(var(--button-solid-fg))]"
      : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
  );

const endpointButtonClass = (active: boolean) =>
  cn(
    "h-10 rounded-2xl border px-3 text-center text-[12px] font-medium leading-none whitespace-nowrap transition-colors",
    active
      ? "border-primary/30 bg-primary/8 text-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
      : "border-border/70 bg-background/55 text-muted-foreground hover:bg-background/80 hover:text-foreground",
  );

export default function ClaudeOpus47({ selectedModel = DEFAULT_MODEL }: ClaudeOpus47Props) {
  const t = useTranslations("modelDetail.model");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [configMode, setConfigMode] = useState<ConfigMode>("form");
  const [endpointMode, setEndpointMode] = useState<EndpointMode>("chat_completions");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE.toString());
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS.toString());
  const [topP, setTopP] = useState(DEFAULT_TOP_P.toString());
  const [draftMessage, setDraftMessage] = useState("");
  const [conversation, setConversation] = useState<PlaygroundMessage[]>([]);
  const [jsonConfig, setJsonConfig] = useState("");
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);

  useEffect(() => {
    setModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedInToApp(appConfig.appName));
  }, []);

  const previewRequest = useMemo(() => {
    const parsedTemperature = Number(temperature);
    const parsedMaxTokens = Number(maxTokens);
    const parsedTopP = Number(topP);
    const nextMessages = draftMessage.trim()
      ? [...conversation, { role: "user" as const, content: draftMessage.trim() }]
      : [...conversation];

    if (endpointMode === "messages") {
      return {
        model,
        system: systemPrompt.trim() || undefined,
        messages: nextMessages,
        max_tokens: Number.isFinite(parsedMaxTokens) ? parsedMaxTokens : DEFAULT_MAX_TOKENS,
        temperature: Number.isFinite(parsedTemperature) ? parsedTemperature : DEFAULT_TEMPERATURE,
        top_p: Number.isFinite(parsedTopP) ? parsedTopP : DEFAULT_TOP_P,
      };
    }

    return {
      model,
      messages: [
        ...(systemPrompt.trim() ? [{ role: "system" as const, content: systemPrompt.trim() }] : []),
        ...nextMessages,
      ],
      max_tokens: Number.isFinite(parsedMaxTokens) ? parsedMaxTokens : DEFAULT_MAX_TOKENS,
      temperature: Number.isFinite(parsedTemperature) ? parsedTemperature : DEFAULT_TEMPERATURE,
      top_p: Number.isFinite(parsedTopP) ? parsedTopP : DEFAULT_TOP_P,
    };
  }, [conversation, draftMessage, endpointMode, maxTokens, model, systemPrompt, temperature, topP]);

  useEffect(() => {
    if (configMode === "json") {
      setJsonConfig(JSON.stringify(previewRequest, null, 2));
    }
  }, [configMode, previewRequest]);

  const previewTurns = useMemo(
    () => buildConversationTurns(conversation, pendingUserMessage, isSubmitting),
    [conversation, isSubmitting, pendingUserMessage],
  );

  const validateNumericField = (value: string, fieldName: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(fieldName);
    }
    return parsed;
  };

  const buildRequestFromForm = (): ChatCompletionRequest | MessagesRequest => {
    if (!draftMessage.trim()) {
      throw new Error("draft");
    }

    if (endpointMode === "messages") {
      return {
        model,
        system: systemPrompt.trim() || undefined,
        messages: [...conversation, { role: "user" as const, content: draftMessage.trim() }],
        max_tokens: validateNumericField(maxTokens, "max_tokens"),
        temperature: validateNumericField(temperature, "temperature"),
        top_p: validateNumericField(topP, "top_p"),
      };
    }

    return {
      model,
      messages: [
        ...(systemPrompt.trim() ? [{ role: "system" as const, content: systemPrompt.trim() }] : []),
        ...conversation,
        { role: "user" as const, content: draftMessage.trim() },
      ],
      max_tokens: validateNumericField(maxTokens, "max_tokens"),
      temperature: validateNumericField(temperature, "temperature"),
      top_p: validateNumericField(topP, "top_p"),
    };
  };

  const parseJsonRequest = (): ChatCompletionRequest | MessagesRequest => {
    const parsed = JSON.parse(jsonConfig);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("json");
    }
    if ((parsed as { model?: string }).model !== DEFAULT_MODEL) {
      throw new Error("model");
    }

    if (endpointMode === "messages") {
      const request = parsed as MessagesRequest;
      if (!Array.isArray(request.messages) || request.messages.length === 0) {
        throw new Error("messages");
      }
      return request;
    }

    const request = parsed as ChatCompletionRequest;
    if (!Array.isArray(request.messages) || request.messages.length === 0) {
      throw new Error("messages");
    }
    return request;
  };

  const extractAssistantMessage = (
    endpoint: EndpointMode,
    response: Record<string, any>,
  ): { assistantText: string; usageSummary: UsageSummary } => {
    if (endpoint === "messages") {
      const assistantText = (response.content || [])
        .filter((item: { type?: string }) => item.type === "text")
        .map((item: { text?: string }) => item.text || "")
        .join("\n")
        .trim();
      const inputTokens = Number(response.usage?.input_tokens || 0);
      const outputTokens = Number(response.usage?.output_tokens || 0);

      return {
        assistantText,
        usageSummary: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          creditsUsed: computeCreditsUsed(inputTokens, outputTokens),
        },
      };
    }

    const assistantText = response.choices?.[0]?.message?.content?.trim() || "";
    const inputTokens = Number(response.usage?.prompt_tokens || 0);
    const outputTokens = Number(response.usage?.completion_tokens || 0);

    return {
      assistantText,
      usageSummary: {
        inputTokens,
        outputTokens,
        totalTokens: Number(response.usage?.total_tokens || inputTokens + outputTokens),
        creditsUsed: computeCreditsUsed(inputTokens, outputTokens),
      },
    };
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      try {
        const userInfo = await apiService.getUserInfo(appConfig.appName);
        if ((userInfo?.data?.credits_amount || 0) <= 0) {
          setShowUpgradeModal(true);
          setIsSubmitting(false);
          return;
        }
      } catch (creditError) {
        console.error("Failed to check credits:", creditError);
      }

      const request = configMode === "json" ? parseJsonRequest() : buildRequestFromForm();
      const nextConversation =
        endpointMode === "messages"
          ? extractConversationFromMessagesRequest(request as MessagesRequest)
          : extractConversationFromChatRequest(request as ChatCompletionRequest);
      const latestUserMessage = [...nextConversation].reverse().find((message) => message.role === "user")?.content ?? null;

      setPendingUserMessage(latestUserMessage);

      const response =
        endpointMode === "messages"
          ? await chatService.sendMessages(request as MessagesRequest)
          : await chatService.sendMessage(request as ChatCompletionRequest);
      const responseObject = response as unknown as Record<string, any>;
      const { assistantText, usageSummary } = extractAssistantMessage(endpointMode, responseObject);

      if (!assistantText) {
        throw new Error("empty_response");
      }

      setConversation([...nextConversation, { role: "assistant", content: assistantText }]);
      setPendingUserMessage(null);
      setUsage(usageSummary);
      setDraftMessage("");
      toast.success(t("chatSuccess"));
    } catch (error: any) {
      console.error(error);
      setPendingUserMessage(null);
      const message = error?.message || "";
      if (/credit|balance|insufficient/i.test(message)) {
        setShowUpgradeModal(true);
      } else if (message === "draft") {
        toast.error(t("chatDraftRequired"));
      } else if (message === "temperature" || message === "max_tokens" || message === "top_p") {
        toast.error(t("chatNumericInvalid"));
      } else if (message === "messages") {
        toast.error(t("chatMessagesRequired"));
      } else if (message === "model") {
        toast.error(t("chatModelInvalid"));
      } else if (message === "json") {
        toast.error(t("chatJsonInvalid"));
      } else if (message === "empty_response") {
        toast.error(t("chatEmptyResponse"));
      } else {
        toast.error(message || t("chatSubmitFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleClearChat = () => {
    setConversation([]);
    setUsage(null);
    setDraftMessage("");
    setPendingUserMessage(null);
  };

  const renderUsageCards = () => {
    if (!usage) {
      return null;
    }

    return (
      <div className="grid gap-1.5 border-b border-border/60 px-3 py-2.5 sm:grid-cols-2 xl:grid-cols-4 md:px-4 md:py-2.5">
        <div className="rounded-2xl border border-border/60 bg-background/65 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("inputTokens")}</p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{formatMetric(usage.inputTokens)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/65 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("outputTokens")}</p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{formatMetric(usage.outputTokens)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/65 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("totalTokens")}</p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{formatMetric(usage.totalTokens)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/65 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{t("creditsUsed")}</p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{formatCredits(usage.creditsUsed)}</p>
        </div>
      </div>
    );
  };

  const renderConfigPanel = () => {
    if (configMode === "json") {
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("jsonConfiguration")}
          </Label>
          <Textarea
            value={jsonConfig}
            onChange={(event) => setJsonConfig(event.target.value)}
            className="min-h-[360px] rounded-2xl border-border/70 bg-background/65 font-mono text-sm"
            placeholder={t("chatJsonPlaceholder")}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("endpoint")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className={endpointButtonClass(endpointMode === "chat_completions")}
              onClick={() => setEndpointMode("chat_completions")}
              disabled={isSubmitting}
            >
              {t("chatCompletionsEndpoint")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={endpointButtonClass(endpointMode === "messages")}
              onClick={() => setEndpointMode("messages")}
              disabled={isSubmitting}
            >
              {t("messagesEndpoint")}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("model")}
          </Label>
          <Input value={model} readOnly className="h-10 rounded-2xl border-border/70 bg-background/65" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("systemPrompt")}
          </Label>
          <Textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            className="min-h-[96px] rounded-2xl border-border/70 bg-background/65"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {t("temperature")}
              </Label>
              <span className="text-xs font-medium text-foreground">{Number(temperature).toFixed(1)}</span>
            </div>
            <Slider
              value={[Number(temperature)]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={(value) => setTemperature(value[0]?.toFixed(1) ?? DEFAULT_TEMPERATURE.toFixed(1))}
              disabled={isSubmitting}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {t("maxTokens")}
            </Label>
            <Input
              type="number"
              step="1"
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
              className="h-10 rounded-2xl border-border/70 bg-background/65"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {t("topP")}
              </Label>
              <span className="text-xs font-medium text-foreground">{Number(topP).toFixed(1)}</span>
            </div>
            <Slider
              value={[Number(topP)]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => setTopP(value[0]?.toFixed(1) ?? DEFAULT_TOP_P.toFixed(1))}
              disabled={isSubmitting}
              className="py-2"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => {
    if (!previewTurns.length) {
      return (
        <div className="flex h-full min-h-[260px] items-center justify-center px-6 text-center">
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">{t("typeMessage")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-5 pb-2">
        {previewTurns.map((turn) => (
          <div key={turn.id} className="space-y-3">
            {turn.user ? (
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-[22px] bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:bg-white dark:text-slate-900">
                  <p className="whitespace-pre-wrap leading-7">{turn.user}</p>
                </div>
              </div>
            ) : null}

            {turn.isPending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            ) : turn.assistant ? (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-[22px] bg-white px-4 py-3 text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:bg-white dark:text-slate-900">
                  <p className="whitespace-pre-wrap text-sm leading-7">{turn.assistant}</p>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <LoginForm
        app_name={appConfig.appName}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-center">
              <Coins className="mx-auto h-12 w-12 text-orange-500" />
              <h3 className="text-lg font-semibold">{t("chatUpgradeTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("chatUpgradeDescription")}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpgradeModal(false)}>
                {t("cancel")}
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
                onClick={() => window.open("/dashboard/billing", "_blank")}
              >
                {t("openBilling")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 lg:h-[680px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex min-h-[540px] flex-col rounded-[24px] border border-border/70 bg-card/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:h-[680px]">
          <div className="border-b border-border/70 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-foreground">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t("configuration")}</span>
              </div>
              <div className="flex rounded-full border border-border/70 bg-background/65 p-1">
                <button type="button" className={segmentedButtonClass(configMode === "form")} onClick={() => setConfigMode("form")}>
                  {t("form")}
                </button>
                <button type="button" className={segmentedButtonClass(configMode === "json")} onClick={() => setConfigMode("json")}>
                  JSON
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-4 py-4">{renderConfigPanel()}</div>
        </aside>

        <section className="flex min-h-[540px] flex-col rounded-[24px] border border-border/70 bg-card/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:h-[680px]">
          {renderUsageCards()}

          <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:px-4 md:py-3.5">
            <div
              data-tool-action-boundary
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-border/60 bg-background/60"
            >
              <div className="border-b border-border/60 px-4 py-3 md:px-5 md:py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{t("chatPanelTitle")}</h3>
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t("clearChat")}</span>
                  </button>
                </div>
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3.5 py-2.5 text-[13px] leading-5 text-blue-700 dark:text-blue-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>{t("playgroundNotice")}</p>
                </div>
              </div>

              <div className="tool-chat-scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-5 md:py-4">
                {renderPreviewContent()}
              </div>

              <FloatingComposerPanel
                innerClassName="pointer-events-none px-4 pb-3 pt-5 md:px-5 md:pb-4 md:pt-6"
              >
                <div className="pointer-events-none rounded-[26px] bg-gradient-to-t from-background via-background/92 to-transparent p-1 pt-6 dark:from-slate-950 dark:via-slate-950/92">
                  <div className="pointer-events-auto overflow-hidden rounded-[20px] border border-transparent bg-white p-3 shadow-[0_20px_52px_rgba(15,23,42,0.10)] dark:bg-slate-950">
                    <Textarea
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      className="min-h-[64px] resize-none border-0 bg-transparent px-0 py-0 text-sm text-slate-900 shadow-none outline-none placeholder:text-slate-400 ring-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                      disabled={isSubmitting}
                      placeholder={t("typeMessage")}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1.5">
                      <p className="text-xs leading-5 text-slate-400">
                        {endpointMode === "messages" ? t("messagesEndpoint") : t("chatCompletionsEndpoint")}
                      </p>
                      <Button
                        type="button"
                        aria-label={t("sendMessage")}
                        className="h-9 w-9 rounded-xl bg-slate-800 p-0 text-slate-100 hover:bg-slate-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting || (configMode === "form" && !draftMessage.trim())}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </FloatingComposerPanel>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
