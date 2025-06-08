
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Nutzungsbedingungen = () => {
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
            <h1 className="text-2xl font-bold text-green-800">Nutzungsbedingungen</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Nutzungsbedingungen für CleanCity</CardTitle>
            <p className="text-gray-600">Stand: Dezember 2024</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
              <p className="text-gray-700">
                Diese Nutzungsbedingungen gelten für die Nutzung der CleanCity-Anwendung, die von der Stadtverwaltung Musterstadt bereitgestellt wird. Mit der Nutzung der Anwendung erkennen Sie diese Bedingungen an.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Zweck der Anwendung</h2>
              <p className="text-gray-700">
                CleanCity dient der Meldung von überfüllten, beschädigten oder anderweitig problematischen Mülleimern im Stadtgebiet. Die Anwendung soll zur Verbesserung der Stadtsauberkeit beitragen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Pflichten der Nutzer</h2>
              <div className="text-gray-700 space-y-3">
                <p>Bei der Nutzung von CleanCity verpflichten Sie sich:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Nur wahrheitsgemäße und korrekte Meldungen abzugeben</li>
                  <li>Keine falschen oder irreführenden Informationen zu übermitteln</li>
                  <li>Keine beleidigenden, diskriminierenden oder rechtswidrigen Inhalte zu verwenden</li>
                  <li>Nur Fotos von tatsächlich problematischen Mülleimern hochzuladen</li>
                  <li>Die Anwendung nicht für kommerzielle Zwecke zu nutzen</li>
                  <li>Keine Spam-Meldungen oder wiederholte identische Meldungen zu erstellen</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Verbotene Nutzung</h2>
              <div className="text-gray-700 space-y-2">
                <p>Folgende Handlungen sind untersagt:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Manipulation oder Missbrauch der Anwendung</li>
                  <li>Verbreitung von Schadsoftware oder Viren</li>
                  <li>Unbefugter Zugriff auf fremde Daten</li>
                  <li>Verletzung von Urheberrechten oder anderen Schutzrechten</li>
                  <li>Belästigung anderer Nutzer oder Mitarbeiter der Stadtverwaltung</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Verfügbarkeit der Anwendung</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der Anwendung. Ein Anspruch auf Verfügbarkeit besteht jedoch nicht. Wartungsarbeiten und technische Störungen können zu vorübergehenden Ausfällen führen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Haftung</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung haftet nur für Schäden, die durch vorsätzliches oder grob fahrlässiges Verhalten verursacht wurden. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit nicht Leben, Körper oder Gesundheit betroffen sind.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Bearbeitung von Meldungen</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung ist bemüht, eingegangene Meldungen zeitnah zu bearbeiten. Ein Anspruch auf Bearbeitung innerhalb einer bestimmten Frist besteht jedoch nicht. Die Priorisierung erfolgt nach städtischen Kriterien.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Änderungen der Nutzungsbedingungen</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung behält sich vor, diese Nutzungsbedingungen jederzeit zu ändern. Nutzer werden über wesentliche Änderungen informiert. Die fortgesetzte Nutzung nach einer Änderung gilt als Zustimmung zu den neuen Bedingungen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Beendigung der Nutzung</h2>
              <p className="text-gray-700">
                Die Stadtverwaltung kann Nutzern bei Verstößen gegen diese Bedingungen den Zugang zur Anwendung verwehren. Nutzer können die Nutzung jederzeit beenden, indem sie die Anwendung nicht mehr verwenden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Anwendbares Recht</h2>
              <p className="text-gray-700">
                Für diese Nutzungsbedingungen und die Nutzung der Anwendung gilt deutsches Recht. Gerichtsstand ist Musterstadt, soweit rechtlich zulässig.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Kontakt</h2>
              <p className="text-gray-700">
                Bei Fragen zu diesen Nutzungsbedingungen wenden Sie sich bitte an: info@musterstadt.de
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Nutzungsbedingungen;
