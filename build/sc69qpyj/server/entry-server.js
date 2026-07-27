import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { StaticRouter } from "react-router-dom/server.mjs";
import * as React from "react";
import { createContext, useContext, useState, useMemo, useRef, useEffect } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, ShieldAlert, Stethoscope, Sparkles, ArrowRight, ShieldCheck, Activity, FlaskConical, History, ClipboardCheck, UserRound, Calculator, Check, User, Loader2, CircleHelp, Pill, Info, KeyRound, TriangleAlert, AlertTriangle, Trash2, ClipboardList } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "next-themes";
import { Toaster as Toaster$2 } from "sonner";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { QueryClient, useQueryClient, useQuery, useMutation, QueryClientProvider } from "@tanstack/react-query";
import { useLocation, Routes, Route } from "react-router-dom";
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    ToastPrimitives.Root,
    {
      ref,
      className: cn(toastVariants({ variant }), className),
      ...props
    }
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Title,
  {
    ref,
    className: cn("text-sm font-semibold", className),
    ...props
  }
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Description,
  {
    ref,
    className: cn("text-sm opacity-90", className),
    ...props
  }
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster$1() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$2,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const TooltipProvider = TooltipPrimitive.Provider;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
const SiteUrlContext = createContext("");
function useSiteUrl() {
  const fromContext = useContext(SiteUrlContext);
  if (fromContext) return fromContext;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  jsonLd,
  noIndex = false
}) => {
  const siteUrl = useSiteUrl();
  const fullCanonical = canonical ? canonical.startsWith("http") ? canonical : `${siteUrl}${canonical}` : void 0;
  return /* @__PURE__ */ jsxs(Helmet, { children: [
    /* @__PURE__ */ jsx("title", { children: title }),
    description && /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    noIndex ? /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }) : /* @__PURE__ */ jsx("meta", { name: "robots", content: "index, follow" }),
    fullCanonical && /* @__PURE__ */ jsx("link", { rel: "canonical", href: fullCanonical }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: title }),
    description && /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: ogType }),
    fullCanonical && /* @__PURE__ */ jsx("meta", { property: "og:url", content: fullCanonical }),
    ogImage && /* @__PURE__ */ jsx("meta", { property: "og:image", content: ogImage }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: title }),
    description && /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    ogImage && /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: ogImage }),
    jsonLd && /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd).replace(/</g, "\\u003c") })
  ] });
};
const SafetyBanner = () => /* @__PURE__ */ jsx("div", { className: "w-full gradient-primary text-primary-foreground", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-center gap-2 text-sm font-medium tracking-tight", children: [
  /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4 shrink-0" }),
  /* @__PURE__ */ jsx("span", { children: "Clinical decision support only — not a substitute for professional judgment." })
] }) });
const AppHeader = ({ onLaunch }) => /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-30 border-b border-border glass", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3", children: [
  /* @__PURE__ */ jsxs("a", { href: "#top", className: "flex items-center gap-2.5 shrink-0", children: [
    /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-md", children: /* @__PURE__ */ jsx(Stethoscope, { className: "h-4.5 w-4.5 text-primary-foreground" }) }),
    /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
      /* @__PURE__ */ jsxs("span", { className: "block text-lg font-bold tracking-tight text-foreground", children: [
        "Dose",
        /* @__PURE__ */ jsx("span", { className: "text-gradient-primary", children: "Wise" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-medium uppercase tracking-widest text-muted-foreground", children: "Clinical Dosing Suite" })
    ] })
  ] }),
  /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex items-center gap-7 mx-auto text-sm font-medium text-muted-foreground", children: [
    /* @__PURE__ */ jsx("a", { href: "#features", className: "hover:text-foreground transition-colors", children: "Features" }),
    /* @__PURE__ */ jsx("a", { href: "#how", className: "hover:text-foreground transition-colors", children: "How it works" }),
    /* @__PURE__ */ jsx("a", { href: "#trust", className: "hover:text-foreground transition-colors", children: "Safety" })
  ] }),
  /* @__PURE__ */ jsx(
    "button",
    {
      onClick: onLaunch,
      className: "ml-auto md:ml-0 inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all",
      children: "Open Calculator"
    }
  )
] }) });
const LandingHero = ({ onLaunch }) => /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
  /* @__PURE__ */ jsx("div", { className: "absolute -right-24 -top-24 h-80 w-80 rounded-full gradient-primary opacity-[0.10] blur-2xl" }),
  /* @__PURE__ */ jsx("div", { className: "absolute -left-24 top-40 h-72 w-72 rounded-full bg-primary-accent/10 blur-2xl" }),
  /* @__PURE__ */ jsxs("div", { className: "relative max-w-7xl mx-auto px-4 md:px-6 pt-14 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-2 gap-12 items-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "animate-fade-in", children: [
      /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" }),
        " AI-assisted clinical decision support"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]", children: [
        "Precision dosing,",
        /* @__PURE__ */ jsx("span", { className: "block text-gradient-primary", children: "designed for the bedside." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-xl text-base md:text-lg text-muted-foreground", children: "DoseWise turns patient vitals into structured, patient-aware dosing recommendations — with automatic renal and hepatic adjustments, allergy checks, and contraindication screening, all verified by your clinical team." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onLaunch,
            className: "inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all",
            children: [
              "Launch the calculator ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "#how",
            className: "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors",
            children: "See how it works"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4 text-primary" }),
          " Pharmacist-verifiable"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4 text-primary" }),
          " Live BMI · BSA · CrCl"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
          " AI-powered reasoning"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative animate-fade-in", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-3xl border border-border bg-card card-elevated overflow-hidden", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&h=700&fit=crop",
          alt: "Clinician reviewing medication dosing on screen",
          className: "w-full h-72 md:h-[26rem] object-cover",
          loading: "eager"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "absolute -bottom-5 -left-4 md:left-6 rounded-2xl border border-border glass card-elevated px-5 py-4 max-w-[15rem]", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Recommended Dose" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 font-mono text-xl font-semibold text-gradient-primary", children: "1230–1640 mg q8–12h" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: "Renal-adjusted · Allergy-checked" })
      ] })
    ] })
  ] })
] });
const FEATURES = [
  {
    icon: Activity,
    title: "Live clinical metrics",
    desc: "Instant BMI, BSA (Mosteller) and Cockcroft-Gault creatinine clearance as you enter vitals."
  },
  {
    icon: Sparkles,
    title: "AI-powered reasoning",
    desc: "Context-aware dosing that factors comorbidities, medications and clinical nuance."
  },
  {
    icon: ShieldAlert,
    title: "Allergy & contraindication screen",
    desc: "Automatic cross-reactivity and contraindication flags before any dose is suggested."
  },
  {
    icon: FlaskConical,
    title: "Renal & hepatic adjustments",
    desc: "Threshold-based dose adjustments explained in plain clinical language."
  },
  {
    icon: History,
    title: "Calculation history",
    desc: "Every recommendation is logged so your team can review and audit decisions."
  },
  {
    icon: ClipboardCheck,
    title: "Verifiable by design",
    desc: "Structured, transparent output built to be confirmed by a licensed professional."
  }
];
const STEPS = [
  {
    icon: UserRound,
    step: "01",
    title: "Enter patient data",
    desc: "Add vitals, allergies, comorbidities and the drug — or load a sample patient in one click."
  },
  {
    icon: Calculator,
    step: "02",
    title: "Compute the dose",
    desc: "DoseWise calculates the weight- or BSA-based dose and applies clinical adjustments."
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Review & verify",
    desc: "Get a structured recommendation with warnings, then confirm with your pharmacist."
  }
];
const FeatureShowcase = () => /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsxs("section", { id: "features", className: "max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary", children: "Capabilities" }),
      /* @__PURE__ */ jsxs("h2", { className: "mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground", children: [
        "Everything you need for ",
        /* @__PURE__ */ jsx("span", { className: "text-gradient-primary", children: "confident dosing" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "A complete clinical workflow — not just a calculator. From intake to verified recommendation." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: FEATURES.map((f) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "group rounded-2xl border border-border bg-card card-elevated p-6 transition-all hover:-translate-y-1 hover:shadow-lg",
        children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all", children: /* @__PURE__ */ jsx(f.icon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-semibold text-foreground tracking-tight", children: f.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-muted-foreground", children: f.desc })
        ]
      },
      f.title
    )) })
  ] }),
  /* @__PURE__ */ jsx("section", { id: "how", className: "border-y border-border bg-secondary/30", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary", children: "Workflow" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground", children: "Three steps to a verified dose" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 grid grid-cols-1 md:grid-cols-3 gap-5", children: STEPS.map((s) => /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl border border-border bg-card card-elevated p-6", children: [
      /* @__PURE__ */ jsx("span", { className: "absolute right-5 top-5 font-mono text-3xl font-bold text-primary/15", children: s.step }),
      /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground", children: /* @__PURE__ */ jsx(s.icon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("h3", { className: "mt-4 font-semibold text-foreground tracking-tight", children: s.title }),
      /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-muted-foreground", children: s.desc })
    ] }, s.step)) })
  ] }) }),
  /* @__PURE__ */ jsx("section", { id: "trust", className: "max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border gradient-primary text-primary-foreground p-8 md:p-12 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" }),
    /* @__PURE__ */ jsxs("div", { className: "relative max-w-2xl", children: [
      /* @__PURE__ */ jsx(ShieldAlert, { className: "h-8 w-8" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl md:text-4xl font-bold tracking-tight", children: "Built for safety, not shortcuts" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-primary-foreground/90", children: "DoseWise is clinical decision support — every recommendation is transparent, auditable, and explicitly requires confirmation by a licensed pharmacist or physician before administration. It never silently caps or overrides safety limits." })
    ] })
  ] }) })
] });
const AppFooter = () => /* @__PURE__ */ jsx("footer", { className: "border-t border-border bg-card", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-6 py-10", children: [
  /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-lg gradient-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxs("span", { className: "text-base font-bold tracking-tight text-foreground", children: [
        "Dose",
        /* @__PURE__ */ jsx("span", { className: "text-gradient-primary", children: "Wise" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "flex flex-wrap items-center gap-6 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx("a", { href: "#features", className: "hover:text-foreground transition-colors", children: "Features" }),
      /* @__PURE__ */ jsx("a", { href: "#how", className: "hover:text-foreground transition-colors", children: "How it works" }),
      /* @__PURE__ */ jsx("a", { href: "#trust", className: "hover:text-foreground transition-colors", children: "Safety" }),
      /* @__PURE__ */ jsx("a", { href: "#calculator", className: "hover:text-foreground transition-colors", children: "Calculator" })
    ] })
  ] }),
  /* @__PURE__ */ jsx("div", { className: "mt-8 border-t border-border pt-6", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground text-center", children: [
    "© ",
    (/* @__PURE__ */ new Date()).getFullYear(),
    " DoseWise. A clinical decision support tool — all recommendations require verification by a licensed pharmacist or physician before administration."
  ] }) })
] }) });
const DRUGS = [
  {
    id: "vancomycin",
    name: "Vancomycin",
    className: "Glycopeptide antibiotic",
    dosingRange: "15–20 mg/kg every 8–12h",
    dosingBasis: "mg/kg",
    minDose: 15,
    maxDose: 20,
    maxDailyDose: 4e3,
    renalThresholdCrCl: 50,
    renalAdjustment: "Extend interval to q24–48h; trough-guided dosing when CrCl < 50 mL/min.",
    hepaticAdjustment: "No routine hepatic adjustment required.",
    contraindications: ["renal impairment", "hearing loss"],
    allergyCrossReact: ["vancomycin", "glycopeptides"],
    notes: "Nephrotoxic; monitor serum trough levels."
  },
  {
    id: "enoxaparin",
    name: "Enoxaparin",
    className: "Low molecular weight heparin",
    dosingRange: "1 mg/kg q12h (treatment)",
    dosingBasis: "mg/kg",
    minDose: 1,
    maxDose: 1,
    maxDailyDose: 200,
    renalThresholdCrCl: 30,
    renalAdjustment: "Reduce to 1 mg/kg once daily when CrCl < 30 mL/min.",
    hepaticAdjustment: "Use with caution in severe hepatic impairment (bleeding risk).",
    contraindications: ["active bleeding", "renal impairment"],
    allergyCrossReact: ["heparin", "enoxaparin", "pork products"],
    notes: "Anti-Xa monitoring in renal impairment or extremes of weight."
  },
  {
    id: "cefazolin",
    name: "Cefazolin",
    className: "1st-generation cephalosporin",
    dosingRange: "1–2 g IV q8h (2–3 g if >120 kg)",
    dosingBasis: "fixed",
    minDose: 1e3,
    maxDose: 2e3,
    maxDailyDose: 6e3,
    renalThresholdCrCl: 35,
    renalAdjustment: "Extend interval to q12h when CrCl < 35 mL/min.",
    hepaticAdjustment: "No hepatic adjustment required.",
    contraindications: ["penicillin allergy (severe)"],
    allergyCrossReact: ["cephalosporins", "penicillin", "beta-lactams", "cefazolin"],
    notes: "Surgical prophylaxis: administer within 60 minutes before incision."
  },
  {
    id: "gentamicin",
    name: "Gentamicin",
    className: "Aminoglycoside antibiotic",
    dosingRange: "5–7 mg/kg once daily (extended interval)",
    dosingBasis: "mg/kg",
    minDose: 5,
    maxDose: 7,
    maxDailyDose: 560,
    renalThresholdCrCl: 60,
    renalAdjustment: "Extend dosing interval based on CrCl; monitor levels when CrCl < 60 mL/min.",
    hepaticAdjustment: "No hepatic adjustment required.",
    contraindications: ["renal impairment", "hearing loss", "myasthenia gravis"],
    allergyCrossReact: ["aminoglycosides", "gentamicin"],
    notes: "Nephrotoxic and ototoxic; monitor peak/trough levels."
  },
  {
    id: "acyclovir",
    name: "Acyclovir",
    className: "Antiviral (nucleoside analog)",
    dosingRange: "5–10 mg/kg IV q8h",
    dosingBasis: "mg/kg",
    minDose: 5,
    maxDose: 10,
    maxDailyDose: 3e3,
    renalThresholdCrCl: 50,
    renalAdjustment: "Reduce frequency to q12–24h when CrCl < 50 mL/min; ensure hydration.",
    hepaticAdjustment: "No hepatic adjustment required.",
    contraindications: ["renal impairment", "dehydration"],
    allergyCrossReact: ["acyclovir", "valacyclovir"],
    notes: "Crystalluria risk; maintain adequate hydration."
  },
  {
    id: "carboplatin",
    name: "Carboplatin",
    className: "Platinum chemotherapy agent",
    dosingRange: "AUC-based (Calvert) / ~360 mg/m² q4wk",
    dosingBasis: "mg/m2",
    minDose: 300,
    maxDose: 400,
    maxDailyDose: 900,
    renalThresholdCrCl: 60,
    renalAdjustment: "Dose calculated on renal function (Calvert formula); reduce AUC target when CrCl < 60 mL/min.",
    hepaticAdjustment: "Use caution; no fixed adjustment established.",
    contraindications: ["severe bone marrow suppression", "renal impairment"],
    allergyCrossReact: ["platinum agents", "carboplatin", "cisplatin"],
    notes: "Myelosuppressive; monitor CBC. Pregnancy contraindicated (teratogenic)."
  }
];
const getDrug = (id) => DRUGS.find((d) => d.id === id);
function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}
function calcBSA(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  return Math.sqrt(heightCm * weightKg / 3600);
}
function calcCrCl(age, weightKg, serumCr, sex) {
  if (!age || !weightKg || !serumCr) return null;
  const factor = sex === "female" ? 0.85 : 1;
  return (140 - age) * weightKg * factor / (72 * serumCr);
}
function round(n, digits = 1) {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}
const MetricCard = ({ label, value, unit, hint }) => /* @__PURE__ */ jsxs("div", { className: "group relative overflow-hidden rounded-xl border border-border bg-card card-elevated p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg", children: [
  /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-1 gradient-primary opacity-70" }),
  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: label }),
  /* @__PURE__ */ jsxs("p", { className: "mt-1.5 font-mono text-2xl font-semibold text-gradient-primary", children: [
    value,
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground ml-1", children: unit })
  ] }),
  hint && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: hint })
] });
const MultiSelect = ({ options, selected, onChange }) => {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: options.map((opt) => {
    const active = selected.includes(opt);
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => toggle(opt),
        className: cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
          active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-secondary"
        ),
        children: [
          active && /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" }),
          opt
        ]
      },
      opt
    );
  }) });
};
const ALLERGIES = ["penicillin", "cephalosporins", "vancomycin", "heparin", "aminoglycosides", "platinum agents", "acyclovir"];
const COMORBIDITIES = ["diabetes", "hypertension", "renal impairment", "hepatic impairment"];
const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";
const SectionHeader = ({ icon: Icon, title }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pb-1", children: [
  /* @__PURE__ */ jsx("span", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
  /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground tracking-tight", children: title })
] });
const SAMPLE_PATIENT = {
  patientId: "MRN-00482",
  age: "64",
  sex: "male",
  heightCm: "175",
  weightKg: "82",
  serumCr: "1.1",
  hepatic: false,
  pregnancy: "not_applicable",
  allergies: ["penicillin"],
  comorbidities: ["hypertension", "diabetes"],
  medications: "Metformin 500 mg BID, Lisinopril 10 mg daily",
  surgery: "none",
  drugId: "vancomycin"
};
const PatientForm = ({ onSubmit, loading }) => {
  const [patientId, setPatientId] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [serumCr, setSerumCr] = useState("");
  const [hepatic, setHepatic] = useState(false);
  const [pregnancy, setPregnancy] = useState("not_applicable");
  const [allergies, setAllergies] = useState([]);
  const [comorbidities, setComorbidities] = useState([]);
  const [medications, setMedications] = useState("");
  const [surgery, setSurgery] = useState("none");
  const [drugId, setDrugId] = useState(DRUGS[0].id);
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const a = parseFloat(age);
  const cr = parseFloat(serumCr);
  const metrics = useMemo(() => {
    return {
      bmi: calcBMI(w, h),
      bsa: calcBSA(w, h),
      crcl: calcCrCl(a, w, cr, sex)
    };
  }, [w, h, a, cr, sex]);
  const buildData = (overrides) => ({
    patientId: (overrides == null ? void 0 : overrides.patientId) ?? patientId,
    age: (overrides == null ? void 0 : overrides.age) ?? (a || 0),
    sex: (overrides == null ? void 0 : overrides.sex) ?? sex,
    heightCm: (overrides == null ? void 0 : overrides.heightCm) ?? (h || 0),
    weightKg: (overrides == null ? void 0 : overrides.weightKg) ?? (w || 0),
    serumCr: (overrides == null ? void 0 : overrides.serumCr) ?? (cr || 0),
    hepaticImpairment: (overrides == null ? void 0 : overrides.hepatic) ?? hepatic,
    pregnancy: (overrides == null ? void 0 : overrides.pregnancy) ?? pregnancy,
    allergies: (overrides == null ? void 0 : overrides.allergies) ?? allergies,
    comorbidities: (overrides == null ? void 0 : overrides.comorbidities) ?? comorbidities,
    medications: (overrides == null ? void 0 : overrides.medications) ?? medications,
    surgery: (overrides == null ? void 0 : overrides.surgery) ?? surgery,
    drugId: (overrides == null ? void 0 : overrides.drugId) ?? drugId
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(buildData(), metrics.crcl);
  };
  const handleUseSample = () => {
    setPatientId(SAMPLE_PATIENT.patientId);
    setAge(SAMPLE_PATIENT.age);
    setSex(SAMPLE_PATIENT.sex);
    setHeightCm(SAMPLE_PATIENT.heightCm);
    setWeightKg(SAMPLE_PATIENT.weightKg);
    setSerumCr(SAMPLE_PATIENT.serumCr);
    setHepatic(SAMPLE_PATIENT.hepatic);
    setPregnancy(SAMPLE_PATIENT.pregnancy);
    setAllergies(SAMPLE_PATIENT.allergies);
    setComorbidities(SAMPLE_PATIENT.comorbidities);
    setMedications(SAMPLE_PATIENT.medications);
    setSurgery(SAMPLE_PATIENT.surgery);
    setDrugId(SAMPLE_PATIENT.drugId);
    const sampleAge = parseFloat(SAMPLE_PATIENT.age);
    const sampleWeight = parseFloat(SAMPLE_PATIENT.weightKg);
    const sampleCr = parseFloat(SAMPLE_PATIENT.serumCr);
    const sampleCrcl = calcCrCl(sampleAge, sampleWeight, sampleCr, SAMPLE_PATIENT.sex);
    const data = buildData({
      patientId: SAMPLE_PATIENT.patientId,
      age: sampleAge,
      sex: SAMPLE_PATIENT.sex,
      heightCm: parseFloat(SAMPLE_PATIENT.heightCm),
      weightKg: sampleWeight,
      serumCr: sampleCr,
      hepatic: SAMPLE_PATIENT.hepatic,
      pregnancy: SAMPLE_PATIENT.pregnancy,
      allergies: SAMPLE_PATIENT.allergies,
      comorbidities: SAMPLE_PATIENT.comorbidities,
      medications: SAMPLE_PATIENT.medications,
      surgery: SAMPLE_PATIENT.surgery,
      drugId: SAMPLE_PATIENT.drugId
    });
    onSubmit(data, sampleCrcl);
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-foreground/80", children: [
        "Don't have patient values on hand?",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: "Load a sample patient" }),
        " and run the analysis instantly."
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleUseSample,
          disabled: loading,
          className: "shrink-0 inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-card px-3.5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all disabled:opacity-60",
          children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
            "Use sample values"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsx(MetricCard, { label: "BMI", value: round(metrics.bmi), unit: "kg/m²" }),
      /* @__PURE__ */ jsx(MetricCard, { label: "BSA (Mosteller)", value: round(metrics.bsa, 2), unit: "m²" }),
      /* @__PURE__ */ jsx(MetricCard, { label: "CrCl (Cockcroft-Gault)", value: round(metrics.crcl, 0), unit: "mL/min" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-2xl p-6 space-y-6 card-elevated", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: User, title: "Patient & Drug" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Patient Name / ID" }),
            /* @__PURE__ */ jsx("input", { className: inputCls, value: patientId, onChange: (e) => setPatientId(e.target.value), placeholder: "e.g. MRN-00482" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Selected Drug" }),
            /* @__PURE__ */ jsx("select", { className: inputCls, value: drugId, onChange: (e) => setDrugId(e.target.value), children: DRUGS.map((d) => /* @__PURE__ */ jsxs("option", { value: d.id, children: [
              d.name,
              " — ",
              d.className
            ] }, d.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 border-t border-border pt-6", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: Activity, title: "Vitals & Measurements" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Age" }),
            /* @__PURE__ */ jsx("input", { type: "number", className: inputCls, value: age, onChange: (e) => setAge(e.target.value), placeholder: "yrs" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Sex" }),
            /* @__PURE__ */ jsxs("select", { className: inputCls, value: sex, onChange: (e) => setSex(e.target.value), children: [
              /* @__PURE__ */ jsx("option", { value: "male", children: "Male" }),
              /* @__PURE__ */ jsx("option", { value: "female", children: "Female" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Height" }),
            /* @__PURE__ */ jsx("input", { type: "number", className: inputCls, value: heightCm, onChange: (e) => setHeightCm(e.target.value), placeholder: "cm" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Weight" }),
            /* @__PURE__ */ jsx("input", { type: "number", className: inputCls, value: weightKg, onChange: (e) => setWeightKg(e.target.value), placeholder: "kg" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Serum Creatinine" }),
            /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", className: inputCls, value: serumCr, onChange: (e) => setSerumCr(e.target.value), placeholder: "mg/dL" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Pregnancy Status" }),
            /* @__PURE__ */ jsxs("select", { className: inputCls, value: pregnancy, onChange: (e) => setPregnancy(e.target.value), children: [
              /* @__PURE__ */ jsx("option", { value: "not_applicable", children: "Not applicable" }),
              /* @__PURE__ */ jsx("option", { value: "not_pregnant", children: "Not pregnant" }),
              /* @__PURE__ */ jsx("option", { value: "pregnant", children: "Pregnant" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Surgery / Procedure" }),
            /* @__PURE__ */ jsxs("select", { className: inputCls, value: surgery, onChange: (e) => setSurgery(e.target.value), children: [
              /* @__PURE__ */ jsx("option", { value: "none", children: "None" }),
              /* @__PURE__ */ jsx("option", { value: "elective", children: "Elective surgery" }),
              /* @__PURE__ */ jsx("option", { value: "emergency", children: "Emergency surgery" }),
              /* @__PURE__ */ jsx("option", { value: "prophylaxis", children: "Pre-op prophylaxis" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { htmlFor: "hepatic", className: "flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 cursor-pointer hover:bg-secondary/60 transition-colors", children: [
          /* @__PURE__ */ jsx("input", { id: "hepatic", type: "checkbox", checked: hepatic, onChange: (e) => setHepatic(e.target.checked), className: "h-4 w-4 rounded border-border accent-[hsl(var(--primary))]" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: "Hepatic impairment present" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 border-t border-border pt-6", children: [
        /* @__PURE__ */ jsx(SectionHeader, { icon: FlaskConical, title: "Clinical Context" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelCls, children: "Known Allergies" }),
          /* @__PURE__ */ jsx(MultiSelect, { options: ALLERGIES, selected: allergies, onChange: setAllergies })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelCls, children: "Comorbidities" }),
          /* @__PURE__ */ jsx(MultiSelect, { options: COMORBIDITIES, selected: comorbidities, onChange: setComorbidities })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelCls, children: "Current Medications" }),
          /* @__PURE__ */ jsx("textarea", { className: inputCls + " min-h-[72px] resize-y", value: medications, onChange: (e) => setMedications(e.target.value), placeholder: "Free text — list current medications" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full h-12 inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 disabled:hover:shadow-md",
          children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Calculator, { className: "h-4 w-4" }),
            loading ? "Calculating…" : "Calculate Dose"
          ]
        }
      )
    ] })
  ] });
};
const ResultCard = ({ result }) => {
  if (result.missing_field) {
    return /* @__PURE__ */ jsx("div", { className: "animate-fade-in bg-card border border-clinical-orange/40 rounded-2xl p-6 card-elevated", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(CircleHelp, { className: "h-5 w-5 text-clinical-orange shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: "Missing required data" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Cannot compute a dose. Please provide the following field:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-clinical-orange", children: result.missing_field }),
          "."
        ] })
      ] })
    ] }) });
  }
  const isAI = result.ai_powered !== false;
  return /* @__PURE__ */ jsxs("div", { className: "animate-fade-in bg-card border border-border rounded-2xl overflow-hidden card-elevated", children: [
    /* @__PURE__ */ jsxs("div", { className: "gradient-primary px-6 py-4 flex items-center gap-2 text-primary-foreground", children: [
      /* @__PURE__ */ jsx(Pill, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsx("h3", { className: "font-semibold tracking-tight", children: "Dosing Recommendation" }),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: `ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isAI ? "bg-white/20 text-primary-foreground" : "bg-white/15 text-primary-foreground/90"}`,
          children: isAI ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
            " AI-verified"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Info, { className: "h-3 w-3" }),
            " Local estimate"
          ] })
        }
      )
    ] }),
    !isAI && /* @__PURE__ */ jsx("div", { className: "border-b border-border bg-clinical-orange-bg/60 px-6 py-4", children: /* @__PURE__ */ jsxs("p", { className: "flex items-start gap-2 text-sm text-foreground/90", children: [
      /* @__PURE__ */ jsx(KeyRound, { className: "h-4 w-4 text-clinical-orange shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "This result was calculated by the built-in offline formula engine.",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-clinical-orange", children: "No AI key is connected" }),
        ", so nuanced clinical reasoning is limited and the recommendation may be less precise. Connect your own AI API key to get AI-verified, context-aware dosing guidance."
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-primary/5 border border-primary/10 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Recommended Dose" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 font-mono text-2xl font-semibold text-gradient-primary", children: result.recommended_dose })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Calculation Basis" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-foreground/90 flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(Info, { className: "h-4 w-4 text-primary shrink-0 mt-0.5" }),
          result.calculation_basis
        ] })
      ] }),
      result.adjustments_applied.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-clinical-orange-bg border border-clinical-orange/30 p-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm font-semibold text-clinical-orange", children: [
          /* @__PURE__ */ jsx(TriangleAlert, { className: "h-4 w-4" }),
          " Adjustments Applied"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1.5", children: result.adjustments_applied.map((a, i) => /* @__PURE__ */ jsxs("li", { className: "text-sm text-foreground/90 pl-1", children: [
          "• ",
          a
        ] }, i)) })
      ] }),
      result.warnings.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-clinical-warning-bg border border-destructive/40 p-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm font-semibold text-destructive", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
          " Warnings"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1.5", children: result.warnings.map((w, i) => /* @__PURE__ */ jsxs("li", { className: "text-sm text-destructive/90 font-medium pl-1", children: [
          "• ",
          w
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border pt-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-foreground", children: result.disclaimer }) })
    ] })
  ] });
};
const HistoryTable = ({ entries, onClear }) => /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: [
  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-border", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(History, { className: "h-5 w-5 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground tracking-tight", children: "Calculation History" })
    ] }),
    entries.length > 0 && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onClear,
        className: "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors",
        children: [
          /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
          " Clear"
        ]
      }
    )
  ] }),
  entries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-6 py-8 text-sm text-muted-foreground text-center", children: "No calculations yet. Completed dosing calculations will appear here." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: [
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Patient ID" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Drug" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Dose" }),
      /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-medium", children: "Timestamp" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: entries.map((e) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-secondary/40", children: [
      /* @__PURE__ */ jsx("td", { className: "px-6 py-3 font-medium text-foreground", children: e.patientId || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-foreground/90", children: e.drugName }),
      /* @__PURE__ */ jsx("td", { className: "px-6 py-3 font-mono text-xs text-foreground/90", children: e.doseGiven }),
      /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-muted-foreground text-xs", children: new Date(e.timestamp).toLocaleString() })
    ] }, e.id)) })
  ] }) })
] });
async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = await res.text() || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
async function apiRequest(url, options) {
  const res = await fetch(url, {
    method: (options == null ? void 0 : options.method) || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options == null ? void 0 : options.headers
    },
    body: options == null ? void 0 : options.body,
    credentials: "include"
  });
  await throwIfResNotOk(res);
  return res;
}
const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
  const res = await fetch(queryKey.join("/"), {
    credentials: "include"
  });
  await throwIfResNotOk(res);
  return await res.json();
};
new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
});
const Index = () => {
  const [result, setResult] = useState(null);
  const queryClient2 = useQueryClient();
  const { toast: toast2 } = useToast();
  const calculatorRef = useRef(null);
  const scrollToCalculator = () => {
    var _a;
    (_a = calculatorRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const { data: history = [] } = useQuery({
    queryKey: ["/api/history"],
    queryFn: async () => {
      const res = await apiRequest("/api/history");
      const rows = await res.json();
      return rows.map((r) => ({
        id: r.id,
        patientId: r.patientId ?? "",
        drugName: r.drugName,
        doseGiven: r.doseGiven,
        timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now()
      }));
    }
  });
  const clearHistory = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/history", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient2.invalidateQueries({ queryKey: ["/api/history"] });
    },
    meta: {
      onError: (error) => {
        toast2({
          title: "Failed to clear history",
          description: String(error),
          variant: "destructive"
        });
      }
    }
  });
  const doseMutation = useMutation({
    mutationFn: async (data) => {
      const drug = getDrug(data.drugId);
      const bmi = calcBMI(data.weightKg, data.heightCm);
      const bsa = calcBSA(data.weightKg, data.heightCm);
      const crcl = data.age && data.weightKg && data.serumCr ? (140 - data.age) * data.weightKg * (data.sex === "female" ? 0.85 : 1) / (72 * data.serumCr) : null;
      const payload = {
        patient: {
          patientId: data.patientId,
          age: data.age,
          sex: data.sex,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          serumCr: data.serumCr,
          hepaticImpairment: data.hepaticImpairment,
          pregnancy: data.pregnancy,
          allergies: data.allergies,
          comorbidities: data.comorbidities,
          medications: data.medications,
          surgery: data.surgery
        },
        metrics: { bmi, bsa, crcl },
        drug
      };
      const res = await apiRequest("/api/dose", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const dose = await res.json();
      if (!dose.missing_field) {
        await apiRequest("/api/history", {
          method: "POST",
          body: JSON.stringify({
            patientId: data.patientId,
            drugName: (drug == null ? void 0 : drug.name) || "—",
            doseGiven: dose.recommended_dose,
            result: dose
          })
        });
      }
      return dose;
    },
    onSuccess: (dose) => {
      setResult(dose);
      queryClient2.invalidateQueries({ queryKey: ["/api/history"] });
    },
    meta: {
      onError: (error) => {
        toast2({
          title: "Failed to compute dose",
          description: String(error),
          variant: "destructive"
        });
      }
    }
  });
  const handleSubmit = (data, _crcl) => {
    doseMutation.mutate(data);
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DoseWise",
    "url": "https://dosewise.app/",
    "description": "A patient-aware clinical drug dosing web app for pharmacy staff. Computes weight-based and BSA-based doses with AI-powered renal and hepatic adjustment recommendations, allergy screening, and contraindication checks.",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Live BMI, BSA, and creatinine clearance calculation",
      "AI-powered dosing recommendations",
      "Renal and hepatic dose adjustments",
      "Drug allergy and contraindication checking",
      "Calculation history tracking",
      "Guided onboarding with sample patient"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "Pharmacy staff, clinical pharmacists, physicians"
    }
  };
  return /* @__PURE__ */ jsxs("div", { id: "top", className: "min-h-screen app-bg flex flex-col", children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "DoseWise — AI Clinical Drug Dosing Web App for Pharmacy Teams",
        description: "DoseWise is a patient-aware clinical dosing web app for pharmacy teams. Enter patient vitals for AI-powered, weight-based dose recommendations with renal and hepatic adjustments, allergy and contraindication screening — verified by licensed professionals.",
        canonical: "/",
        ogImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&h=630&fit=crop",
        jsonLd
      }
    ),
    /* @__PURE__ */ jsx(SafetyBanner, {}),
    /* @__PURE__ */ jsx(AppHeader, { onLaunch: scrollToCalculator }),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx(LandingHero, { onLaunch: scrollToCalculator }),
      /* @__PURE__ */ jsx(FeatureShowcase, {}),
      /* @__PURE__ */ jsx("section", { id: "calculator", ref: calculatorRef, className: "border-t border-border bg-secondary/20 scroll-mt-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-8 max-w-2xl", children: [
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary", children: [
            /* @__PURE__ */ jsx(ClipboardList, { className: "h-3.5 w-3.5" }),
            " Dosing Workspace"
          ] }),
          /* @__PURE__ */ jsxs("h2", { className: "mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground", children: [
            "Compute a ",
            /* @__PURE__ */ jsx("span", { className: "text-gradient-primary", children: "patient-aware" }),
            " dose"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Enter patient vitals and clinical context — or load a sample patient — to instantly generate a structured, verifiable recommendation." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground tracking-tight mb-4", children: "Patient Intake" }),
            /* @__PURE__ */ jsx(PatientForm, { onSubmit: handleSubmit, loading: doseMutation.isPending })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground tracking-tight mb-4", children: "Recommendation" }),
              result ? /* @__PURE__ */ jsx(ResultCard, { result }) : /* @__PURE__ */ jsxs("div", { className: "bg-card border border-dashed border-border rounded-2xl p-10 text-center card-elevated", children: [
                /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(ClipboardList, { className: "h-6 w-6 text-primary" }) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Complete the intake form and calculate to generate a structured dosing recommendation." })
              ] })
            ] }),
            /* @__PURE__ */ jsx(HistoryTable, { entries: history, onClear: () => clearHistory.mutate() })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(AppFooter, {})
  ] });
};
const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-4", children: "404" }),
    /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 mb-4", children: "Oops! Page not found" }),
    /* @__PURE__ */ jsx("a", { href: "/", className: "text-blue-500 hover:text-blue-700 underline", children: "Return to Home" })
  ] }) });
};
const queryClient = new QueryClient();
const App = () => /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
  /* @__PURE__ */ jsx(Toaster$1, {}),
  /* @__PURE__ */ jsx(Toaster, {}),
  /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Index, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) })
  ] })
] }) });
function render(url, origin = "") {
  const helmetContext = {};
  renderToString(
    /* @__PURE__ */ jsx(HelmetProvider, { context: helmetContext, children: /* @__PURE__ */ jsx(SiteUrlContext.Provider, { value: origin, children: /* @__PURE__ */ jsx(StaticRouter, { location: url, children: /* @__PURE__ */ jsx(App, {}) }) }) })
  );
  return { helmetContext };
}
export {
  render
};
