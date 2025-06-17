import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button"

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-green-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Mülleimer Finder
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-white hover:text-green-300 transition-colors">
              Startseite
            </Link>
            <a href="#melden" className="text-white hover:text-green-300 transition-colors">
              Mülleimer melden
            </a>
            <Link to="/karte" className="text-white hover:text-green-300 transition-colors">
              Karte
            </Link>
          </nav>
          <div className="md:hidden">
            {/* Mobile menu icon or button */}
            <button className="text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
            Finde den nächsten Mülleimer in deiner Nähe!
          </h1>
          <p className="text-lg text-gray-700">
            Saubere Straßen beginnen mit uns. Hilf mit, Nürnberg sauber zu halten.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Mülleimer melden
            </h2>
            <p className="text-gray-700 mb-6">
              Ist ein Mülleimer voll, beschädigt oder fehlt? Melde ihn uns!
            </p>
            <Button asChild>
              <a href="#melden" className="flex items-center justify-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                <Trash2 className="mr-2" size={20} />
                Mülleimer melden
              </a>
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Mülleimer Karte
            </h2>
            <p className="text-gray-700 mb-6">
              Finde Mülleimer in deiner Nähe auf unserer interaktiven Karte.
            </p>
            <Link to="/karte">
              <Button className="flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                <MapPin className="mr-2" size={20} />
                Zur Karte
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-4 text-center">
        <div className="container mx-auto px-4">
          <p className="text-gray-600">
            Ein Projekt für ein sauberes Nürnberg.
          </p>
          <nav className="flex justify-center space-x-4 mt-2">
            <Link to="/datenschutz" className="text-gray-600 hover:text-gray-800">
              Datenschutz
            </Link>
            <Link to="/impressum" className="text-gray-600 hover:text-gray-800">
              Impressum
            </Link>
            <Link to="/nutzungsbedingungen" className="text-gray-600 hover:text-gray-800">
              Nutzungsbedingungen
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;
