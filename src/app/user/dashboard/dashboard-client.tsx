"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Toaster, toast } from "sonner";
import { Sparkle } from "@phosphor-icons/react";

import { joinQueue, cancelMyTicket, recommendHaircutStyles } from "@/app/user/actions";
import { BarberRosterCard } from "@/components/ui/barber-roster-card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueueSessionCard } from "@/components/ui/queue-session-card";
import type { ActiveTicketSummaryDTO, BarberDTO, ServiceDTO, ShopSettingsDTO } from "@/lib/db/types";
import type { HaircutRecommendationResult } from "@/lib/validation/ai";
import { formatWait } from "@/lib/backend/format";
import { cn } from "@/lib/utils";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDcG-AMdHHjRZN3PvY8UtHasPMNrqj4vA6PweG2ulJPlllKrowBLi4KqtPYU8S6_bHaGgHtEAhCPnbfaESolNKQi3Ynrkv6FXwXZpydpJgNsyxsKrwovcu18segJfQRzrZn5rCoet4wt7-CGDhJwfN6CUkdIJS1zNo8lB-CkJP_6MfRYE4hDk7EkOKSc-pFZPA-_Cg86Xelwk5NDlsT71hnvCjE4MvyaM0MUDMIDLeuLCqhsG6Nao1RjcUt0Duk-PR5t1XXQORlngk";

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

interface ActiveTicketItem {
  id: string;
  ticketNumber: string;
  customerName: string;
  preferredBarberId: string | null;
  assignedBarberId: string | null;
  status: string;
}

interface DashboardClientProps {
  activeTicket: ActiveTicketSummaryDTO | null;
  barbers: BarberDTO[];
  services: ServiceDTO[];
  settings: ShopSettingsDTO;
  activeTickets: ActiveTicketItem[];
}

