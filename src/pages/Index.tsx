import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ContactInfo } from '@/types/form';
import { municipalities } from '@/data/municipalities';
import EnhancedLocationPicker from '@/components/EnhancedLocationPicker';

const formSchema = z.object({
  problemDescription: z.string().min(10, {
    message: "Problem description must be at least 10 characters.",
  }),
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  phone: z.string().min(8, {
    message: "Phone number must be at least 8 characters.",
  }),
  location: z.string().min(3, {
    message: "Location must be at least 3 characters.",
  }),
  wasteBinId: z.string().optional(),
});

const Index = () => {
  const [partnerMunicipality, setPartnerMunicipality] = useState<string | null>(null);
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    problemDescription: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    wasteBinId: '',
    wasteBinLocation: ''
  });

  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemDescription: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    return toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 font-mono text-white">
          <code className="break-words">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)();
  };

  const handleWasteBinSelect = (binId: string, binLocation: string) => {
    console.log('Waste bin selected in Index:', { binId, binLocation });
    setFormData(prev => ({
      ...prev,
      wasteBinId: binId,
      wasteBinLocation: binLocation
    }));
  };

  const handleLocationChange = (location: string, coordinates?: { lat: number; lng: number }) => {
    console.log('Location changed in Index:', { location, coordinates });
    setFormData(prev => ({
      ...prev,
      location
    }));
    setLocationCoordinates(coordinates || null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            🗑️ Mängelmelder der Stadt Nürnberg
          </h1>
          <p className="text-gray-600">
            Melden Sie illegale Müllablagerungen einfach und direkt.
          </p>
        </div>
      </header>

      <nav className="bg-blue-100 border-b border-blue-200">
        <div className="container mx-auto px-4 py-2 text-sm text-gray-500">
          <a href="#" className="hover:text-blue-700">Startseite</a>
          <span className="mx-2">/</span>
          <span className="font-medium">Müllablagerung melden</span>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              👋 Willkommen!
            </h2>
            <p className="text-gray-700">
              Helfen Sie uns, Nürnberg sauberer zu machen. Beschreiben Sie das
              Problem so genau wie möglich und geben Sie den Ort der
              Müllablagerung an.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="problemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        📝 Beschreibung des Problems <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Geben Sie eine detaillierte Beschreibung der Müllablagerung ein. Zum Beispiel: Art des Mülls, Menge, Größe der Ablagerung, usw."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                👤 Ihre Kontaktdaten (optional)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input placeholder="Vorname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>

                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachname</FormLabel>
                        <FormControl>
                          <Input placeholder="Nachname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <Input placeholder="E-Mail Adresse" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>

                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="Telefonnummer" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <EnhancedLocationPicker
                value={formData.location}
                onChange={handleLocationChange}
                onPartnerMunicipalityChange={setPartnerMunicipality}
                onWasteBinSelect={handleWasteBinSelect}
                coordinates={locationCoordinates}
              />

              {/* Mülleimer ID Display Field - Always show */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🗑️ Mülleimer ID
                </label>
                <Input
                  type="text"
                  value={formData.wasteBinId || ''}
                  readOnly
                  className={formData.wasteBinId 
                    ? "bg-blue-50 border-blue-200 text-blue-800 font-medium" 
                    : "bg-gray-50 border-gray-200 text-gray-500"
                  }
                  placeholder="Klicken Sie auf einen Mülleimer auf der Karte"
                />
                <p className={`text-xs mt-1 ${formData.wasteBinId 
                  ? "text-blue-600" 
                  : "text-gray-500"
                }`}>
                  {formData.wasteBinId 
                    ? "✅ Mülleimer auf der Karte ausgewählt" 
                    : "💡 Klicken Sie auf einen Mülleimer-Marker auf der Karte um die ID anzuzeigen"
                  }
                </p>
              </div>

              {partnerMunicipality && (
                <div className="rounded-md bg-yellow-50 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c-7.654 0-9.402 7.263-9.402 7.263a1.5 1.5 0 000 2.403c0 0 1.748 7.263 9.402 7.263a1.5 1.5 0 001.797-1.13v-.003l.149-.044a.75.75 0 01.502-.189l8.09-2.762c.251-.086.42-.307.42-.542V6.187c0-.235-.17-.456-.42-.542L10.707 2.89a.75.75 0 01-.502-.189l-.149-.044v-.002A1.5 1.5 0 008.257 3.099zm-1.19 0a1.5 1.5 0 011.797 1.13v.003l.149.044a.75.75 0 01.502.189l8.09 2.762c.083.028.158.076.222.136V13.7c-.065.06-.14.108-.223.136l-8.09 2.762a.75.75 0 01-.502.189l-.149.044v.002a1.5 1.5 0 01-1.797-1.13c0 0-1.748-7.263-9.402-7.263a1.5 1.5 0 010-2.403c0 0 1.748-7.263 9.402-7.263z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Hinweis: Sie haben eine Adresse in{" "}
                        {municipalities.find((m) => m.value === partnerMunicipality)?.label}
                        ausgewählt.
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Bitte beachten Sie, dass die Bearbeitung von Meldungen in
                          Partnerkommunen etwas länger dauern kann.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button type="submit">
                Müllablagerung melden
              </Button>
            </div>
          </form>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Open Alert</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </main>
    </div>
  );
};

export default Index;
