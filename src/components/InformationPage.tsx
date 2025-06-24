
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Phone, Mail, MapPin } from 'lucide-react';

const InformationPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Informationen</h1>
        <p className="text-gray-700">
          Hier finden Sie wichtige Informationen über Green Bin und unsere Dienstleistungen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-green-600" />
              Wie funktioniert Green Bin?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Green Bin nutzt intelligente Sensortechnologie und eine benutzerfreundliche 
              Mobile App, um Bürgern und Verwaltungen dabei zu helfen, Müllprobleme 
              schnell zu identifizieren und zu lösen.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Kontakt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span>+49 (0) 123 456 789</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span>info@greenbin.de</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span>Musterstraße 123, 12345 Musterstadt</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Häufig gestellte Fragen</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Wie melde ich einen überfüllten Mülleimer?</AccordionTrigger>
              <AccordionContent>
                Sie können einen überfüllten Mülleimer über unsere Webseite oder Mobile App melden. 
                Wählen Sie einfach "Mülleimer melden" und folgen Sie den Anweisungen. 
                Ihre Meldung wird automatisch an die zuständige Verwaltung weitergeleitet.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Ist die Nutzung von Green Bin kostenlos?</AccordionTrigger>
              <AccordionContent>
                Ja, die Grundfunktionen von Green Bin sind für alle Bürger kostenlos verfügbar. 
                Für Gemeinden und Verwaltungen bieten wir verschiedene kostenpflichtige 
                Premium-Features an.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Wie schnell werden Meldungen bearbeitet?</AccordionTrigger>
              <AccordionContent>
                Die Bearbeitungszeit hängt von der jeweiligen Gemeinde ab. In der Regel 
                werden Meldungen innerhalb von 24-48 Stunden bearbeitet. Bei dringenden 
                Fällen kann die Bearbeitung auch schneller erfolgen.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Kann ich den Status meiner Meldung verfolgen?</AccordionTrigger>
              <AccordionContent>
                Ja, nachdem Sie eine Meldung abgesendet haben, erhalten Sie eine 
                Bestätigungs-E-Mail mit einer Referenznummer. Sie können den Status 
                Ihrer Meldung jederzeit über unser System verfolgen.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default InformationPage;