export function DashboardClient({
  activeTicket,
  barbers,
  services,
  settings,
  activeTickets,
}: DashboardClientProps) {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [queueType, setQueueType] = useState<"general" | "specific">("general");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [selectedBarberForLineup, setSelectedBarberForLineup] = useState<BarberDTO | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [styleResult, setStyleResult] = useState<HaircutRecommendationResult | null>(null);
  const [styleForm, setStyleForm] = useState({
    imageDataUrl: "",
    notes: "",
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();

  const availableBarbers = barbers.filter((barber) => barber.status !== "unavailable");
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId);

  const openJoinDialog = (barberId?: string) => {
    if (activeTicket) {
      toast.warning("You already have an active ticket.", {
        description: "Cancel your current spot before joining a different queue.",
      });
      return;
    }

    if (barberId) {
      setQueueType("specific");
      setSelectedBarberId(barberId);
    } else {
      setQueueType("general");
      setSelectedBarberId("");
    }
    setIsJoinOpen(true);
  };

  const handleJoin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await joinQueue({
        preferredBarberId: queueType === "specific" ? selectedBarberId : null,
      });

      if (result.ok) {
        toast.success("Joined Queue", { description: result.message });
        setIsJoinOpen(false);
      } else {
        toast.error("Could not join queue", { description: result.message });
      }
    });
  };

  const handleLeaveQueue = () => {
    if (!activeTicket) return;
    if (!confirm("Are you sure you want to cancel your spot in the queue?")) return;

    startTransition(async () => {
      const result = await cancelMyTicket(activeTicket.ticketId);
      if (result.ok) {
        toast.error("Left Queue", { description: result.message });
      } else {
        toast.error("Could not leave queue", { description: result.message });
      }
    });
  };

  const handleStyleRecommendation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startAiTransition(async () => {
      const result = await recommendHaircutStyles(styleForm);

      if (result.ok && result.result) {
        setStyleResult(result.result);
        toast.success("Style Recommendations Ready", { description: result.message });
      } else {
        toast.error("Could not generate recommendations", { description: result.message });
      }
    });
  };

  const stopCamera = useCallback((updateState = true) => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (updateState) setIsCameraOpen(false);
  }, []);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid photo", { description: "Please choose an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo is too large", { description: "Please choose an image under 5 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setStyleResult(null);
      setStyleForm((current) => ({
        ...current,
        imageDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.onerror = () => {
      toast.error("Could not read photo", { description: "Please try another image." });
    };
    stopCamera();
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera unavailable", { description: "This browser does not support in-app camera capture." });
      return;
    }

    try {
      setIsCameraStarting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
      setStyleResult(null);
    } catch {
      toast.error("Could not open camera", {
        description: "Please allow camera permission or upload a photo instead.",
      });
    } finally {
      setIsCameraStarting(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Camera is not ready", { description: "Please wait a moment and try again." });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      toast.error("Could not capture photo", { description: "Please upload a photo instead." });
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setStyleResult(null);
    setStyleForm((current) => ({
      ...current,
      imageDataUrl: canvas.toDataURL("image/jpeg", 0.9),
    }));
    stopCamera();
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [isCameraOpen]);

  useEffect(() => () => stopCamera(false), [stopCamera]);

  return (
    <>
      <Toaster position="bottom-right" theme="dark" closeButton richColors />

      <main className="industrial-pattern mx-auto max-w-[1440px] space-y-20 px-5 py-8 md:px-10">
        <DashboardHero image={heroImage} onJoinClick={() => openJoinDialog()} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 flex flex-col justify-between">
            {activeTicket ? (
              <QueueSessionCard
                ticket={activeTicket.ticket}
                peopleAhead={activeTicket.peopleAhead}
                estimatedWait={activeTicket.estimatedWait}
                progress={activeTicket.progress}
                status={activeTicket.status}
                onLeaveQueue={handleLeaveQueue}
              />
            ) : (
              <section className="h-full relative overflow-hidden rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low p-8 shadow-2xl md:p-10 text-center flex flex-col justify-center items-center space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h2 className="font-heading text-4xl uppercase leading-none text-supremo-on-surface">
                    You are not in queue
                  </h2>
                  <p className="text-sm text-supremo-on-surface-variant leading-relaxed font-light">
                    Secure your spot, select a service, and track your estimated wait from this dashboard.
                  </p>
                </div>
                <button
                  onClick={() => openJoinDialog()}
                  disabled={!settings.shopIsOpen || services.length === 0}
                  className={cn(
                    "inline-flex items-center gap-2 h-14 rounded-xl px-8 text-sm font-black uppercase tracking-[0.15em] transition-all shadow-md shadow-primary/10 select-none",
                    settings.shopIsOpen && services.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
                      : "bg-supremo-surface-container-high text-supremo-on-surface-variant cursor-not-allowed"
                  )}
                >
                  {settings.shopIsOpen ? "Join the Queue" : "Shop Closed"}
                </button>
              </section>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="h-full relative overflow-hidden rounded-3xl border border-primary/25 bg-supremo-surface-container-low p-8 shadow-2xl flex flex-col justify-between gap-6">
              <div className="space-y-3 relative z-10 text-left">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb3b0]">
                  <Sparkle size={12} weight="fill" />
                  AI POWERED
                </span>
                <h3 className="font-heading text-3xl uppercase leading-none text-supremo-on-surface">
                  Style AI
                </h3>
                <p className="text-xs text-supremo-on-surface-variant leading-relaxed font-light">
                  Upload or take a photo and get haircut ideas matched to your visible hair, face framing, and shop services.
                </p>
                <div className="pt-2 border-t border-supremo-outline-variant/10 text-[10px] text-primary font-bold uppercase tracking-wider">
                  Gemini Style Recommendation
                </div>
              </div>
              <button
                onClick={() => setIsStyleOpen(true)}
                className="w-full h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-black uppercase tracking-[0.1em] cursor-pointer transition-all flex items-center justify-center gap-1.5 select-none"
              >
                Find Your Style
              </button>
            </div>
          </div>
        </div>

        <section className="pb-20">
          <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-[46px] uppercase leading-none text-supremo-on-surface md:text-[54px]">
              Barber Roster
            </h2>
            <div className="flex items-center gap-5 text-base font-semibold text-supremo-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-primary" />
                Available
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-secondary" />
                Busy
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full bg-supremo-surface-container-highest" />
                Unavailable
              </span>
            </div>
          </div>

          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
            {barbers.map((barber) => (
              <BarberRosterCard
                key={barber.id}
                image={barber.imageUrl ?? portraitImage}
                name={barber.name}
                status={barber.status}
                wait={formatWait(barber.estimatedWaitMinutes)}
                imagePosition={barber.imagePosition}
                onClick={() => setSelectedBarberForLineup(barber)}
              />
            ))}
          </div>
        </section>
      </main>

      <Dialog
        open={isStyleOpen}
        onOpenChange={(open) => {
          setIsStyleOpen(open);
          if (!open) stopCamera();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border border-supremo-outline-variant/30 bg-supremo-surface-container text-supremo-on-surface p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-primary">
              Style Recommendation
            </DialogTitle>
            <DialogDescription className="text-xs text-supremo-on-surface-variant">
              Upload or take a photo and Gemini will suggest haircut styles that match the visible haircut and shop services.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStyleRecommendation} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-supremo-on-surface-variant">
                Customer Photo
              </label>
              <div
                className={cn(
                  "flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-2xl border bg-background/60 text-center transition-all",
                  isCameraOpen || styleForm.imageDataUrl
                    ? "border-supremo-outline-variant/30"
                    : "border-dashed border-primary/30"
                )}
              >
                {isCameraOpen ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-72 w-full object-cover"
                  />
                ) : styleForm.imageDataUrl ? (
                  <span className="relative block h-72 w-full">
                    <Image
                      src={styleForm.imageDataUrl}
                      alt="Selected customer haircut reference"
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 640px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span className="px-6 text-xs font-semibold uppercase tracking-[0.16em] text-supremo-on-surface-variant">
                    Take or upload a photo
                  </span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {isCameraOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="h-10 rounded-xl bg-primary text-xs font-black uppercase tracking-[0.1em] text-primary-foreground transition-all hover:bg-primary/95"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => stopCamera()}
                      className="h-10 rounded-xl border border-supremo-outline-variant/30 text-xs font-black uppercase tracking-[0.1em] text-supremo-on-surface transition-all hover:bg-supremo-surface-container-high"
                    >
                      Stop Camera
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isCameraStarting}
                    className="h-10 rounded-xl bg-primary text-xs font-black uppercase tracking-[0.1em] text-primary-foreground transition-all hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCameraStarting ? "Opening..." : "Open Camera"}
                  </button>
                )}
                <label className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xs font-black uppercase tracking-[0.1em] text-primary transition-all hover:bg-primary/20">
                  {styleForm.imageDataUrl ? "Change Photo" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    capture="user"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!styleForm.imageDataUrl}
                  onClick={() => {
                    stopCamera();
                    setStyleResult(null);
                    setStyleForm((current) => ({ ...current, imageDataUrl: "" }));
                  }}
                  className="h-10 rounded-xl border border-supremo-outline-variant/30 text-xs font-black uppercase tracking-[0.1em] text-supremo-on-surface transition-all hover:bg-supremo-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove Photo
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-supremo-on-surface-variant">
                Optional Notes
              </label>
              <textarea
                value={styleForm.notes}
                onChange={(event) => setStyleForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Keep it professional, avoid cutting too short, include beard blend..."
                className="min-h-20 w-full resize-none rounded-xl border border-supremo-outline-variant/30 bg-background px-3 py-3 text-xs text-supremo-on-surface outline-none placeholder:text-supremo-on-surface-variant/60 focus-visible:border-primary"
              />
            </div>

            <input
              required
              value={styleForm.imageDataUrl}
              onChange={() => undefined}
              className="sr-only"
              aria-label="Uploaded photo data"
              tabIndex={-1}
            />

            <div className="flex flex-col gap-3 border-t border-supremo-outline-variant/15 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsStyleOpen(false)}
                className="h-11 flex-1 rounded-xl border border-supremo-outline-variant/30 text-xs font-black uppercase tracking-[0.1em] text-supremo-on-surface transition-all hover:bg-supremo-surface-container-high"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isAiPending || !styleForm.imageDataUrl}
                className="h-11 flex-1 rounded-xl bg-primary text-xs font-black uppercase tracking-[0.1em] text-primary-foreground shadow-md shadow-primary/10 transition-all hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAiPending ? "Analyzing..." : "Generate Styles"}
              </button>
            </div>
          </form>

          {styleResult && (
            <div className="mt-6 space-y-4 border-t border-supremo-outline-variant/15 pt-5">
              <p className="text-xs leading-relaxed text-supremo-on-surface-variant">{styleResult.summary}</p>
              <div className="grid gap-3">
                {styleResult.recommendations.map((recommendation) => (
                  <article
                    key={recommendation.styleName}
                    className="rounded-2xl border border-primary/15 bg-background/60 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-heading text-xl uppercase leading-none text-supremo-on-surface">
                          {recommendation.styleName}
                        </h4>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {recommendation.confidence}% match - {recommendation.maintenance} maintenance
                        </p>
                      </div>
                      {recommendation.recommendedServiceName && (
                        <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {recommendation.recommendedServiceName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-supremo-on-surface-variant">
                      {recommendation.whyItFits}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-supremo-on-surface">
                      {recommendation.stylingNotes}
                    </p>
                    {recommendation.barberNotes.length > 0 && (
                      <ul className="mt-3 space-y-1 text-[11px] text-supremo-on-surface-variant">
                        {recommendation.barberNotes.map((note) => (
                          <li key={note}>- {note}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="max-w-md border border-supremo-outline-variant/30 bg-supremo-surface-container text-supremo-on-surface p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-primary">
              {queueType === "specific" && selectedBarber ? `Join ${selectedBarber.name}'s Queue` : "Join the Queue"}
            </DialogTitle>
            <DialogDescription className="text-xs text-supremo-on-surface-variant">
              Choose your queue preference. Your active ticket will be saved to your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setQueueType("general");
                  setSelectedBarberId("");
                }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24",
                  queueType === "general"
                    ? "border-primary bg-primary/5 text-supremo-on-surface shadow-md shadow-primary/5"
                    : "border-supremo-outline-variant/30 bg-background text-supremo-on-surface-variant hover:border-primary/50"
                )}
              >
                <span className={cn("text-xs font-black uppercase tracking-wider", queueType === "general" ? "text-primary" : "text-supremo-on-surface-variant")}>
                  General
                </span>
                <span className="text-[10px] leading-relaxed font-light">Any available barber</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQueueType("specific");
                  setSelectedBarberId(selectedBarberId || availableBarbers[0]?.id || "");
                }}
                disabled={availableBarbers.length === 0}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-24",
                  queueType === "specific"
                    ? "border-primary bg-primary/5 text-supremo-on-surface shadow-md shadow-primary/5 cursor-pointer"
                    : "border-supremo-outline-variant/30 bg-background text-supremo-on-surface-variant hover:border-primary/50 cursor-pointer",
                  availableBarbers.length === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className={cn("text-xs font-black uppercase tracking-wider", queueType === "specific" ? "text-primary" : "text-supremo-on-surface-variant")}>
                  Specific
                </span>
                <span className="text-[10px] leading-relaxed font-light">Select a barber</span>
              </button>
            </div>

            {queueType === "specific" && (
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-supremo-on-surface-variant font-medium block">
                  Barber
                </label>
                <select
                  required
                  value={selectedBarberId}
                  onChange={(event) => setSelectedBarberId(event.target.value)}
                  className="w-full bg-background border border-supremo-outline-variant/30 text-supremo-on-surface h-11 px-3 focus-visible:ring-primary focus-visible:border-primary rounded-xl text-xs outline-none cursor-pointer"
                >
                  {availableBarbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name} ({formatWait(barber.estimatedWaitMinutes)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsJoinOpen(false)}
                className="flex-1 py-3 border border-supremo-outline-variant/30 text-supremo-on-surface hover:bg-supremo-surface-container-high rounded-xl text-xs font-black uppercase tracking-[0.1em] cursor-pointer transition-all text-center select-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || (queueType === "specific" && !selectedBarberId)}
                className="flex-1 py-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-[0.1em] cursor-pointer transition-all text-center select-none shadow-md shadow-primary/10"
              >
                {isPending ? "Saving..." : "Confirm Spot"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedBarberForLineup !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBarberForLineup(null);
        }}
      >
        <DialogContent className="max-w-md border border-supremo-outline-variant/30 bg-supremo-surface-container text-supremo-on-surface p-6 rounded-2xl">
          <DialogHeader className="border-b border-supremo-outline-variant/15 pb-3 mb-4">
            <DialogTitle className="font-heading text-2xl uppercase tracking-wider text-primary">
              {selectedBarberForLineup?.name}{"'"}s Lineup
            </DialogTitle>
            <DialogDescription className="text-xs text-supremo-on-surface-variant uppercase tracking-wider font-bold">
              Shift Status: {selectedBarberForLineup?.status === "available" ? "Vacant" : selectedBarberForLineup?.status === "busy" ? "Busy" : "Offline"}
            </DialogDescription>
          </DialogHeader>

          {selectedBarberForLineup && (() => {
            const customersInLine = activeTickets.filter((ticket) => {
              if (ticket.status === "being_served") {
                return ticket.assignedBarberId === selectedBarberForLineup.id;
              }
              if (ticket.status === "waiting") {
                return ticket.preferredBarberId === selectedBarberForLineup.id;
              }
              return false;
            });
            const servingTicket = customersInLine.find(
              (ticket) => ticket.status === "being_served"
            );
            const sortedCustomers = [...customersInLine].sort((a, b) => {
              if (a.status === "being_served" && b.status !== "being_served") return -1;
              if (a.status !== "being_served" && b.status === "being_served") return 1;
              return 0;
            });

            return (
              <div className="space-y-6">
                {selectedBarberForLineup.status === "unavailable" ? (
                  <p className="text-xs text-supremo-on-surface-variant italic py-4 text-center">
                    This barber is not currently on shift.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Currently Serving */}
                    {selectedBarberForLineup.status === "busy" && (
                      <div className="p-3.5 bg-secondary/10 border border-secondary/20 rounded-xl text-xs flex justify-between items-center">
                        <span className="text-supremo-on-surface-variant uppercase tracking-wider font-semibold">Currently Serving</span>
                        <span className="text-secondary font-bold">
                          {servingTicket ? `Ticket #${servingTicket.ticketNumber}` : "In Chair"}
                        </span>
                      </div>
                    )}

                    {/* Customers in Line */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-supremo-on-surface-variant">
                        Lineup ({customersInLine.length})
                      </h4>
                      {customersInLine.length === 0 ? (
                        <p className="text-xs text-supremo-on-surface-variant italic py-6 text-center bg-background/30 rounded-xl border border-supremo-outline-variant/10">
                          No customers in line. Join now to be served first!
                        </p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {sortedCustomers.map((ticket, index) => {
                            const isBeingServed = ticket.status === "being_served";
                            return (
                              <div
                                key={ticket.id}
                                className={cn(
                                  "p-3 border rounded-xl text-xs flex justify-between items-center transition-all",
                                  isBeingServed
                                    ? "bg-secondary/10 border-secondary/30 text-secondary"
                                    : "bg-background/50 border-supremo-outline-variant/10 text-supremo-on-surface"
                                )}
                              >
                                <span className="font-bold flex items-center gap-1.5">
                                  {index + 1}. Ticket #{ticket.ticketNumber}
                                  {isBeingServed && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-secondary text-white font-black uppercase tracking-wider">
                                      Serving
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-3 border-t border-supremo-outline-variant/15">
                  <button
                    type="button"
                    onClick={() => setSelectedBarberForLineup(null)}
                    className="flex-1 py-3 border border-supremo-outline-variant/30 text-supremo-on-surface hover:bg-supremo-surface-container-high rounded-xl text-xs font-black uppercase tracking-[0.1em] cursor-pointer transition-all text-center select-none"
                  >
                    Close
                  </button>
                  {selectedBarberForLineup.status !== "unavailable" && (
                    <button
                      type="button"
                      disabled={isPending || activeTicket !== null}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await joinQueue({
                            preferredBarberId: selectedBarberForLineup.id,
                          });
                          if (result.ok) {
                            toast.success("Joined Queue", { description: result.message });
                            setSelectedBarberForLineup(null);
                          } else {
                            toast.error("Could not join queue", { description: result.message });
                          }
                        });
                      }}
                      className="flex-1 py-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-[0.1em] cursor-pointer transition-all text-center select-none shadow-md shadow-primary/10"
                    >
                      {isPending ? "Joining..." : activeTicket ? "In Queue" : "Join Queue"}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
