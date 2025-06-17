
const Karte = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Mülleimer-Karte Nürnberg
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-4">
          <iframe 
            src="https://routenplanung.vercel.app/nbg_wastebaskets_map.html" 
            className="w-full h-96 md:h-[600px] border-0 rounded-lg"
            title="Mülleimer-Karte Nürnberg"
          />
        </div>
      </div>
    </div>
  );
};

export default Karte;
