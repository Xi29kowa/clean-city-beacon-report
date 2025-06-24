
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Heart } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Über Green Bin</h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Wir sind ein innovatives Unternehmen, das sich der Verbesserung der städtischen Sauberkeit 
          durch technologische Lösungen widmet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <CardTitle>Unser Team</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Ein engagiertes Team von Entwicklern, Designern und Umweltexperten, 
              die gemeinsam an einer saubereren Zukunft arbeiten.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Target className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <CardTitle>Unsere Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Städte dabei zu unterstützen, effizienter und nachhaltiger zu werden, 
              indem wir Bürgern und Verwaltungen moderne Tools zur Verfügung stellen.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Heart className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <CardTitle>Unsere Werte</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Nachhaltigkeit, Innovation und Gemeinschaftssinn stehen im Mittelpunkt 
              unserer Arbeit für eine lebenswertere Umwelt.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unsere Geschichte</h2>
        <p className="text-gray-700 mb-4">
          Green Bin wurde 2023 mit der Vision gegründet, die Art und Weise zu revolutionieren, 
          wie Städte ihre Abfallwirtschaft verwalten. Als Team von Technologie-Enthusiasten 
          und Umweltschützern erkannten wir die Notwendigkeit einer intelligenten Lösung 
          für ein wachsendes städtisches Problem.
        </p>
        <p className="text-gray-700">
          Heute arbeiten wir mit Dutzenden von Gemeinden zusammen und haben bereits 
          tausende von Mülleimern in unser intelligentes Überwachungssystem integriert. 
          Unser Ziel ist es, bis 2025 in über 100 Städten präsent zu sein.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
