import React from 'react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold">
              CleanCity
            </a>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-white hover:text-blue-200 transition-colors">
                Mülleimer melden
              </a>
              <a href="/karte" className="text-white hover:text-blue-200 transition-colors">
                Karte
              </a>
              <a href="/" className="text-white hover:text-blue-200 transition-colors">
                Startseite
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Willkommen bei CleanCity
          </h1>
          <p className="text-gray-700 leading-relaxed mb-6">
            Helfen Sie uns, Nürnberg sauberer zu machen! Melden Sie volle oder beschädigte Mülleimer,
            damit wir schnell reagieren können.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Nutzen Sie unsere Karte, um stets den nächsten leeren Mülleimer zu finden.
          </p>
          <div className="text-center">
            <a
              href="#"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Mülleimer melden
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 text-gray-600 py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} CleanCity. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
