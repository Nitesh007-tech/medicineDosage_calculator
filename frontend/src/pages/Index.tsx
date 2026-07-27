import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import SafetyBanner from "@/components/SafetyBanner";
import AppHeader from "@/components/AppHeader";
import LandingHero from "@/components/LandingHero";
import FeatureShowcase from "@/components/FeatureShowcase";
import AppFooter from "@/components/AppFooter";
import PatientForm from "@/components/PatientForm";
import ResultCard from "@/components/ResultCard";
import HistoryTable from "@/components/HistoryTable";
import { PatientData, DosingResult, HistoryEntry } from "@/lib/types";
import { getDrug } from "@/lib/drugs";
import { calcBMI, calcBSA } from "@/lib/calculators";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList } from "lucide-react";

const Index = () => {
  const [result, setResult] = useState<DosingResult | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const calculatorRef = useRef<HTMLDivElement>(null);

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["/api/history"],
    queryFn: async () => {
      const res = await apiRequest("/api/history");
      const rows = await res.json();
      return rows.map((r: any) => ({
        id: r.id,
        patientId: r.patientId ?? "",
        drugName: r.drugName,
        doseGiven: r.doseGiven,
        timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
      }));
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/history", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
    meta: {
      onError: (error: unknown) => {
        toast({
          title: "Failed to clear history",
          description: String(error),
          variant: "destructive",
        });
      },
    },
  });

  const doseMutation = useMutation({
    mutationFn: async (data: PatientData) => {
      const drug = getDrug(data.drugId);
      const bmi = calcBMI(data.weightKg, data.heightCm);
      const bsa = calcBSA(data.weightKg, data.heightCm);
      const crcl =
        data.age && data.weightKg && data.serumCr
          ? ((140 - data.age) *
              data.weightKg *
              (data.sex === "female" ? 0.85 : 1)) /
            (72 * data.serumCr)
          : null;

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
          surgery: data.surgery,
        },
        metrics: { bmi, bsa, crcl },
        drug,
      };

      const res = await apiRequest("/api/dose", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const dose: DosingResult = await res.json();

      if (!dose.missing_field) {
        await apiRequest("/api/history", {
          method: "POST",
          body: JSON.stringify({
            patientId: data.patientId,
            drugName: drug?.name || "—",
            doseGiven: dose.recommended_dose,
            result: dose,
          }),
        });
      }

      return dose;
    },
    onSuccess: (dose) => {
      setResult(dose);
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
    meta: {
      onError: (error: unknown) => {
        toast({
          title: "Failed to compute dose",
          description: String(error),
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (data: PatientData, _crcl?: number | null) => {
    doseMutation.mutate(data);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DoseWise",
    "url": "https://dosewise.app/",
    "description":
      "A patient-aware clinical drug dosing web app for pharmacy staff. Computes weight-based and BSA-based doses with AI-powered renal and hepatic adjustment recommendations, allergy screening, and contraindication checks.",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "featureList": [
      "Live BMI, BSA, and creatinine clearance calculation",
      "AI-powered dosing recommendations",
      "Renal and hepatic dose adjustments",
      "Drug allergy and contraindication checking",
      "Calculation history tracking",
      "Guided onboarding with sample patient",
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "Pharmacy staff, clinical pharmacists, physicians",
    },
  };

  return (
    <div id="top" className="min-h-screen app-bg flex flex-col">
      <SEO
        title="DoseWise — AI Clinical Drug Dosing Web App for Pharmacy Teams"
        description="DoseWise is a patient-aware clinical dosing web app for pharmacy teams. Enter patient vitals for AI-powered, weight-based dose recommendations with renal and hepatic adjustments, allergy and contraindication screening — verified by licensed professionals."
        canonical="/"
        ogImage="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&h=630&fit=crop"
        jsonLd={jsonLd}
      />
      <SafetyBanner />
      <AppHeader onLaunch={scrollToCalculator} />

      <main className="flex-1">
        <LandingHero onLaunch={scrollToCalculator} />
        <FeatureShowcase />

        {/* Calculator workspace */}
        <section id="calculator" ref={calculatorRef} className="border-t border-border bg-secondary/20 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <div className="mb-8 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ClipboardList className="h-3.5 w-3.5" /> Dosing Workspace
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Compute a <span className="text-gradient-primary">patient-aware</span> dose
              </h2>
              <p className="mt-3 text-muted-foreground">
                Enter patient vitals and clinical context — or load a sample patient — to instantly
                generate a structured, verifiable recommendation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Patient Intake</h3>
                <PatientForm onSubmit={handleSubmit} loading={doseMutation.isPending} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Recommendation</h3>
                  {result ? (
                    <ResultCard result={result} />
                  ) : (
                    <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center card-elevated">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ClipboardList className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete the intake form and calculate to generate a structured dosing recommendation.
                      </p>
                    </div>
                  )}
                </div>
                <HistoryTable entries={history} onClear={() => clearHistory.mutate()} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default Index;