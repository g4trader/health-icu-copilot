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

      // Solicitar permissão de microfone diretamente
      // Não verificar dispositivos antes, pois enumerateDevices pode não retornar
      // dispositivos reais antes da permissão ser concedida
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        console.log("[useWakeWord] ✅ Permissão de microfone concedida");
      } catch (mediaError: any) {
        // Tratar erros específicos
        if (mediaError.name === "NotFoundError" || mediaError.name === "DevicesNotFoundError") {
          console.warn("[useWakeWord] Dispositivo de áudio não encontrado. Wake word desabilitado.");
          setState("error");
          return;
        }
        if (mediaError.name === "NotAllowedError" || mediaError.name === "PermissionDeniedError") {
          console.warn("[useWakeWord] Permissão de microfone negada. Wake word desabilitado.");
          setState("error");
          return;
        }
        // Para outros erros, re-lançar
        throw mediaError;
      }
      
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
        recognition.interimResults = true; // Mudar para true para detectar mais rápido
        recognition.lang = "pt-BR";

        // Variantes fonéticas das palavras-chave
        const keywordVariants: Record<string, string[]> = {
          "virtus": [
            "virtus", "virtude", "virtu", "virtuz", "virtús", "virtudez",
            "birtus", "birtuz", "birtude", // variações com 'b'
            "firtus", "firtuz", // variações com 'f'
          ],
          "doctor": [
            "doctor", "doutor", "doutor", "dotor", "doktor", "doktor",
            "doutor", "dotor", "doktor", // variações comuns
          ],
        };

        recognition.onresult = (event: any) => {
          // Pegar o último resultado (mais recente)
          const lastResult = event.results[event.results.length - 1];
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          const normalized = transcript.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          console.log("[useWakeWord] Transcript recebido:", transcript);
          console.log("[useWakeWord] Normalizado:", normalized);

          // Verificar cada palavra-chave e suas variantes
          for (const keyword of keywords) {
            const variants = keywordVariants[keyword] || [keyword];
            
            for (const variant of variants) {
              const normalizedVariant = variant.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              
              // Verificar se o transcript contém a variante (como palavra completa ou parte)
              // Usar regex para verificar como palavra completa ou no início/fim
              const pattern = new RegExp(`\\b${normalizedVariant}\\b|^${normalizedVariant}|${normalizedVariant}$`, "i");
              
              if (pattern.test(normalized) || normalized.includes(normalizedVariant)) {
                console.log("[useWakeWord] ✅ Wake word detectado:", variant, "em:", transcript);
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
      console.log("[useWakeWord] ✅ Wake word engine iniciado com sucesso");
    } catch (error: any) {
      console.error("[useWakeWord] Erro ao iniciar wake word:", error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        console.warn("[useWakeWord] Dispositivo de áudio não encontrado. Wake word desabilitado.");
        setState("error");
        cleanup();
        return; // Não tentar novamente automaticamente
      }
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        console.warn("[useWakeWord] Permissão de microfone negada. Wake word desabilitado.");
        setState("error");
        cleanup();
        return; // Não tentar novamente automaticamente
      }
      
      // Para outros erros, apenas marcar como erro mas não limpar completamente
      // para permitir retry manual
      setState("error");
      cleanup();
    }
  }, [onWake, keywords, cleanup]);

  // Função para parar detecção
  const stop = useCallback(() => {
    isListeningRef.current = false;
    cleanup();
  }, [cleanup]);

  // Iniciar automaticamente ao montar (apenas no client)
  // Mas apenas se a API de mídia estiver disponível
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Verificar se a API está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("[useWakeWord] MediaDevices API não disponível neste navegador.");
      setState("error");
      return;
    }

    // Verificar se Web Speech API está disponível
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("[useWakeWord] Speech Recognition API não disponível neste navegador.");
      setState("error");
      return;
    }

    // Pequeno delay para garantir que a página carregou completamente
    // Isso ajuda quando há pop-ups de permissão pendentes
    const timeoutId = setTimeout(() => {
      // Tentar iniciar (pode falhar se não houver dispositivo, mas isso é tratado)
      start().catch((error) => {
        console.warn("[useWakeWord] Erro ao iniciar wake word automaticamente:", error);
        // O estado já foi atualizado no catch do start()
      });
    }, 500); // 500ms de delay para dar tempo do pop-up de permissão aparecer

    // Cleanup ao desmontar
    return () => {
      clearTimeout(timeoutId);
      stop();
    };
  }, [start, stop]);

  return { state, stop, start };
}

