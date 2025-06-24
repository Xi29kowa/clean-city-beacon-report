import { useEffect, useState } from "react";

export default function Karte() {
  const [karteHTML, setKarteHTML] = useState("");

  useEffect(() => {
    fetch("https://routenplanung-maps.onrender.com/map")
      .then((res) => res.text())
      .then((html) => setKarteHTML(html));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Interaktive Abfallkarte
      </h1>
      <div dangerouslySetInnerHTML={{ __html: karteHTML }} />
    </div>
  );
}
