import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import backgroundDrawing from "../../assets/background/drawing.jpg";

export function Layout() {
  return (
    <div
      className="relative isolate flex h-screen flex-col"
      style={{
        backgroundImage: `url(${backgroundDrawing})`,
        backgroundPosition: "bottom center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-background/70 via-background/90 to-background/70" />
      <Header />
      <main className="material-enter-soft relative z-10 flex-1 overflow-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
