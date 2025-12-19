"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type WakeWordState = "idle" | "listening" | "error";

interface UseWakeWordOptions {
  onWake: () => void;
  keywords?: string[];
  accessKey?: string;
}

/**
 * Hook para detecção de wake word usando Porcupine Web SDK
 * Detecta palavras-chave como "virtus" ou "doctor" e chama onWake quando detectado
 */
export function useWakeWord({
  onWake,
  keywords = ["virtus", "doctor"],
  accessKey,
}: UseWakeWordOptions): { state: WakeWordState; stop: () => void; start: () => void } {
  const [state, setState] = useState<WakeWordState>("idle");
  const engineRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isListeningRef = useRef(false);

  // Função para limpar recursos
  const cleanup = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignorar erros de desconexão
      }
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {
        // Ignorar erros de fechamento
      });
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (engineRef.current) {
      try {
        engineRef.current.release?.();
      } catch (e) {
        // Ignorar erros de release
      }
      engineRef.current = null;
    }

    isListeningRef.current = false;
    setState("idle");
  }, []);

  // Função para iniciar detecção
  const start = useCallback(async () => {
    // Só funciona no client
    if (typeof window === "undefined") {
      return;
    }

    // Se já estiver ouvindo, não fazer nada
    if (isListeningRef.current) {
      return;
    }

    try {
      setState("listening");

      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Inicializar Porcupine
      // Por enquanto, vamos usar uma implementação stub que detecta via Web Speech API
      // Em produção, você precisaria integrar o Porcupine Web SDK real
      
      // Criar AudioContext para processar o áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      // Por enquanto, usar Web Speech API como fallback
      // Em produção, substituir por Porcupine Web SDK
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "pt-BR";

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          const normalized = transcript.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // Verificar se contém alguma das palavras-chave
          for (const keyword of keywords) {
            const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (normalized.includes(normalizedKeyword)) {
              // Wake word detectado!
              recognition.stop();
              cleanup();
              
              // Tocar beep
              try {
                const beep = new Audio("/sounds/wake.mp3");
                beep.play().catch(() => {
                  // Se não houver arquivo, criar beep sintético
                  const beepContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const oscillator = beepContext.createOscillator();
                  const gainNode = beepContext.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(beepContext.destination);
                  oscillator.frequency.value = 800;
                  oscillator.type = "sine";
                  gainNode.gain.setValueAtTime(0.3, beepContext.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(0.01, beepContext.currentTime + 0.1);
                  oscillator.start(beepContext.currentTime);
                  oscillator.stop(beepContext.currentTime + 0.1);
                });
              } catch (e) {
                // Ignorar erros de áudio
              }

              // Chamar callback
              onWake();
              return;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("[useWakeWord] Erro no reconhecimento de voz:", event.error);
          if (event.error === "not-allowed" || event.error === "permission-denied") {
            setState("error");
            cleanup();
          }
        };

        recognition.onend = () => {
          // Se ainda estiver ouvindo, reiniciar
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              // Ignorar erros de reinício
            }
          }
        };

        recognition.start();
        engineRef.current = recognition;
      } else {
        // Fallback: usar detecção simples via análise de frequência
        // Por enquanto, apenas marcar como ouvindo
        console.warn("[useWakeWord] Speech Recognition API não disponível, usando modo básico");
      }

      isListeningRef.current = true;
    } catch (error: any) {
      console.error("[useWakeWord] Erro ao iniciar wake word:", error);
      setState("error");
      cleanup();
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        // Usuário negou permissão
        setState("error");
      }
    }
  }, [onWake, keywords, cleanup]);

  // Função para parar detecção
  const stop = useCallback(() => {
    isListeningRef.current = false;
    cleanup();
  }, [cleanup]);

  // Iniciar automaticamente ao montar (apenas no client)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Iniciar automaticamente
    start();

    // Cleanup ao desmontar
    return () => {
      stop();
    };
  }, [start, stop]);

  return { state, stop, start };
}

