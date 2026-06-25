import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import backgroundAbstract from "../../assets/background/neonblur.jpg";

export function Layout() {
  return (
    <div
      className="relative isolate flex h-screen flex-col"
      style={{
        backgroundColor: "#000",
        backgroundImage: `url(${backgroundAbstract})`,
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      <Header />
      <main className="material-enter-soft relative z-10 flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
