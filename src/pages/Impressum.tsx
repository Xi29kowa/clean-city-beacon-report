
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Impressum = () => {
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
            <h1 className="text-2xl font-bold text-green-800">Impressum</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Impressum</CardTitle>
            <p className="text-gray-600">Angaben gemäß § 5 TMG</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Anbieter</h2>
              <div className="text-gray-700">
                <p><strong>Stadtverwaltung Musterstadt</strong></p>
                <p>Hauptstraße 1</p>
                <p>12345 Musterstadt</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
              <div className="text-gray-700">
                <p><strong>Telefon:</strong> +49 (0) 123 456 789</p>
                <p><strong>Fax:</strong> +49 (0) 123 456 790</p>
                <p><strong>E-Mail:</strong> info@musterstadt.de</p>
                <p><strong>Website:</strong> www.musterstadt.de</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Vertretungsberechtigte</h2>
              <div className="text-gray-700">
                <p><strong>Bürgermeister:</strong> Max Mustermann</p>
                <p><strong>Stellvertretung:</strong> Maria Musterfrau</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Umsatzsteuer-Identifikationsnummer</h2>
              <p className="text-gray-700">
                Gemäß § 27a Umsatzsteuergesetz: DE123456789
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Aufsichtsbehörde</h2>
              <div className="text-gray-700">
                <p>Regierungspräsidium Musterland</p>
                <p>Kommunalaufsicht</p>
                <p>Behördenstraße 10</p>
                <p>12345 Musterland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Verantwortlich für den Inhalt</h2>
              <div className="text-gray-700">
                <p>Nach § 55 Abs. 2 RStV:</p>
                <p><strong>Dr. Sarah Schmidt</strong></p>
                <p>Leiterin Öffentlichkeitsarbeit</p>
                <p>Stadtverwaltung Musterstadt</p>
                <p>Hauptstraße 1</p>
                <p>12345 Musterstadt</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Haftungsausschluss</h2>
              <div className="text-gray-700 space-y-3">
                <div>
                  <h3 className="font-semibold">Inhalt des Onlineangebotes</h3>
                  <p>Die Stadtverwaltung übernimmt keinerlei Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität der bereitgestellten Informationen.</p>
                </div>
                <div>
                  <h3 className="font-semibold">Verweise und Links</h3>
                  <p>Bei direkten oder indirekten Verweisen auf fremde Webseiten, die außerhalb des Verantwortungsbereiches liegen, würde eine Haftungsverpflichtung ausschließlich in dem Fall in Kraft treten, in dem die Stadtverwaltung von den Inhalten Kenntnis hat.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Urheberrecht</h2>
              <p className="text-gray-700">
                Die durch die Stadtverwaltung erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung der Stadtverwaltung.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressum;
