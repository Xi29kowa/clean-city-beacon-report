import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const Navigation = () => (
  <div className="bg-white shadow-sm border-b sticky top-0 z-50">
    <div className="container mx-auto px-4">
      <NavigationMenu className="max-w-full">
        <NavigationMenuList className="flex-wrap">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link 
                to="/" 
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Startseite
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link 
                to="/karte" 
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Karte
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  </div>
);

const Index = () => {
  return (
    <>
      <Navigation />
      <section className="py-6 sm:py-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Willkommen bei unserer Mülleimer-App!
              </CardTitle>
              <CardDescription className="text-gray-500">
                Finde die nächsten öffentlichen Mülleimer in deiner Umgebung.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Unsere App hilft dir, die nächstgelegenen öffentlichen Mülleimer
                zu finden, um unsere Stadt sauber zu halten. Nutze die Karte, um
                Standorte zu entdecken und einen Beitrag zu einer sauberen
                Umwelt zu leisten.
              </p>
              <Button asChild>
                <Link to="/karte" className="w-full text-center">
                  Zur Karte
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default Index;
