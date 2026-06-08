"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  Bell,
  Users,
  Clock,
  Scissors,
  Lightning,
  Funnel,
  ArrowsClockwise,
  Gear,
  ChartBar,
  UserPlus,
  SignOut,
  Warning,
  Check,
  Trash,
  Plus,
  PencilSimple,
  Timer,
  FastForward,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ClockAfternoon,
  UserGear,
  CircleNotch,
  Tag,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/signout/actions";
import { ManageRosterDialog, Barber } from "@/components/admin/manage-roster-dialog";
import { ReportsDialog } from "@/components/admin/reports-dialog";
import { createClient } from "@/lib/supabase/client";

// Definitions
interface QueueItem {
  id: string;
  customer: string;
  service: string;
  status: "being_served" | "waiting" | "skipped";
  preferredBarber: string | null; // null represents General Queue
  barberServedBy?: string | null;
  wait: string;
  skippedAt?: number | null; // Timestamp when skipped
}

interface ActivityLog {
  id: string;
  timestamp: string;
  type: "barber" | "customer" | "system";
  message: string;
}

interface ServiceItem {
  name: string;
  price: string;
  duration: string;
  description: string;
  category: "Haircut" | "Beard" | "Shave" | "Treatment" | "Combo";
  isActive: boolean;
}

const portraitImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [shopIsOpen, setShopIsOpen] = useState(true);

  // Settings
  const [settings, setSettings] = useState({
    skipExpiryDuration: 30, // In minutes (configurable for easy testing)
    soundEnabled: true,
  });

  // Ticker for real-time timer updates
  const [ticker, setTicker] = useState(0);

  // Barbers state
  const [barbers, setBarbers] = useState<Barber[]>([
    {
      name: "Kiko T.",
      specialty: "Skin Fade",
      rank: "Master",
      status: "available",
      sessions: 12,
      currentServing: null,
      imagePosition: "44% 42%",
    },
    {
      name: "Marco L.",
      specialty: "Pompadour",
      rank: "Senior",
      status: "busy",
      sessions: 9,
      currentServing: "042",
      imagePosition: "55% 40%",
    },
    {
      name: "Uncle Jun",
      specialty: "Traditional Shave",
      rank: "Artisan",
      status: "busy",
      sessions: 14,
      currentServing: "038",
      imagePosition: "38% 45%",
    },
    {
      name: "Dexter M.",
      specialty: "Modern Crop",
      rank: "Junior",
      status: "unavailable",
      sessions: 6,
      currentServing: null,
      imagePosition: "62% 42%",
    },
  ]);

  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>([
    {
      id: "042",
      customer: "David G.",
      service: "BEARD SCULPT",
      status: "being_served",
      preferredBarber: "Marco L.",
      barberServedBy: "Marco L.",
      wait: "0m",
    },
    {
      id: "038",
      customer: "Christian B.",
      service: "TRADITIONAL SHAVE",
      status: "being_served",
      preferredBarber: "Uncle Jun",
      barberServedBy: "Uncle Jun",
      wait: "0m",
    },
    {
      id: "043",
      customer: "Julian Rivera",
      service: "SUPREMO CUT",
      status: "waiting",
      preferredBarber: null, // General Queue
      wait: "5m",
    },
    {
      id: "044",
      customer: "Rico Blanco",
      service: "VIP PACKAGE",
      status: "waiting",
      preferredBarber: "Kiko T.", // Dedicated Queue (Kiko T.)
      wait: "12m",
    },
    {
      id: "040",
      customer: "Paolo M.",
      service: "LINE UP",
      status: "skipped",
      preferredBarber: null, // Skipped in General Queue
      wait: "0m",
      skippedAt: Date.now() - 5 * 60 * 1000, // Skipped 5m ago
    },
    {
      id: "045",
      customer: "Santi A.",
      service: "CLASSIC SHAVE",
      status: "waiting",
      preferredBarber: null, // General Queue
      wait: "18m",
    },
    {
      id: "046",
      customer: "Lucas K.",
      service: "SCALP TREATMENT",
      status: "waiting",
      preferredBarber: "Uncle Jun", // Dedicated Queue (Uncle Jun)
      wait: "25m",
    },
    {
      id: "047",
      customer: "Mark S.",
      service: "MODERN CROP",
      status: "skipped",
      preferredBarber: "Kiko T.", // Skipped in Dedicated Queue (Kiko T.)
      wait: "0m",
      skippedAt: Date.now() - 28 * 60 * 1000, // Skipped 28m ago (2m left to expire!)
    },
  ]);

  // Services state (Pricing & Catalog)
  const [services, setServices] = useState<ServiceItem[]>([
    {
      name: "SUPREMO CUT",
      price: "$35.00",
      duration: "30 mins",
      description: "Signature precision haircut and style finished with a straight-razor neck shave.",
      category: "Haircut",
      isActive: true,
    },
    {
      name: "BEARD SCULPT",
      price: "$20.00",
      duration: "20 mins",
      description: "Expert beard shaping, lining, and conditioning with premium beard oil.",
      category: "Beard",
      isActive: true,
    },
    {
      name: "LINE UP",
      price: "$15.00",
      duration: "15 mins",
      description: "Quick clean-up of the hairline, sideburns, and neckline.",
      category: "Haircut",
      isActive: true,
    },
    {
      name: "CLASSIC SHAVE",
      price: "$25.00",
      duration: "30 mins",
      description: "Traditional hot towel wet shave using a straight razor and premium shave soap.",
      category: "Shave",
      isActive: true,
    },
    {
      name: "VIP PACKAGE",
      price: "$65.00",
      duration: "60 mins",
      description: "The ultimate lounge treatment: signature haircut, beard sculpt, hot towel shave, and scalp treatment.",
      category: "Combo",
      isActive: true,
    },
    {
      name: "SCALP TREATMENT",
      price: "$30.00",
      duration: "25 mins",
      description: "Invigorating scalp wash, massage, and deep conditioning treatment with tea tree oils.",
      category: "Treatment",
      isActive: true,
    },
  ]);

  // Filters State for Services Catalog
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("All");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>("All");

  // Activity Logs
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: "log_1",
      timestamp: "09:30:00 AM",
      type: "system",
      message: "Supremo BarberQueue System Initialized.",
    },
    {
      id: "log_2",
      timestamp: "09:31:00 AM",
      type: "barber",
      message: "Barber Kiko T. logged in. Status set to VACANT.",
    },
    {
      id: "log_3",
      timestamp: "09:32:00 AM",
      type: "barber",
      message: "Barber Marco L. logged in. Status set to VACANT.",
    },
    {
      id: "log_4",
      timestamp: "09:33:00 AM",
      type: "barber",
      message: "Barber Uncle Jun logged in. Status set to VACANT.",
    },
    {
      id: "log_5",
      timestamp: "09:35:10 AM",
      type: "customer",
      message: "Ticket #038 (Christian B.) joined Dedicated Queue for Uncle Jun.",
    },
    {
      id: "log_6",
      timestamp: "09:36:12 AM",
      type: "customer",
      message: "Ticket #042 (David G.) joined Dedicated Queue for Marco L.",
    },
    {
      id: "log_7",
      timestamp: "09:38:00 AM",
      type: "barber",
      message: "Barber Uncle Jun called Ticket #038 (Christian B.) to chair.",
    },
    {
      id: "log_8",
      timestamp: "09:40:00 AM",
      type: "barber",
      message: "Barber Marco L. called Ticket #042 (David G.) to chair.",
    },
    {
      id: "log_9",
      timestamp: "09:43:00 AM",
      type: "customer",
      message: "Ticket #043 (Julian Rivera) joined General Queue.",
    },
    {
      id: "log_10",
      timestamp: "09:44:00 AM",
      type: "customer",
      message: "Ticket #044 (Rico Blanco) joined Dedicated Queue for Kiko T.",
    },
    {
      id: "log_11",
      timestamp: "09:50:00 AM",
      type: "customer",
      message: "Ticket #040 (Paolo M.) was skipped in General Queue.",
    },
    {
      id: "log_12",
      timestamp: "09:55:00 AM",
      type: "customer",
      message: "Ticket #047 (Mark S.) was skipped in Dedicated Queue for Kiko T.",
    },
  ]);

  const [servedToday, setServedToday] = useState(64);

  // Profile Form States
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberSpecialty, setNewBarberSpecialty] = useState("");
  const [newBarberRank, setNewBarberRank] = useState("Junior");
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editRank, setEditRank] = useState("");

  // Services Form States
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState<"Haircut" | "Beard" | "Shave" | "Treatment" | "Combo">("Haircut");
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    // Fetch active session user details
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser(data.user);
      }
    });

    const savedStatus = localStorage.getItem("shopIsOpen");
    if (savedStatus !== null) {
      setShopIsOpen(savedStatus === "true");
    }

    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  // Timer interval to force re-render for skipped timers, and auto-expire tickets
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);

      setQueue((prevQueue) => {
        let changed = false;
        const now = Date.now();
        const expiryLimit = settings.skipExpiryDuration * 60 * 1000;

        const updated = prevQueue.filter((item) => {
          if (item.status === "skipped" && item.skippedAt) {
            const elapsed = now - item.skippedAt;
            if (elapsed >= expiryLimit) {
              changed = true;
              // Log this expiration event
              setLogs((prevLogs) => [
                {
                  id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                  type: "system",
                  message: `Ticket #${item.id} (${item.customer}) expired automatically after remaining skipped for over ${settings.skipExpiryDuration} minutes.`,
                },
                ...prevLogs,
              ]);
              return false; // Remove from queue
            }
          }
          return true;
        });

        return changed ? updated : prevQueue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.skipExpiryDuration]);

  // Sound generator
  const playAnnounceSound = () => {
    if (!settings.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.12);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.0, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      }, 150);
    } catch (e) {
      console.log("AudioContext failed to start:", e);
    }
  };

  // Log activity helper
  const addLog = (type: "barber" | "customer" | "system", message: string) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      type,
      message,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Toggle Barber shift
  const handleToggleBarberShift = (barberName: string) => {
    setBarbers((prev) =>
      prev.map((b) => {
        if (b.name === barberName) {
          const isOffline = b.status === "unavailable";
          const newStatus = isOffline ? ("available" as const) : ("unavailable" as const);
          
          if (isOffline) {
            addLog("barber", `Barber ${barberName} logged in (Shift started, status set to VACANT).`);
          } else {
            addLog("barber", `Barber ${barberName} logged out (Shift ended, removed from active queue pool).`);
            
            // Clean up any serving customer for logged out barber
            setQueue((qPrev) =>
              qPrev.filter((qi) => !(qi.status === "being_served" && qi.barberServedBy === barberName))
            );
          }

          return {
            ...b,
            status: newStatus,
            currentServing: null,
          };
        }
        return b;
      })
    );
  };

  // Call Specific Customer
  const handleCallCustomer = (customer: QueueItem, targetBarberName: string) => {
    playAnnounceSound();
    setAnnouncement(`🔊 CALLING TICKET #${customer.id} — ${customer.customer.toUpperCase()} TO ${targetBarberName.toUpperCase()}'S CHAIR`);
    setTimeout(() => {
      setAnnouncement(null);
    }, 4000);

    // Update Queue: Remove existing customers being served by this barber & set new customer
    setQueue((prev) => {
      let updated = prev.filter(
        (item) => !(item.status === "being_served" && item.barberServedBy === targetBarberName)
      );
      updated = updated.map((item) =>
        item.id === customer.id
          ? {
              ...item,
              status: "being_served" as const,
              barberServedBy: targetBarberName,
              skippedAt: null,
            }
           : item
      );
      return updated;
    });

    // Update Barber to busy
    setBarbers((prev) =>
      prev.map((b) =>
        b.name === targetBarberName
          ? {
              ...b,
              status: "busy" as const,
              sessions: b.sessions + 1,
              currentServing: customer.id,
            }
          : b
      )
    );

    setServedToday((prev) => prev + 1);
    addLog(
      "barber",
      `Barber ${targetBarberName} called Ticket #${customer.id} (${customer.customer}) to chair.`
    );
  };

  // Call Next for a Barber (Priority Queue Logic)
  const handleCallNextForBarber = (barberName: string) => {
    // 1. Check Dedicated Queue for this barber
    const dedicatedQueue = queue.filter(
      (item) => item.preferredBarber === barberName && item.status === "waiting"
    );

    let customerToCall: QueueItem | undefined;

    if (dedicatedQueue.length > 0) {
      // Pick first in Dedicated Queue
      customerToCall = dedicatedQueue[0];
    } else {
      // 2. Dedicated Queue is empty, check General Queue
      const generalQueue = queue.filter(
        (item) => !item.preferredBarber && item.status === "waiting"
      );
      if (generalQueue.length > 0) {
        // Pick first in General Queue
        customerToCall = generalQueue[0];
      }
    }

    if (!customerToCall) {
      alert(`No customers waiting in ${barberName}'s Dedicated Queue or in the General Queue.`);
      return;
    }

    handleCallCustomer(customerToCall, barberName);
  };

  // Skip Customer
  const handleSkipCustomer = (customerId: string) => {
    let customerName = "";
    let preferred: string | null = null;

    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === customerId) {
          customerName = item.customer;
          preferred = item.preferredBarber;
          return {
            ...item,
            status: "skipped" as const,
            skippedAt: Date.now(),
          };
        }
        return item;
      })
    );

    addLog(
      "customer",
      `Ticket #${customerId} (${customerName}) was skipped in ${
        preferred ? `Dedicated Queue for ${preferred}` : "General Queue"
      }. Countdown started.`
    );
  };

  // Restore Customer
  const handleRestoreCustomer = (customerId: string) => {
    let customerName = "";
    let preferred: string | null = null;

    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === customerId) {
          customerName = item.customer;
          preferred = item.preferredBarber;
          return {
            ...item,
            status: "waiting" as const,
            skippedAt: null,
          };
        }
        return item;
      })
    );

    addLog(
      "customer",
      `Ticket #${customerId} (${customerName}) restored to ${
        preferred ? `Dedicated Queue for ${preferred}` : "General Queue"
      }.`
    );
  };

  // Force Expire Customer Manually
  const handleExpireCustomer = (customerId: string) => {
    let customerName = "";
    setQueue((prev) => {
      const target = prev.find((x) => x.id === customerId);
      if (target) customerName = target.customer;
      return prev.filter((item) => item.id !== customerId);
    });

    addLog("system", `Ticket #${customerId} (${customerName}) was expired and removed.`);
  };

  // Fast Forward Ticket Skipped Time by 10 minutes
  const handleFastForwardTimer = (customerId: string) => {
    let customerName = "";
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === customerId && item.skippedAt) {
          customerName = item.customer;
          return {
            ...item,
            skippedAt: item.skippedAt - 10 * 60 * 1000, // Subtract 10 minutes from start time
          };
        }
        return item;
      })
    );
    addLog("system", `Fast-forwarded skipped timer for Ticket #${customerId} (${customerName}) by 10m.`);
  };

  // Barber Profile Management
  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim() || !newBarberSpecialty.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    const exists = barbers.some((b) => b.name.toLowerCase() === newBarberName.trim().toLowerCase());
    if (exists) {
      alert("A barber with this name already exists.");
      return;
    }

    const newBarber: Barber = {
      name: newBarberName.trim(),
      specialty: newBarberSpecialty.trim(),
      rank: newBarberRank,
      status: "unavailable", // Start logged out/offline
      sessions: 0,
      currentServing: null,
      imagePosition: "50% 50%",
    };

    setBarbers((prev) => [...prev, newBarber]);
    addLog("system", `New Barber profile registered: ${newBarber.name} (${newBarber.rank}).`);
    
    setNewBarberName("");
    setNewBarberSpecialty("");
    setNewBarberRank("Junior");
  };

  const handleRemoveBarber = (barberName: string) => {
    if (confirm(`Are you sure you want to remove ${barberName} from staff profiles?`)) {
      setBarbers((prev) => prev.filter((b) => b.name !== barberName));
      // Clean up queue from serving
      setQueue((prev) => prev.filter((qi) => !(qi.status === "being_served" && qi.barberServedBy === barberName)));
      
      addLog("system", `Barber profile removed: ${barberName}.`);
    }
  };

  const handleStartEditBarber = (barber: Barber) => {
    setEditingBarber(barber.name);
    setEditSpecialty(barber.specialty);
    setEditRank(barber.rank);
  };

  const handleSaveEditBarber = (barberName: string) => {
    setBarbers((prev) =>
      prev.map((b) =>
        b.name === barberName
          ? {
              ...b,
              specialty: editSpecialty,
              rank: editRank,
            }
          : b
      )
    );
    addLog("system", `Barber profile updated: ${barberName} (${editRank} - ${editSpecialty}).`);
    setEditingBarber(null);
  };

  // Services Management Tab Control Logic
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice.trim() || !newServiceDuration.trim()) {
      alert("Please fill out the Service Name, Price, and Duration.");
      return;
    }

    const exists = services.some((s) => s.name.toUpperCase() === newServiceName.trim().toUpperCase());
    if (exists) {
      alert("A service with this name already exists.");
      return;
    }

    const newService: ServiceItem = {
      name: newServiceName.trim().toUpperCase(),
      price: newServicePrice.startsWith("$") ? newServicePrice : `$${newServicePrice}`,
      duration: newServiceDuration.trim(),
      description: newServiceDesc.trim() || "No description provided.",
      category: newServiceCategory,
      isActive: true,
    };

    setServices((prev) => [...prev, newService]);
    addLog("system", `New Service added: ${newService.name} (${newService.price}).`);

    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceDuration("");
    setNewServiceDesc("");
    setNewServiceCategory("Haircut");
  };

  const handleRemoveService = (serviceName: string) => {
    if (confirm(`Are you sure you want to delete the service: ${serviceName}?`)) {
      setServices((prev) => prev.filter((s) => s.name !== serviceName));
      addLog("system", `Service deleted: ${serviceName}.`);
    }
  };

  const handleToggleServiceActive = (serviceName: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.name === serviceName) {
          const nextActive = !s.isActive;
          addLog("system", `Service ${serviceName} is now ${nextActive ? "ACTIVE" : "INACTIVE"} for customer check-ins.`);
          return { ...s, isActive: nextActive };
        }
        return s;
      })
    );
  };

  const handleStartEditService = (service: ServiceItem) => {
    setEditingService(service.name);
    setEditPrice(service.price);
    setEditDuration(service.duration);
    setEditDesc(service.description);
  };

  const handleSaveEditService = (serviceName: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.name === serviceName
          ? {
              ...s,
              price: editPrice.startsWith("$") ? editPrice : `$${editPrice}`,
              duration: editDuration,
              description: editDesc,
            }
          : s
      )
    );
    addLog("system", `Service details updated for ${serviceName} (${editPrice} - ${editDuration}).`);
    setEditingService(null);
  };

  // Add Mock Customer
  const handleAddMockCustomer = (preferred: string | null) => {
    const nextNum = String(Math.max(...queue.map((q) => parseInt(q.id) || 0), 40) + 1).padStart(3, "0");
    const firstNames = ["Austin", "Garrett", "Spencer", "Liam", "Trevor", "Noah", "Justin", "Brandon"];
    const lastNames = ["K.", "P.", "R.", "M.", "D.", "S.", "A.", "W."];
    
    // Pick an active service from the list
    const activeServices = services.filter((s) => s.isActive);
    const chosenService = activeServices.length > 0
      ? activeServices[Math.floor(Math.random() * activeServices.length)].name
      : "SUPREMO CUT";

    const mockCustomer: QueueItem = {
      id: nextNum,
      customer: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      service: chosenService,
      status: "waiting",
      preferredBarber: preferred,
      wait: "15m",
    };

    setQueue((prev) => [...prev, mockCustomer]);
    addLog("customer", `Ticket #${nextNum} (${mockCustomer.customer}) checked in (${preferred ? `Preferred: ${preferred}` : "No Preference"}).`);
  };

  // Helpers for time strings & countdowns
  const getCountdownString = (skippedAt: number | null | undefined) => {
    if (!skippedAt) return "";
    const elapsed = Date.now() - skippedAt;
    const limit = settings.skipExpiryDuration * 60 * 1000;
    const remaining = limit - elapsed;
    if (remaining <= 0) return "00:00";

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const isNearingExpiry = (skippedAt: number | null | undefined) => {
    if (!skippedAt) return false;
    const elapsed = Date.now() - skippedAt;
    const limit = settings.skipExpiryDuration * 60 * 1000;
    const remaining = limit - elapsed;
    // Highlight if less than 5 minutes remain
    return remaining < 5 * 60 * 1000;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#17130c]" />;
  }

  // Filter queue helper (General and Barber queues)
  const generalQueueFiltered = queue.filter(
    (item) => !item.preferredBarber && item.status !== "being_served"
  );
  
  // Sort queues so waiting customers are always first, followed by skipped ordered by skip timestamp
  const sortQueueList = (items: QueueItem[]) => {
    return [...items].sort((a, b) => {
      if (a.status === "waiting" && b.status === "skipped") return -1;
      if (a.status === "skipped" && b.status === "waiting") return 1;
      if (a.status === "skipped" && b.status === "skipped") {
        return (a.skippedAt || 0) - (b.skippedAt || 0); // Earliest skip timestamp first
      }
      return a.id.localeCompare(b.id); // Default by Ticket ID
    });
  };

  const sortedGeneralQueue = sortQueueList(generalQueueFiltered);

  // Active Barbers count
  const activeBarbers = barbers.filter((b) => b.status !== "unavailable");
  const vacantBarbers = barbers.filter((b) => b.status === "available");

  // Estimated wait time
  const totalWaiting = queue.filter((x) => x.status === "waiting").length;
  const currentEstWait = totalWaiting * 6; // Mock 6 minutes per person

  // Count search query on logs/general
  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.timestamp.includes(searchQuery)
  );

  // Filtered Services List (Search + Category + Status filters)
  const filteredServicesList = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = serviceCategoryFilter === "All" || s.category === serviceCategoryFilter;
    
    const matchesStatus =
      serviceStatusFilter === "All" ||
      (serviceStatusFilter === "Active" && s.isActive) ||
      (serviceStatusFilter === "Inactive" && !s.isActive);
      
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const firstName = currentUser?.user_metadata?.first_name || "Admin";
  const lastName = currentUser?.user_metadata?.last_name || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "A";

  // ==========================================
  // RENDER SUB-VIEWS
  // ==========================================

  // View 1: DASHBOARD
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* 3a. Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Users size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            GENERAL QUEUE
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1">
            {String(generalQueueFiltered.filter(q => q.status === "waiting").length).padStart(2, "0")}
          </div>
          <span className="text-[10px] text-[#f0bf5c] font-semibold flex items-center gap-1">
            {generalQueueFiltered.filter(q => q.status === "skipped").length} skipped tickets pending
          </span>
        </div>

        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Clock size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            EST. MAX WAIT
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1 flex items-baseline gap-0.5">
            {currentEstWait}
            <span className="text-lg">M</span>
          </div>
          <span className="text-[10px] text-[#9b8f7d] font-semibold">
            Based on {totalWaiting} waiting customers
          </span>
        </div>

        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Scissors size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            ACTIVE BARBERS
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1">
            {String(activeBarbers.length).padStart(2, "0")}
          </div>
          <span className="text-[10px] text-[#f0bf5c] font-semibold">
            {vacantBarbers.length} vacant, {activeBarbers.length - vacantBarbers.length} busy
          </span>
        </div>

        <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-4 relative overflow-hidden group shadow-lg">
          <div className="absolute -right-3 -bottom-3 text-[#39342c]/20 group-hover:scale-110 transition-transform duration-300">
            <Lightning size={72} weight="fill" />
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#9b8f7d] tracking-wider block">
            SERVED TODAY
          </span>
          <div className="font-heading text-4xl font-normal text-[#ebe1d6] mt-2 mb-1">
            {String(servedToday).padStart(2, "0")}
          </div>
          <span className="text-[10px] text-[#9b8f7d] font-semibold">
            Target: 80 sessions
          </span>
        </div>
      </div>

      {/* 3b. Real-Time Monitor Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: General Queue */}
        <div className="xl:col-span-1 bg-[#231f18] border border-[#4e4637]/30 p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
            <div>
              <h3 className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c]">
                General Queue
              </h3>
              <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">No Preferred Barber</p>
            </div>
            <button
              onClick={() => handleAddMockCustomer(null)}
              className="p-1 border border-[#f0bf5c]/30 text-[#f0bf5c] hover:bg-[#f0bf5c]/10 text-xs flex items-center gap-1 font-semibold uppercase tracking-wider px-2"
              title="Add mock customer to General Queue"
            >
              <Plus size={12} /> ADD
            </button>
          </div>

          {/* Customer list */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedGeneralQueue.length === 0 ? (
              <div className="text-center py-10 text-[#9b8f7d] text-xs italic">
                General Queue is empty.
              </div>
            ) : (
              sortedGeneralQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "border p-3.5 flex flex-col gap-3 transition-all",
                    item.status === "skipped"
                      ? "bg-[#891c22]/5 border-[#891c22]/30"
                      : "bg-[#17130c] border-[#4e4637]/40 hover:border-[#f0bf5c]/50"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-heading text-[#f0bf5c] leading-none">
                        #{item.id}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#ebe1d6]">{item.customer}</div>
                        <div className="text-[10px] text-[#9b8f7d] uppercase tracking-widest mt-0.5">
                          {item.service}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-[#9b8f7d] block uppercase tracking-wider">
                        Position
                      </span>
                      <span className="font-heading text-lg text-[#ebe1d6]">
                        {idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Skipped timer display */}
                  {item.status === "skipped" && (
                    <div className="flex items-center justify-between bg-[#891c22]/15 border border-[#891c22]/40 p-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#ffb3b0]">
                        <Timer size={14} className={isNearingExpiry(item.skippedAt) ? "animate-pulse text-red-500" : ""} />
                        <span>Expires in:</span>
                        <span className={cn("font-mono font-bold", isNearingExpiry(item.skippedAt) ? "text-red-500" : "text-[#ffb3b0]")}>
                          {getCountdownString(item.skippedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFastForwardTimer(item.id)}
                          className="text-[#9b8f7d] hover:text-[#ebe1d6] text-[10px] flex items-center gap-0.5 border border-[#4e4637] px-1 py-0.5"
                          title="Simulate 10 minutes elapsed"
                        >
                          <FastForward size={10} /> +10m
                        </button>
                        <button
                          onClick={() => handleExpireCustomer(item.id)}
                          className="text-[#ffb3b0] hover:text-white text-[10px] uppercase font-bold"
                          title="Expire immediately"
                        >
                          Expire
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-2.5">
                    <div className="text-[10px] font-medium text-[#9b8f7d] uppercase tracking-wider">
                      {item.status === "waiting" ? `WAIT: ~${(idx + 1) * 6}M` : "STATUS: SKIPPED"}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === "waiting" ? (
                        <>
                          <button
                            onClick={() => handleSkipCustomer(item.id)}
                            className="border border-red-950 bg-red-900/10 text-red-400 hover:bg-[#891c22]/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 transition-colors"
                          >
                            SKIP
                          </button>
                          
                          {/* Call customer with choice of vacant barbers */}
                          {vacantBarbers.length > 0 ? (
                            <div className="relative group">
                              <button className="bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 flex items-center gap-1">
                                CALL <Clock size={10} />
                              </button>
                              <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#1f1b14] border border-[#4e4637] shadow-xl hidden group-hover:block z-50 p-1">
                                <p className="text-[9px] text-[#9b8f7d] p-1 uppercase border-b border-[#4e4637] tracking-wider mb-1 font-semibold">Assign Barber</p>
                                {vacantBarbers.map((b) => (
                                  <button
                                    key={b.name}
                                    onClick={() => handleCallCustomer(item, b.name)}
                                    className="w-full text-left text-[10px] px-2 py-1.5 hover:bg-[#f0bf5c]/15 hover:text-[#f0bf5c] uppercase font-bold block"
                                  >
                                    Assign to {b.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button
                              disabled
                              className="border border-[#4e4637]/40 text-[#9b8f7d] opacity-50 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 cursor-not-allowed"
                              title="No vacant barbers available"
                            >
                              CALL
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestoreCustomer(item.id)}
                          className="bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] text-[10px] font-bold uppercase tracking-wider px-3 py-1"
                        >
                          RESTORE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columns 2-3: Dedicated Queues */}
        <div className="xl:col-span-2 bg-[#231f18] border border-[#4e4637]/30 p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
            <div>
              <h3 className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c]">
                Dedicated Barber Queues
              </h3>
              <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Customers with Preferred Barber</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-[#2e2922] text-[#f0bf5c] border border-[#4e4637] font-semibold uppercase tracking-wider">
              {activeBarbers.length} Active Shift Pools
            </span>
          </div>

          {/* Grid of Dedicated Columns */}
          {activeBarbers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-[#9b8f7d]">
              <Scissors size={48} className="text-[#4e4637] mb-2" />
              <p className="text-xs italic">No barbers are currently active on shift.</p>
              <p className="text-[10px] mt-1 text-[#9b8f7d]/70 uppercase tracking-widest">
                Log a barber in using the Shift Panel below to activate their Dedicated Queue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-x-auto">
              {activeBarbers.map((barber) => {
                const isVacant = barber.status === "available";
                const isBusy = barber.status === "busy";
                
                // Filter and sort dedicated queue items
                const dedicatedItems = queue.filter(
                  (item) => item.preferredBarber === barber.name && item.status !== "being_served"
                );
                const sortedDedicatedItems = sortQueueList(dedicatedItems);

                // Find customer currently being served by this barber
                const currentlyServingItem = queue.find(
                  (item) => item.status === "being_served" && item.barberServedBy === barber.name
                );

                return (
                  <div
                    key={barber.name}
                    className="bg-[#17130c]/70 border border-[#4e4637]/40 p-4 flex flex-col h-[520px] rounded-none justify-between"
                  >
                    <div className="space-y-4">
                      {/* Barber mini header */}
                      <div className="flex items-center justify-between border-b border-[#4e4637]/20 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="size-8 overflow-hidden border border-[#f0bf5c] bg-[#1e1a12]">
                            <img src={portraitImage} alt={barber.name} className="object-cover w-full h-full" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold leading-none text-[#ebe1d6]">{barber.name}</h4>
                            <span className="text-[9px] text-[#f0bf5c] uppercase font-semibold mt-0.5 block tracking-wider">
                              {barber.rank} • {barber.specialty}
                            </span>
                          </div>
                        </div>

                        {/* Status indicators */}
                        <div className="text-right">
                          <span
                            className={cn(
                              "inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-none border uppercase tracking-wider",
                              isVacant && "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
                              isBusy && "bg-orange-950/40 border-orange-500/50 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)]"
                            )}
                          >
                            {isVacant ? "Vacant" : "Busy"}
                          </span>
                        </div>
                      </div>

                      {/* Display current active session */}
                      <div className="bg-[#1f1b14] border border-[#4e4637]/30 p-2 text-xs">
                        <div className="text-[9px] text-[#9b8f7d] uppercase tracking-widest font-semibold">Currently Serving:</div>
                        {isBusy && currentlyServingItem ? (
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-heading text-base text-[#f0bf5c] font-normal">
                              #{currentlyServingItem.id} <span className="text-xs font-sans text-[#ebe1d6] font-bold ml-1">{currentlyServingItem.customer}</span>
                            </span>
                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider animate-pulse">In Chair</span>
                          </div>
                        ) : (
                          <div className="text-xs text-[#9b8f7d] italic mt-1 font-medium">Chair is empty (VACANT)</div>
                        )}
                      </div>

                      {/* Dedicated Queue List */}
                      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-[#9b8f7d] font-bold uppercase tracking-widest">Dedicated Waiting Pool</span>
                          <button
                            onClick={() => handleAddMockCustomer(barber.name)}
                            className="text-[9px] text-[#f0bf5c] hover:underline uppercase font-bold tracking-widest"
                          >
                            + Add Mock
                          </button>
                        </div>

                        {sortedDedicatedItems.length === 0 ? (
                          <div className="text-center py-8 text-[#9b8f7d]/60 text-[11px] italic border border-dashed border-[#4e4637]/20">
                            Dedicated queue is empty.
                          </div>
                        ) : (
                          sortedDedicatedItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className={cn(
                                "border p-2.5 flex flex-col gap-2 transition-all text-xs",
                                item.status === "skipped"
                                  ? "bg-[#891c22]/5 border-[#891c22]/30"
                                  : "bg-[#1f1b14] border-[#4e4637]/30 hover:border-[#f0bf5c]/30"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="font-heading text-sm text-[#f0bf5c]">#{item.id}</span>
                                  <span className="font-bold text-[#ebe1d6] truncate max-w-[80px]">{item.customer}</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#9b8f7d]">Pos: {idx + 1}</span>
                              </div>

                              {item.status === "skipped" && (
                                <div className="flex items-center justify-between bg-[#891c22]/15 p-1 text-[10px] text-[#ffb3b0]">
                                  <span className="font-mono">{getCountdownString(item.skippedAt)}</span>
                                  <button
                                    onClick={() => handleFastForwardTimer(item.id)}
                                    className="text-[9px] hover:underline"
                                  >
                                    FF 10m
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-between border-t border-[#4e4637]/10 pt-1.5">
                                <span className="text-[9px] text-[#9b8f7d] uppercase tracking-wider">{item.service}</span>
                                <div className="flex gap-1.5">
                                  {item.status === "waiting" ? (
                                    <>
                                      <button
                                        onClick={() => handleSkipCustomer(item.id)}
                                        className="text-red-400 hover:text-red-300 font-bold text-[9px] uppercase"
                                      >
                                        Skip
                                      </button>
                                      <button
                                        onClick={() => handleCallCustomer(item, barber.name)}
                                        className="text-[#f0bf5c] hover:text-[#c89b3c] font-bold text-[9px] uppercase"
                                      >
                                        Call
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleRestoreCustomer(item.id)}
                                      className="text-[#f0bf5c] hover:underline font-bold text-[9px] uppercase"
                                    >
                                      Restore
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Auto-Call Next Priority Trigger */}
                    <div className="pt-3 border-t border-[#4e4637]/20">
                      <button
                        onClick={() => handleCallNextForBarber(barber.name)}
                        className="w-full bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading text-xs tracking-wider h-10 flex items-center justify-center gap-1.5 rounded-none transition-all"
                      >
                        <Bell size={14} weight="bold" />
                        CALL NEXT (PRIORITY)
                      </button>
                      <p className="text-[9px] text-center text-[#9b8f7d] mt-1.5 uppercase tracking-wide">
                        Pulls: Dedicated Pool first, then General Queue
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 3c. Barber Shift Management Roster */}
      <div className="bg-[#231f18] border border-[#4e4637]/30 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#4e4637]/30 pb-3">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">
              Barber Shift Center
            </h3>
            <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Start/End Shifts to adjust the Active Pool</p>
          </div>
          <div className="flex items-center gap-3">
            <ReportsDialog
              barbers={barbers}
              servedToday={servedToday}
              estimatedWait={currentEstWait}
              totalQueue={queue.filter(q => q.status !== "being_served").length}
              trigger={
                <button className="border border-[#4e4637] text-xs font-heading tracking-wider py-1.5 px-3 uppercase hover:bg-[#2e2922] transition-all">
                  Full Analytics Reports
                </button>
              }
            />
            <ManageRosterDialog barbers={barbers} setBarbers={setBarbers} />
          </div>
        </div>

        {/* List of barbers shifts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {barbers.map((barber) => {
            const isOffline = barber.status === "unavailable";
            const isBusy = barber.status === "busy";
            const isVacant = barber.status === "available";

            return (
              <div
                key={barber.name}
                className={cn(
                  "p-3.5 border flex items-center justify-between transition-all rounded-none",
                  isOffline
                    ? "bg-[#17130c]/30 border-[#4e4637]/25 opacity-55"
                    : "bg-[#17130c] border-[#4e4637]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={cn(
                        "size-10 overflow-hidden border bg-zinc-800",
                        isOffline ? "border-zinc-700 saturate-50" : "border-[#f0bf5c]"
                      )}
                    >
                      <img src={portraitImage} alt={barber.name} className="object-cover w-full h-full" />
                    </div>
                    {/* Status dot */}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-[#17130c] block",
                        isVacant && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
                        isBusy && "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]",
                        isOffline && "bg-zinc-600"
                      )}
                    />
                  </div>

                  <div>
                    <h4 className={cn("text-xs font-bold", isOffline ? "text-[#9b8f7d]" : "text-[#ebe1d6]")}>
                      {barber.name}
                    </h4>
                    <span className="text-[9px] text-[#9b8f7d] uppercase font-semibold block tracking-wider">
                      {barber.rank}
                    </span>
                    <div className="text-[10px] font-semibold mt-0.5">
                      {isOffline ? (
                        <span className="text-[#9b8f7d]">OFFLINE</span>
                      ) : isBusy ? (
                        <span className="text-orange-400">BUSY • SERVING #{barber.currentServing}</span>
                      ) : (
                        <span className="text-[#f0bf5c]">VACANT • ON SHIFT</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleToggleBarberShift(barber.name)}
                    className={cn(
                      "border text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-all rounded-none",
                      isOffline
                        ? "border-[#f0bf5c] text-[#f0bf5c] hover:bg-[#f0bf5c]/10"
                        : "border-red-900/50 bg-red-950/10 text-red-400 hover:bg-[#891c22]/20"
                    )}
                  >
                    {isOffline ? "LOG IN (VACANT)" : "LOG OUT"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // View 2: LOGS
  const renderLogs = () => (
    <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#4e4637]/30 pb-4 gap-4">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">
            Customer & Barber Activity Logs
          </h3>
          <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Detailed audit log of system operations and shift histories</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLogs([]);
              addLog("system", "Activity logs cleared by administrator.");
            }}
            className="border border-red-900/50 hover:bg-red-950/10 text-red-400 font-heading tracking-wider py-1.5 px-4 text-xs uppercase"
          >
            Clear Log History
          </button>
          <button
            onClick={() => {
              addLog("system", "Simulating system database health check. OK.");
              alert("Mock log inserted.");
            }}
            className="border border-[#4e4637] hover:bg-[#2e2922] text-[#ebe1d6] font-heading tracking-wider py-1.5 px-4 text-xs uppercase"
          >
            Add Mock Event
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-[#4e4637]/20 max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#4e4637]/45 bg-[#17130c] text-[#9b8f7d] font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-28">Timestamp</th>
              <th className="py-3.5 px-4 w-24 text-center">Type</th>
              <th className="py-3.5 px-4">Event Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4e4637]/15">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[#9b8f7d] italic">
                  No activity logs recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1f1b14]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[#9b8f7d]">{log.timestamp}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        "inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-none",
                        log.type === "barber" && "bg-amber-950/20 border-amber-600/40 text-amber-400",
                        log.type === "customer" && "bg-blue-950/20 border-blue-600/40 text-blue-400",
                        log.type === "system" && "bg-red-950/20 border-red-600/40 text-[#ffb3b0]"
                      )}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#ebe1d6] font-medium">{log.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // View 3: PROFILES
  const renderProfiles = () => (
    <div className="space-y-6">
      
      {/* List / Edit Grid */}
      <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg space-y-6">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">
            Staff Profiles & Specialty Settings
          </h3>
          <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Manage specialties, ranks, and credentials of team members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {barbers.map((barber) => {
            const isEditing = editingBarber === barber.name;
            return (
              <div
                key={barber.name}
                className="bg-[#17130c] border border-[#4e4637] p-5 flex flex-col justify-between h-[280px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-14 overflow-hidden border border-[#f0bf5c] bg-[#1e1a12]">
                      <img src={portraitImage} alt={barber.name} className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xl text-[#f0bf5c] leading-none uppercase">
                        {barber.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d] mt-1.5 block">
                        Shift: {barber.status === "unavailable" ? "OFFLINE" : "ACTIVE"}
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-[#9b8f7d] block font-bold">Specialty</label>
                        <input
                          type="text"
                          value={editSpecialty}
                          onChange={(e) => setEditSpecialty(e.target.value)}
                          className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-2 py-1 focus:outline-none focus:border-[#f0bf5c] mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-[#9b8f7d] block font-bold">Rank Level</label>
                        <select
                          value={editRank}
                          onChange={(e) => setEditRank(e.target.value)}
                          className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-2 py-1 mt-1 outline-none"
                        >
                          <option value="Junior">Junior</option>
                          <option value="Senior">Senior</option>
                          <option value="Master">Master</option>
                          <option value="Artisan">Artisan</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs pt-1.5">
                      <div className="flex justify-between border-b border-[#4e4637]/10 py-1.5">
                        <span className="text-[#9b8f7d] uppercase tracking-wider">Rank Level</span>
                        <span className="font-bold text-[#ebe1d6]">{barber.rank}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#4e4637]/10 py-1.5">
                        <span className="text-[#9b8f7d] uppercase tracking-wider">Specialty Cut</span>
                        <span className="font-bold text-[#ebe1d6]">{barber.specialty}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-[#9b8f7d] uppercase tracking-wider">Served Sessions</span>
                        <span className="font-bold text-[#f0bf5c]">{barber.sessions}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-4 mt-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setEditingBarber(null)}
                        className="text-xs text-[#9b8f7d] hover:text-[#ebe1d6] font-bold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEditBarber(barber.name)}
                        className="text-xs text-[#f0bf5c] hover:text-[#c89b3c] font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <Check size={14} /> Save Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRemoveBarber(barber.name)}
                        className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Trash size={14} /> Remove Staff
                      </button>
                      <button
                        onClick={() => handleStartEditBarber(barber)}
                        className="text-xs text-[#f0bf5c] hover:text-[#c89b3c] font-bold uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <PencilSimple size={14} /> Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Barber Inline Panel */}
      <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg max-w-xl">
        <h3 className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c] mb-4">
          Register New Barber Profile
        </h3>
        
        <form onSubmit={handleAddBarber} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Full Name / Alias</label>
            <input
              type="text"
              value={newBarberName}
              onChange={(e) => setNewBarberName(e.target.value)}
              placeholder="e.g. Johnny 'Clipper' Smith"
              className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2.5 focus:outline-none focus:border-[#f0bf5c] rounded-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Specialty Style</label>
            <input
              type="text"
              value={newBarberSpecialty}
              onChange={(e) => setNewBarberSpecialty(e.target.value)}
              placeholder="e.g. Buzz Cuts & Low Fades"
              className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2.5 focus:outline-none focus:border-[#f0bf5c] rounded-none"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Rank Credentials</label>
            <select
              value={newBarberRank}
              onChange={(e) => setNewBarberRank(e.target.value)}
              className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2.5 outline-none rounded-none"
            >
              <option value="Junior">Junior Apprentice</option>
              <option value="Senior">Senior Stylist</option>
              <option value="Master">Master Barber</option>
              <option value="Artisan">Artisan Craftsman</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="sm:col-span-2 w-full bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading tracking-wider py-3 text-sm uppercase rounded-none mt-2 transition-all hover:scale-[1.01]"
          >
            Create Staff Profile
          </button>
        </form>
      </div>

    </div>
  );

  // View 4: SERVICES CATALOGUE
  const renderServices = () => (
    <div className="space-y-6">
      
      {/* Services List Panel */}
      <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4e4637]/30 pb-4">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">
              Service Catalogue & Availability
            </h3>
            <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">
              Configure services available for customer registration on check-in
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Create Service Modal Trigger */}
            <Dialog open={isCreateServiceOpen} onOpenChange={setIsCreateServiceOpen}>
              <DialogTrigger asChild>
                <button className="bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading text-xs tracking-wider h-10 px-4 flex items-center justify-center gap-1.5 transition-all rounded-none">
                  <Plus size={14} weight="bold" />
                  CREATE SERVICE
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md border border-[#4e4637] bg-[#1f1b14] text-[#ebe1d6] p-6 rounded-none">
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-heading text-xl uppercase tracking-wider text-[#f0bf5c] flex items-center gap-2">
                    <Tag size={20} />
                    Register New Service Listing
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#d2c5b1]">
                    Define a new grooming service to be shown on the customer check-in options screen.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={(e) => {
                    handleAddService(e);
                    setIsCreateServiceOpen(false);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                >
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Service Name</label>
                    <input
                      type="text"
                      required
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g. BEARD WASH & SHAVE"
                      className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2 focus:outline-none focus:border-[#f0bf5c] rounded-none uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Category</label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value as any)}
                      className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2 outline-none rounded-none"
                    >
                      <option value="Haircut">Haircut</option>
                      <option value="Beard">Beard trim</option>
                      <option value="Shave">Shave</option>
                      <option value="Treatment">Scalp/Face Treatment</option>
                      <option value="Combo">Combo Pack</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Price ($)</label>
                    <input
                      type="text"
                      required
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="e.g. 25.00"
                      className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2 focus:outline-none focus:border-[#f0bf5c] rounded-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Duration (Time)</label>
                    <input
                      type="text"
                      required
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(e.target.value)}
                      placeholder="e.g. 30 mins"
                      className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2 focus:outline-none focus:border-[#f0bf5c] rounded-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#9b8f7d]">Service Description</label>
                    <textarea
                      rows={3}
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="Explain the service details..."
                      className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2 focus:outline-none focus:border-[#f0bf5c] rounded-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 w-full bg-[#f0bf5c] text-[#412d00] hover:bg-[#c89b3c] font-heading tracking-wider py-2.5 text-sm uppercase rounded-none mt-2 transition-all"
                  >
                    REGISTER SERVICE
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#17130c]/50 p-4 border border-[#4e4637]/20">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#9b8f7d] tracking-wider">Type:</span>
              <select
                value={serviceCategoryFilter}
                onChange={(e) => setServiceCategoryFilter(e.target.value)}
                className="bg-[#17130c] border border-[#4e4637]/40 text-xs text-[#ebe1d6] px-3 py-1.5 outline-none rounded-none focus:border-[#f0bf5c]"
              >
                <option value="All">All Categories</option>
                <option value="Haircut">Haircuts</option>
                <option value="Beard">Beard Grooming</option>
                <option value="Shave">Traditional Shaves</option>
                <option value="Treatment">Treatments</option>
                <option value="Combo">Combo Packages</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#9b8f7d] tracking-wider">Status:</span>
              <select
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value)}
                className="bg-[#17130c] border border-[#4e4637]/40 text-xs text-[#ebe1d6] px-3 py-1.5 outline-none rounded-none focus:border-[#f0bf5c]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="text-[10px] text-[#9b8f7d] uppercase tracking-wider font-semibold">
            Showing {filteredServicesList.length} of {services.length} services
          </div>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredServicesList.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#9b8f7d] text-xs italic">
              No services match the selected filters.
            </div>
          ) : (
            filteredServicesList.map((service) => {
              const isEditing = editingService === service.name;
              return (
                <div
                  key={service.name}
                  className={cn(
                    "border p-5 flex flex-col justify-between h-[320px] transition-all rounded-none",
                    service.isActive
                      ? "bg-[#17130c] border-[#4e4637]"
                      : "bg-[#17130c]/30 border-[#4e4637]/25 opacity-55"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#2e2922] border border-[#4e4637] text-[#ebe1d6]">
                          {service.category}
                        </span>
                        <h4 className="font-heading text-xl text-[#f0bf5c] uppercase leading-none mt-1.5">
                          {service.name}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleToggleServiceActive(service.name)}
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border transition-all rounded-none",
                          service.isActive
                            ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-400"
                            : "bg-zinc-800/40 border-zinc-700 text-zinc-400"
                        )}
                      >
                        {service.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-[#9b8f7d] block font-bold">Price</label>
                            <input
                              type="text"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-2 py-1 mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-[#9b8f7d] block font-bold">Duration</label>
                            <input
                              type="text"
                              value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                              className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-2 py-1 mt-0.5"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-[#9b8f7d] block font-bold">Description</label>
                          <textarea
                            rows={2}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-2 py-1 mt-0.5 resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 text-xs">
                        <p className="text-[#9b8f7d] text-[11px] leading-relaxed line-clamp-3 h-[50px] italic">
                          "{service.description}"
                        </p>
                        <div className="flex justify-between border-t border-[#4e4637]/10 pt-2 font-semibold">
                          <span className="text-[#9b8f7d] uppercase tracking-wider">Avg Duration</span>
                          <span className="text-[#ebe1d6]">{service.duration}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#4e4637]/10 pt-2 font-semibold">
                          <span className="text-[#9b8f7d] uppercase tracking-wider">Pricing</span>
                          <span className="text-[#f0bf5c] font-mono font-bold">{service.price}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-3.5 mt-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingService(null)}
                          className="text-[10px] text-[#9b8f7d] hover:text-[#ebe1d6] font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditService(service.name)}
                          className="text-[10px] text-[#f0bf5c] hover:text-[#c89b3c] font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          <Check size={12} /> Save Edits
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRemoveService(service.name)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          <Trash size={12} /> Remove
                        </button>
                        <button
                          onClick={() => handleStartEditService(service)}
                          className="text-[10px] text-[#f0bf5c] hover:text-[#c89b3c] font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          <PencilSimple size={12} /> Edit Listing
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );

  // View 5: SETTINGS
  const renderSettings = () => (
    <div className="bg-[#231f18] border border-[#4e4637]/30 p-6 shadow-lg max-w-xl space-y-6">
      <div>
        <h3 className="font-heading text-xl uppercase tracking-wider text-[#ebe1d6]">
          Admin Timers & Simulation Center
        </h3>
        <p className="text-[10px] text-[#9b8f7d] uppercase tracking-wider">Configure dashboard settings and simulate customer queue events</p>
      </div>

      <div className="space-y-4">
        {/* Shop Operating Status (Open / Close) */}
        <div className="flex items-center justify-between pb-4 border-b border-[#4e4637]/20">
          <div>
            <h4 className="text-xs font-bold text-[#ebe1d6] uppercase tracking-wider">Shop Operating Status</h4>
            <p className="text-[10px] text-[#9b8f7d] mt-1">Open or close the store. Toggling this updates the landing page status banner in real time.</p>
          </div>
          <button
            onClick={() => {
              const newStatus = !shopIsOpen;
              setShopIsOpen(newStatus);
              localStorage.setItem("shopIsOpen", String(newStatus));
              addLog("system", `System Settings: Shop status changed to ${newStatus ? "OPEN" : "CLOSED"}.`);
            }}
            className={cn(
              "border text-[10px] font-bold uppercase tracking-wider px-4 py-2 transition-all cursor-pointer",
              shopIsOpen 
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" 
                : "border-red-900 text-red-400 bg-red-950/20"
            )}
          >
            {shopIsOpen ? "Store Open" : "Store Closed"}
          </button>
        </div>
        {/* Skip Timer settings */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold tracking-wider text-[#ebe1d6] block">
            Skipped Ticket Expiration Limit
          </label>
          <div className="flex items-center gap-3">
            <select
              value={settings.skipExpiryDuration}
              onChange={(e) => setSettings({ ...settings, skipExpiryDuration: parseFloat(e.target.value) })}
              className="bg-[#17130c] border border-[#4e4637] text-xs text-[#ebe1d6] px-3 py-2.5 outline-none w-44 rounded-none"
            >
              <option value={0.167}>10 Seconds (Instant Test)</option>
              <option value={0.5}>30 Seconds (Fast Test)</option>
              <option value={1}>1 Minute</option>
              <option value={5}>5 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes (FR Default)</option>
            </select>
            <p className="text-[10px] text-[#9b8f7d] max-w-[280px]">
              Set this to 10 or 30 seconds to witness the automatic expiration, deletion, and logging of skipped tickets without waiting.
            </p>
          </div>
        </div>

        {/* Sound system toggles */}
        <div className="flex items-center justify-between border-t border-[#4e4637]/20 pt-4">
          <div>
            <h4 className="text-xs font-bold text-[#ebe1d6]">Acoustic Chime Announcements</h4>
            <p className="text-[10px] text-[#9b8f7d]">Play a chime when calling a customer to a barber chair.</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            className={cn(
              "border text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5",
              settings.soundEnabled ? "border-[#f0bf5c] text-[#f0bf5c]" : "border-[#4e4637] text-[#9b8f7d]"
            )}
          >
            {settings.soundEnabled ? "Enabled" : "Muted"}
          </button>
        </div>

        {/* Demo checks */}
        <div className="border-t border-[#4e4637]/20 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-[#ebe1d6]">Simulate Real-time Roster Inflow</h4>
          <p className="text-[10px] text-[#9b8f7d] pb-1">Trigger quick actions to simulate customer check-ins during high volumes.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddMockCustomer(null)}
              className="border border-[#4e4637] hover:bg-[#2e2922] text-[10px] uppercase font-bold tracking-wider py-2 px-3"
            >
              + Mock General Check-in
            </button>
            <button
              onClick={() => handleAddMockCustomer("Kiko T.")}
              className="border border-[#4e4637] hover:bg-[#2e2922] text-[10px] uppercase font-bold tracking-wider py-2 px-3"
            >
              + Mock Kiko T. Check-in
            </button>
            <button
              onClick={() => handleAddMockCustomer("Uncle Jun")}
              className="border border-[#4e4637] hover:bg-[#2e2922] text-[10px] uppercase font-bold tracking-wider py-2 px-3"
            >
              + Mock Uncle Jun Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#17130c] text-[#ebe1d6] font-sans">
      
      {/* Audio announce alert banner */}
      {announcement && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#f0bf5c] text-[#412d00] border-2 border-[#ffb3b0] py-3.5 px-8 font-heading text-xl tracking-wider shadow-[0_0_40px_rgba(240,191,92,0.45)] animate-bounce rounded-none">
          {announcement}
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-[260px] border-r border-[#4e4637]/30 bg-[#13100a] shrink-0 p-5 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="py-2 border-b border-[#4e4637]/20">
            <h1 className="font-heading text-[32px] uppercase leading-none tracking-[0.06em] text-[#f0bf5c]">
              BARBERQUEUE
            </h1>
          </div>

          {/* Supremo Admin Tag */}
          <div className="flex items-center gap-3 p-3 bg-[#1e1a12] border border-[#4e4637]/20">
            <div className="size-10 rounded-none bg-[#f0bf5c] flex items-center justify-center text-[#412d00] font-heading font-bold text-lg">
              SL
            </div>
            <div>
              <h2 className="font-bold text-xs leading-none">Supremo Lounge</h2>
              <span className="text-[10px] uppercase font-semibold text-[#f0bf5c] tracking-widest mt-1 block">
                PREMIUM ADMIN
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {[
              { id: "dashboard", label: "DASHBOARD HUB", icon: Users },
              { id: "logs", label: "CUSTOMER & BARBER LOGS", icon: ArrowsClockwise },
              { id: "profiles", label: "BARBER STAFF PROFILES", icon: Scissors },
              { id: "services", label: "MANAGE SERVICES", icon: Tag },
              { id: "settings", label: "SYSTEM SETTINGS", icon: Gear },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-4 px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 border-r-2 border-transparent text-[#9b8f7d] hover:text-[#ebe1d6] hover:bg-[#1e1a12]/50 text-left rounded-none",
                    isActive && "text-[#f0bf5c] bg-[#1e1a12] border-r-2 border-[#f0bf5c] font-bold"
                  )}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} className={isActive ? "text-[#f0bf5c]" : ""} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#4e4637]/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-none border border-[#f0bf5c]/30 overflow-hidden relative bg-[#2e2922]">
              <img src={portraitImage} alt="Admin" className="object-cover w-full h-full" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#ebe1d6]">Admin</div>
              <button
                onClick={() => signOut()}
                className="text-[10px] text-[#9b8f7d] hover:text-[#f0bf5c] uppercase font-semibold tracking-wider flex items-center gap-1 mt-0.5"
              >
                <SignOut size={10} />
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* 2. Top Header Bar */}
        <header className="flex h-20 items-center justify-between border-b border-[#4e4637]/30 px-6 bg-[#1a160f]/90 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden flex flex-col justify-between h-4 w-5">
              <span className="h-0.5 w-full bg-[#ebe1d6]" />
              <span className="h-0.5 w-full bg-[#ebe1d6]" />
              <span className="h-0.5 w-full bg-[#ebe1d6]" />
            </button>
            <h1 className="font-heading text-2xl uppercase tracking-wider text-[#f0bf5c] flex items-center gap-3">
              ADMIN CONTROL PANEL
              <span 
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-none font-sans shrink-0",
                  shopIsOpen 
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                    : "bg-red-950/20 border-red-900/45 text-red-400"
                )}
              >
                {shopIsOpen ? "Store Open" : "Store Closed"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#9b8f7d]">
                <MagnifyingGlass size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "logs" ? "Search activity logs..." : "Search tickets or actions..."}
                className="w-64 bg-[#17130c] border border-[#4e4637]/60 text-xs text-[#ebe1d6] pl-9 pr-4 py-2 focus:outline-none focus:border-[#f0bf5c] rounded-none placeholder:text-[#9b8f7d]/60"
              />
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 border-l border-[#4e4637]/30 pl-5">
              <span className="text-xs font-semibold text-[#d2c5b1] hidden sm:block">
                Admin
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                    <Avatar
                      className="size-10 border border-primary/50 bg-[#231f18] shadow-lg shadow-primary/10 transition-colors hover:border-primary"
                    >
                      <AvatarFallback className="bg-[#231f18] text-primary font-bold text-sm">
                        {currentUser ? initials : (
                          <svg
                            aria-hidden="true"
                            className="size-6"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 12.25c2.35 0 4.25-1.9 4.25-4.25S14.35 3.75 12 3.75 7.75 5.65 7.75 8 9.65 12.25 12 12.25Z"
                              fill="currentColor"
                            />
                            <path
                              d="M4.75 20.25c.75-4.05 3.38-6.35 7.25-6.35s6.5 2.3 7.25 6.35H4.75Z"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1f1b14] border-[#4e4637] text-[#ebe1d6] p-1 rounded-none shadow-xl">
                  <div className="px-3 py-2.5 border-b border-[#4e4637]/40 mb-1">
                    <p className="text-[12px] font-bold text-[#ebe1d6] leading-tight">
                      {currentUser?.user_metadata?.first_name ? `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name || ""}` : "System Admin"}
                    </p>
                    <p className="text-[10px] text-[#9b8f7d] truncate mt-1">
                      {currentUser?.email || "admin@barberqueue.com"}
                    </p>
                  </div>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-400/10 rounded-none text-xs font-bold uppercase tracking-wider p-2"
                    onClick={() => signOut()}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* 3. Tab Rendering */}
        <div className="flex-1 p-6">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "logs" && renderLogs()}
          {activeTab === "profiles" && renderProfiles()}
          {activeTab === "services" && renderServices()}
          {activeTab === "settings" && renderSettings()}
        </div>
      </main>
    </div>
  );
}
