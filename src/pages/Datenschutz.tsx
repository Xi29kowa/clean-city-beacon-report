
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Datenschutz = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-green-800">Datenschutzerklärung</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Datenschutzerklärung für CleanCity</CardTitle>
            <p className="text-gray-600">Stand: Dezember 2024</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
              <p className="text-gray-700">
                Verantwortlich für die Datenverarbeitung ist:<br/>
                Stadtverwaltung Musterstadt<br/>
                Hauptstraße 1<br/>
                12345 Musterstadt<br/>
                E-Mail: datenschutz@musterstadt.de<br/>
                Telefon: +49 (0) 123 456 789
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
              <p className="text-gray-700 mb-3">
                Bei der Nutzung von CleanCity werden folgende Daten verarbeitet:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Standortdaten (GPS-Koordinaten) zur Identifizierung der gemeldeten Mülleimer</li>
                <li>Hochgeladene Fotos zur Dokumentation des Problems</li>
                <li>Technische Daten wie IP-Adresse und Browser-Informationen</li>
                <li>Zeitstempel der Meldungen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Zweck der Datenverarbeitung</h2>
              <p className="text-gray-700">
                Die erhobenen Daten werden ausschließlich zur Bearbeitung Ihrer Meldungen über problematische Mülleimer verwendet. Die Standortdaten ermöglichen es der Stadtreinigung, den gemeldeten Mülleimer zu finden und das Problem zu beheben.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Rechtsgrundlage</h2>
              <p className="text-gray-700">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. e DSGVO (Wahrnehmung einer Aufgabe im öffentlichen Interesse) zur Gewährleistung der Stadtsauberkeit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Speicherdauer</h2>
              <p className="text-gray-700">
                Die Daten werden nur so lange gespeichert, wie es für die Bearbeitung der Meldung erforderlich ist. Nach Behebung des Problems werden die Daten binnen 30 Tagen gelöscht.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Ihre Rechte</h2>
              <p className="text-gray-700 mb-3">
                Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Kontakt</h2>
              <p className="text-gray-700">
                Bei Fragen zum Datenschutz wenden Sie sich bitte an unseren Datenschutzbeauftragten unter datenschutz@musterstadt.de.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Datenschutz;
