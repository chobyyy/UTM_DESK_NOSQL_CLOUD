import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const areas = [
  ['computo_redes', 'Cómputo y Telecomunicaciones'],
  ['infraestructura', 'Infraestructura'],
  ['academico', 'Servicios Académicos']
];

function App() {
  return (
    <main className="layout">
      <header>
        <p className="eyebrow">Universidad Tecnológica de la Mixteca</p>
        <h1>UTM Desk</h1>
        <p>Reporta y da seguimiento a las incidencias del campus.</p>
      </header>
      <section className="cards" aria-label="Áreas de atención">
        {areas.map(([code, title]) => <article key={code}><h2>{title}</h2><p>Registra un ticket con los datos específicos de esta área.</p><button type="button">Crear ticket</button></article>)}
      </section>
      <section className="notice"><h2>Primer avance</h2><p>La estructura base de la aplicación ya está definida. El siguiente paso es conectar este portal con inicio de sesión y el formulario dinámico de tickets.</p></section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
