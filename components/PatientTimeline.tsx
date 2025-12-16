"use client";

import { getPatientTimeline } from "@/lib/patientTimeline";
import { TimelineEventCard } from "./TimelineEventCard";
import { SectionHeader } from "./ui/SectionHeader";
import type { Patient } from "@/types/Patient";

interface PatientTimelineProps {
  patient: Patient;
}

export function PatientTimeline({ patient }: PatientTimelineProps) {
  const events = getPatientTimeline(patient.id);

  if (events.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeader title="Linha do Tempo Clínica" />
      <div className="mt-4">
        <div className="relative pl-8">
          {/* Linha vertical */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          {/* Eventos */}
          <div className="space-y-0">
            {events.map((event) => (
              <TimelineEventCard key={event.id} event={event} patient={patient} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

