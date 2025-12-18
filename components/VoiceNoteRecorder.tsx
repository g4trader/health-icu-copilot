"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";

interface VoiceNoteRecorderProps {
  onTranscription?: (text: string) => void;
  onStructuredData?: (data: any) => void;
  onError?: (error: string) => void;
  patientContext?: {
    bed?: string;
    patientId?: string;
    unit?: string;
  };
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "sending" | "transcribing" | "parsing" | "success" | "error";

export function VoiceNoteRecorder({
  onTranscription,
  onStructuredData,
  onError,
  patientContext,
  disabled = false
}: VoiceNoteRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const sendAudioToAPI = useCallback(async (audioBlob: Blob) => {
    try {
      setState("transcribing");
      
      // Criar FormData
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      
      // Adicionar contexto do paciente se disponível
      if (patientContext) {
        formData.append("patientContext", JSON.stringify(patientContext));
      }
      
      // Chamar API do Next.js
      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      setTranscriptionText(data.text);
      setState("success");
      
      // Chamar callbacks
      if (data.text) {
        onTranscription?.(data.text);
      }
      
      if (data.structured) {
        onStructuredData?.(data.structured);
      }
      
      // Resetar após 3 segundos
      setTimeout(() => {
        setState("idle");
        setTranscriptionText(null);
      }, 3000);
      
    } catch (error: any) {
      const errorMsg = error.message || "Erro ao processar áudio";
      setErrorMessage(errorMsg);
      setState("error");
      onError?.(errorMsg);
    }
  }, [patientContext, onTranscription, onStructuredData, onError]);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      setTranscriptionText(null);
      
      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm" // fallback
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Parar todas as tracks do stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Criar blob do áudio
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        
        // Enviar para API
        await sendAudioToAPI(audioBlob);
      };
      
      mediaRecorder.start();
      setState("recording");
    } catch (error: any) {
      const errorMsg = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
        ? "Permissão de microfone negada. Por favor, permita o acesso ao microfone."
        : error.name === "NotFoundError" || error.name === "DevicesNotFoundError"
        ? "Nenhum microfone encontrado."
        : `Erro ao iniciar gravação: ${error.message}`;
      
      setErrorMessage(errorMsg);
      setState("error");
      onError?.(errorMsg);
    }
  }, [onError, sendAudioToAPI]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const handleClick = () => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle" || state === "error") {
      startRecording();
    }
  };

  const isRecording = state === "recording";
  const isProcessing = state === "sending" || state === "transcribing" || state === "parsing";
  const isSuccess = state === "success";
  const hasError = state === "error";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isRecording
              ? "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/50"
              : isSuccess
              ? "bg-green-500 text-white"
              : hasError
              ? "bg-slate-400 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }
          ${disabled || isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {state === "sending" && "Enviando..."}
              {state === "transcribing" && "Transcrevendo..."}
              {state === "parsing" && "Processando..."}
            </span>
          </>
        ) : isRecording ? (
          <>
            <Square className="w-4 h-4" />
            <span>Parar gravação</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span>Gravar nota de voz</span>
          </>
        )}
      </button>

      {/* Indicador de gravação */}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          <span>Gravando...</span>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {isSuccess && transcriptionText && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <p className="font-medium mb-1">Transcrição concluída:</p>
          <p className="text-green-700">{transcriptionText}</p>
        </div>
      )}

      {/* Mensagem de erro */}
      {hasError && errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

