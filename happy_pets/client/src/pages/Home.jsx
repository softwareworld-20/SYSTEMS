export default function Home() {
  return (
    <section className="hero">
      <div className="hero__glow hero__glow--one" aria-hidden="true" />
      <div className="hero__glow hero__glow--two" aria-hidden="true" />

      <div className="hero__content">
        <span className="hero__eyebrow">Happy Pets</span>
        <h1 className="hero__title">Bienvenido</h1>
        <p className="hero__subtitle">
          Un espacio pensado para el cuidado y el bienestar de tus mascotas.
        </p>
      </div>
    </section>
  );
}
