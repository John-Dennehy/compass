import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { Resource, Audience, DayOfWeek } from "@/data/resources/types";

const resourceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.enum(["playgroup", "library", "other"]),
  audiences: z.array(z.string()).min(1, "Select at least one audience"),
  location: z.object({
    name: z.string().min(3, "Location name is required"),
    address: z.string().min(5, "Address is required"),
    postcode: z.string().optional(),
  }),
  schedule: z.array(z.object({
    day: z.string(),
    times: z.array(z.object({
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
      description: z.string().optional(),
    })).min(1, "Add at least one time slot"),
    frequency: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, "Add at least one schedule entry"),
  contacts: z.array(z.object({
    method: z.enum(["phone", "email", "text", "other"]),
    value: z.string().min(1, "Value is required"),
    description: z.string().optional(),
  })).optional(),
  links: z.array(z.object({
    type: z.enum(["website", "facebook", "instagram", "twitter", "other"]),
    url: z.string().url("Invalid URL"),
    description: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof resourceSchema>;

const AUDIENCES: Audience[] = [
  "expectant-parents",
  "babies",
  "toddlers",
  "pre-schoolers",
  "parents-carers",
];

const DAYS: DayOfWeek[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

interface SubmissionFormProps {
  onSubmit: (data: FormValues) => Promise<{ success: boolean; error?: string }>;
}

export function SubmissionForm({ onSubmit }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      category: "playgroup",
      audiences: [],
      schedule: [{ day: "Monday", times: [{ startTime: "10:00", endTime: "11:30" }] }],
      contacts: [],
      links: [],
    },
  });

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control,
    name: "schedule",
  });

  const selectedAudiences = watch("audiences");

  const handleAudienceToggle = (audience: string) => {
    const current = selectedAudiences;
    if (current.includes(audience)) {
      setValue("audiences", current.filter(a => a !== audience));
    } else {
      setValue("audiences", [...current, audience]);
    }
  };

  const onFormSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(data);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to submit. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border bg-white p-12 text-center shadow-lg" style={{ borderColor: 'var(--compass-success)' }}>
        <CheckCircle2 className="size-16 text-[var(--compass-success)]" />
        <h2 className="text-3xl font-black text-[var(--compass-text)]">Submission Received!</h2>
        <p className="max-w-md text-lg text-[var(--compass-text)]/70">
          Thank you for contributing to Compass. Our team will review the resource and it will appear on the map once approved.
        </p>
        <Button onClick={() => window.location.href = "/"} className="mt-4" style={{ backgroundColor: 'var(--compass-primary)' }}>
          Back to Map
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-12">
      {/* Basic Information */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--compass-text)' }}>Basic Information</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Resource Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Staines Playgroup" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={(val) => setValue("category", val as any)} defaultValue="playgroup">
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="playgroup">Playgroup</SelectItem>
                <SelectItem value="library">Library</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <textarea
            id="description"
            {...register("description")}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            placeholder="Tell us a bit about this resource..."
          />
        </div>
      </section>

      {/* Audiences */}
      <section className="space-y-4">
        <Label className="text-lg font-bold">Target Audiences</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedAudiences.length === AUDIENCES.length) {
                setValue("audiences", []);
              } else {
                setValue("audiences", [...AUDIENCES]);
              }
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedAudiences.length === AUDIENCES.length
                ? "bg-[var(--compass-primary)] text-white shadow-md"
                : "bg-white border text-[var(--compass-text)] hover:bg-gray-50"
            }`}
          >
            All Ages (Select All)
          </button>
          {AUDIENCES.map((audience) => (
            <button
              key={audience}
              type="button"
              onClick={() => handleAudienceToggle(audience)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedAudiences.includes(audience)
                  ? "bg-[var(--compass-primary)] text-white shadow-md"
                  : "bg-white border text-[var(--compass-text)] hover:bg-gray-50"
              }`}
            >
              {audience.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
        {errors.audiences && <p className="text-sm text-red-500">{errors.audiences.message}</p>}
      </section>

      {/* Location */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--compass-text)' }}>Location</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location.name">Venue Name</Label>
            <Input id="location.name" {...register("location.name")} placeholder="e.g. Staines Community Centre" />
            {errors.location?.name && <p className="text-sm text-red-500">{errors.location.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location.postcode">Postcode</Label>
            <Input id="location.postcode" {...register("location.postcode")} placeholder="e.g. TW18 4HR" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location.address">Full Address</Label>
          <Input id="location.address" {...register("location.address")} placeholder="123 High Street, Staines, Surrey" />
          {errors.location?.address && <p className="text-sm text-red-500">{errors.location.address.message}</p>}
        </div>
      </section>

      {/* Schedule */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--compass-text)' }}>Schedule</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSchedule({ day: "Monday", times: [{ startTime: "10:00", endTime: "11:30" }] })}
            className="gap-2"
          >
            <Plus className="size-4" /> Add Day
          </Button>
        </div>

        <div className="space-y-4">
          {scheduleFields.map((field, index) => (
            <div key={field.id} className="relative rounded-lg border bg-gray-50/50 p-6 shadow-sm">
              <button
                type="button"
                onClick={() => removeSchedule(index)}
                className="absolute right-4 top-4 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="size-5" />
              </button>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select onValueChange={(val) => setValue(`schedule.${index}.day`, val)} defaultValue={field.day}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input {...register(`schedule.${index}.times.0.startTime`)} placeholder="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input {...register(`schedule.${index}.times.0.endTime`)} placeholder="11:00" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors.schedule && <p className="text-sm text-red-500">{errors.schedule.message}</p>}
      </section>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-14 w-full text-lg font-bold shadow-lg transition-transform active:scale-[0.98]"
        style={{ backgroundColor: 'var(--compass-primary)' }}
      >
        {isSubmitting ? "Submitting..." : "Submit Resource"}
      </Button>
    </form>
  );
}
