
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ProductList: React.FC = () => {
  const products = [
    {
      id: 1,
      name: "Green Bin Smart Sensor",
      description: "Intelligente Sensoren zur Überwachung des Füllstands von Mülleimern",
      price: "€299",
      category: "Hardware"
    },
    {
      id: 2,
      name: "Green Bin Mobile App",
      description: "Mobile Anwendung für Bürger zur Meldung von Müllproblemen",
      price: "Kostenlos",
      category: "Software"
    },
    {
      id: 3,
      name: "Green Bin Dashboard",
      description: "Verwaltungsdashboard für Gemeinden und Städte",
      price: "€99/Monat",
      category: "Software"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Unsere Produkte</h1>
        <p className="text-gray-700 mt-2">
          Entdecken Sie unsere innovativen Lösungen für ein saubereres Stadtbild
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Badge variant="secondary">{product.category}</Badge>
                <span className="text-lg font-semibold text-green-600">
                  {product.price}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
