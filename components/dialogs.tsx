"use client";

import { useState } from "react";
import { useGuardianStore } from "@/lib/store";
import type { ItemType, Priority, Stakeholder } from "@/lib/collaboration";
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG, STAKEHOLDER_CONFIG } from "@/lib/collaboration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Clock,
  Shield,
  CheckSquare,
  Plus,
  X,
  Loader2,
  Calendar,
  ClipboardList
} from "lucide-react";

// ========== NEW ITEM DIALOG ==========
interface NewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedWeatherDate?: Date;
}

const TYPE_ICONS: Record<ItemType, typeof AlertCircle> = {
  issue: AlertCircle,
  rfi: HelpCircle,
  submittal: FileCheck,
  change_order: FileText,
  delay: Clock,
  safety: Shield,
  quality: CheckSquare
};

export function NewItemDialog({ open, onOpenChange, linkedWeatherDate }: NewItemDialogProps) {
  const addItem = useGuardianStore((state) => state.addItem);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "issue" as ItemType,
    title: "",
    description: "",
    priority: "medium" as Priority,
    assignedTo: ["wci"] as Stakeholder[],
    tags: [] as string[],
    dueDate: ""
  });
  const [tagInput, setTagInput] = useState("");

  const resetForm = () => {
    setFormData({
      type: "issue",
      title: "",
      description: "",
      priority: "medium",
      assignedTo: ["wci"],
      tags: [],
      dueDate: ""
    });
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      addItem({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: "open",
        assignedTo: formData.assignedTo,
        createdBy: "wci",
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        linkedWeatherDate,
        attachments: [],
        tags: formData.tags
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const toggleAssignee = (stakeholder: Stakeholder) => {
    if (formData.assignedTo.includes(stakeholder)) {
      setFormData({
        ...formData,
        assignedTo: formData.assignedTo.filter(s => s !== stakeholder)
      });
    } else {
      setFormData({
        ...formData,
        assignedTo: [...formData.assignedTo, stakeholder]
      });
    }
  };

  const TypeIcon = TYPE_ICONS[formData.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Create New Item
          </DialogTitle>
          <DialogDescription>
            Add a new issue, RFI, submittal, or other project item for tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ItemType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4" />
                    {ITEM_TYPE_CONFIG[formData.type].label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ITEM_TYPE_CONFIG) as ItemType[]).map((type) => {
                  const Icon = TYPE_ICONS[type];
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {ITEM_TYPE_CONFIG[type].label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the item"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description including context, requirements, and any relevant specifications..."
              rows={4}
              required
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <Badge className={PRIORITY_CONFIG[formData.priority].color}>
                      {PRIORITY_CONFIG[formData.priority].label}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <Badge className={PRIORITY_CONFIG[priority].color}>
                        {PRIORITY_CONFIG[priority].label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STAKEHOLDER_CONFIG) as Stakeholder[]).map((stakeholder) => (
                <button
                  key={stakeholder}
                  type="button"
                  onClick={() => toggleAssignee(stakeholder)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    formData.assignedTo.includes(stakeholder)
                      ? `${STAKEHOLDER_CONFIG[stakeholder].color} text-white`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {STAKEHOLDER_CONFIG[stakeholder].label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {linkedWeatherDate && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Clock className="w-4 h-4" />
                Linked to weather event: {linkedWeatherDate.toLocaleDateString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title || !formData.description}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Item
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========== DAILY LOG DIALOG ==========
interface DailyLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  weatherConditions?: string;
  tempHigh?: number;
  tempLow?: number;
}

export function DailyLogDialog({
  open,
  onOpenChange,
  defaultDate,
  weatherConditions = "",
  tempHigh = 0,
  tempLow = 0
}: DailyLogDialogProps) {
  const addDailyLog = useGuardianStore((state) => state.addDailyLog);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    date: defaultDate || today,
    weatherConditions: weatherConditions || "",
    tempHigh: tempHigh || 0,
    tempLow: tempLow || 0,
    crewCount: 4,
    workPerformed: [""],
    materialsUsed: [""],
    equipmentUsed: [""],
    issues: [""],
    safetyNotes: [""],
    sqftCompleted: 0,
    hoursWorked: 8
  });

  const resetForm = () => {
    setFormData({
      date: today,
      weatherConditions: "",
      tempHigh: 0,
      tempLow: 0,
      crewCount: 4,
      workPerformed: [""],
      materialsUsed: [""],
      equipmentUsed: [""],
      issues: [""],
      safetyNotes: [""],
      sqftCompleted: 0,
      hoursWorked: 8
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      addDailyLog({
        date: formData.date,
        weatherConditions: formData.weatherConditions,
        tempHigh: formData.tempHigh,
        tempLow: formData.tempLow,
        crewCount: formData.crewCount,
        workPerformed: formData.workPerformed.filter(w => w.trim()),
        materialsUsed: formData.materialsUsed.filter(m => m.trim()),
        equipmentUsed: formData.equipmentUsed.filter(e => e.trim()),
        issues: formData.issues.filter(i => i.trim()),
        safetyNotes: formData.safetyNotes.filter(s => s.trim()),
        photos: [],
        submittedBy: "WCI Field Team",
        sqftCompleted: formData.sqftCompleted,
        hoursWorked: formData.hoursWorked
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addArrayField = (field: keyof typeof formData) => {
    if (Array.isArray(formData[field])) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[]), ""]
      });
    }
  };

  const updateArrayField = (field: keyof typeof formData, index: number, value: string) => {
    if (Array.isArray(formData[field])) {
      const arr = [...(formData[field] as string[])];
      arr[index] = value;
      setFormData({ ...formData, [field]: arr });
    }
  };

  const removeArrayField = (field: keyof typeof formData, index: number) => {
    if (Array.isArray(formData[field]) && (formData[field] as string[]).length > 1) {
      const arr = (formData[field] as string[]).filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: arr });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Generate Daily Log
          </DialogTitle>
          <DialogDescription>
            Document today&apos;s work activities, conditions, and progress for Building 140.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date & Weather Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log-date">Date</Label>
              <Input
                id="log-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-high">High Temp (°F)</Label>
              <Input
                id="temp-high"
                type="number"
                value={formData.tempHigh}
                onChange={(e) => setFormData({ ...formData, tempHigh: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-low">Low Temp (°F)</Label>
              <Input
                id="temp-low"
                type="number"
                value={formData.tempLow}
                onChange={(e) => setFormData({ ...formData, tempLow: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weather-conditions">Weather Conditions</Label>
            <Input
              id="weather-conditions"
              value={formData.weatherConditions}
              onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
              placeholder="e.g., Clear skies, partly cloudy, light wind"
            />
          </div>

          {/* Crew & Production Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crew-count">Crew Count</Label>
              <Input
                id="crew-count"
                type="number"
                min="1"
                value={formData.crewCount}
                onChange={(e) => setFormData({ ...formData, crewCount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">SF Completed</Label>
              <Input
                id="sqft"
                type="number"
                min="0"
                value={formData.sqftCompleted}
                onChange={(e) => setFormData({ ...formData, sqftCompleted: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.hoursWorked}
                onChange={(e) => setFormData({ ...formData, hoursWorked: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Work Performed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Work Performed</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => addArrayField("workPerformed")}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {formData.workPerformed.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayField("workPerformed", i, e.target.value)}
                  placeholder={`Work item ${i + 1}`}
                />
                {formData.workPerformed.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayField("workPerformed", i)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Materials Used */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materials Used</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => addArrayField("materialsUsed")}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {formData.materialsUsed.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayField("materialsUsed", i, e.target.value)}
                  placeholder={`Material ${i + 1} (e.g., Green-Lock Plus - 10 gal)`}
                />
                {formData.materialsUsed.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayField("materialsUsed", i)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Issues */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Issues / Notes</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => addArrayField("issues")}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {formData.issues.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayField("issues", i, e.target.value)}
                  placeholder={`Issue or note ${i + 1}`}
                />
                {formData.issues.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayField("issues", i)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Safety Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Safety Notes</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => addArrayField("safetyNotes")}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {formData.safetyNotes.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayField("safetyNotes", i, e.target.value)}
                  placeholder={`Safety note ${i + 1}`}
                />
                {formData.safetyNotes.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayField("safetyNotes", i)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Submit Log
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ========== WORK ENTRY DIALOG (for calendar) ==========
interface WorkEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existingEntry?: {
    type: "worked" | "weather_hold" | "weekend" | "scheduled" | "holiday";
    notes?: string;
    sqft?: number;
    weatherReason?: string;
  };
}

export function WorkEntryDialog({ open, onOpenChange, date, existingEntry }: WorkEntryDialogProps) {
  const setWorkEntry = useGuardianStore((state) => state.setWorkEntry);
  const removeWorkEntry = useGuardianStore((state) => state.removeWorkEntry);

  const [formData, setFormData] = useState({
    type: existingEntry?.type || "worked" as "worked" | "weather_hold" | "weekend" | "scheduled" | "holiday",
    notes: existingEntry?.notes || "",
    sqft: existingEntry?.sqft || 0,
    weatherReason: existingEntry?.weatherReason || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkEntry(date, formData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    removeWorkEntry(date);
    onOpenChange(false);
  };

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {existingEntry ? "Edit" : "Add"} Calendar Entry
          </DialogTitle>
          <DialogDescription>
            {displayDate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Entry Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: typeof formData.type) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worked">Worked</SelectItem>
                <SelectItem value="weather_hold">Weather Hold</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="weekend">Weekend</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "worked" && (
            <div className="space-y-2">
              <Label htmlFor="entry-sqft">Square Feet Completed</Label>
              <Input
                id="entry-sqft"
                type="number"
                min="0"
                value={formData.sqft}
                onChange={(e) => setFormData({ ...formData, sqft: Number(e.target.value) })}
              />
            </div>
          )}

          {formData.type === "weather_hold" && (
            <div className="space-y-2">
              <Label htmlFor="weather-reason">Weather Reason</Label>
              <Select
                value={formData.weatherReason}
                onValueChange={(value) => setFormData({ ...formData, weatherReason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Temperature Below Threshold</SelectItem>
                  <SelectItem value="rain">Rain/Precipitation</SelectItem>
                  <SelectItem value="snow">Snow/Ice</SelectItem>
                  <SelectItem value="wind">High Winds</SelectItem>
                  <SelectItem value="humidity">High Humidity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entry-notes">Notes</Label>
            <Textarea
              id="entry-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex justify-between">
            {existingEntry && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete Entry
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {existingEntry ? "Update" : "Add"} Entry
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
