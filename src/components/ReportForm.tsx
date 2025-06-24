
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportFormProps {
  selectedLocation?: string | null;
  selectedBasketId?: string | null;
}

const ReportForm: React.FC<ReportFormProps> = ({ selectedLocation, selectedBasketId }) => {
  const [issueType, setIssueType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>(selectedLocation || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Report submitted:', { issueType, description, location, selectedBasketId });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mülleimer melden</CardTitle>
        <CardDescription>
          Melden Sie Probleme mit Mülleimern in Ihrer Umgebung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="issue-type">Art des Problems</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Problem auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Überfüllt</SelectItem>
                <SelectItem value="damaged">Beschädigt</SelectItem>
                <SelectItem value="missing">Fehlend</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Standort</Label>
            <Input 
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Adresse oder Beschreibung des Standorts"
            />
            {selectedBasketId && (
              <p className="text-sm text-gray-600 mt-1">
                Ausgewählter Mülleimer: {selectedBasketId}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie das Problem genauer..."
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full">
            Meldung absenden
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;
