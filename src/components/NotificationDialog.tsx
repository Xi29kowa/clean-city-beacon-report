
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBinReports } from "@/hooks/useBinReports";

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string | null;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  reportId
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { submitNotificationRequest } = useBinReports();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Ungültige E-Mail",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        variant: "destructive",
      });
      return;
    }

    if (!reportId) {
      toast({
        title: "Fehler",
        description: "Keine Meldung gefunden.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await submitNotificationRequest(email, reportId);
    
    if (success) {
      toast({
        title: "Benachrichtigung aktiviert!",
        description: "Sie werden per E-Mail informiert, wenn der Mülleimer geleert wurde.",
      });
      setEmail('');
      onClose();
    } else {
      toast({
        title: "Fehler",
        description: "Die Benachrichtigung konnte nicht aktiviert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>E-Mail Benachrichtigung</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre.email@beispiel.de"
              required
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Benachrichtigung aktivieren'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;
