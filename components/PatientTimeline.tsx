"use client";

import { useState } from "react";
import { getPatientTimeline } from "@/lib/patientTimeline";
import { TimelineEventCard } from "./TimelineEventCard";
import { SectionHeader } from "./ui/SectionHeader";
import type { Patient } from "@/types/Patient";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PatientTimelineProps {
  patient: Patient;
}

export function PatientTimeline({ patient }: PatientTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const events = getPatientTimeline(patient.id);

  if (events.length === 0) {
    return null;
  }

  // Mostrar apenas os 3 primeiros eventos quando colapsado
  const visibleEvents = isExpanded ? events : events.slice(0, 3);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Linha do Tempo Clínica
        </h3>
        {events.length > 3 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>{isExpanded ? "Recolher" : `Ver mais (${events.length - 3})`}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      <div className="mt-4">
        <div className="relative pl-8">
          {/* Linha vertical */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          {/* Eventos */}
          <div className="space-y-0">
            {visibleEvents.map((event) => (
              <TimelineEventCard key={event.id} event={event} patient={patient} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

