import { useState } from "react";
import { candidates as allCandidates, pipelineStages, stageColors, type PipelineStage, type Candidate } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pipeline() {
  const [candidateList, setCandidateList] = useState<Candidate[]>(allCandidates);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (stage: PipelineStage) => {
    if (!draggedId) return;
    setCandidateList(prev => prev.map(c => c.id === draggedId ? { ...c, stage } : c));
    setDraggedId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground text-sm mt-1">Drag candidates across stages</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map(stage => {
          const stageCanditates = candidateList.filter(c => c.stage === stage);
          return (
            <div
              key={stage}
              className="kanban-column min-w-[260px] flex-shrink-0"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(stage)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{stage}</h3>
                <Badge variant="secondary" className="text-xs">{stageCanditates.length}</Badge>
              </div>
              <div className="space-y-3">
                {stageCanditates.map(c => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => handleDragStart(c.id)}
                    className="kanban-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{c.name}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-success">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{c.jobTitle}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {c.skills.slice(0, 2).map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">{s}</Badge>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{c.experience}y exp</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
