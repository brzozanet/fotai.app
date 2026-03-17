import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NavLink, useLocation } from "react-router-dom";
import { useChatStore } from "@/store/chatStore";
import logoFotai from "../../assets/logo/fotai.png";

export function Header() {
  const location = useLocation();
  const messages = useChatStore((store) => store.messages);
  const { clearMessages } = useChatStore();
  const handleNewChatButtonClick = () => {
    clearMessages();
  };

  return (
    <header className="material-enter-top sticky top-0 z-50 w-full bg-linear-to-r from-indigo-500 from-10%  via-emerald-500 via-40% to-emerald-550 to-70% px-6 py-4 shadow-2xl">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex flex-row gap-3 items-center text-xl font-bold text-black">
          <NavLink to="/">
            <img
              src={logoFotai}
              alt="fotai.app"
              title="fotai.app"
              className="h-10"
            />
          </NavLink>
        </div>
        <nav>
          <ul className="flex flex-row gap-6 items-center font-semibold text-black">
            {messages.length !== 0 &&
            location.pathname !== "/how.html" &&
            location.pathname !== "/about.html" ? (
              <li>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="rounded-full border border-white/60 bg-white px-6 py-4 font-semibold text-slate-900 shadow-lg shadow-cyan-950/35 transition hover:border-sky-500 hover:bg-sky-500 hover:text-white hover:shadow-xl hover:shadow-cyan-950/35 disabled:opacity-50 cursor-pointer">
                      Nowa rozmowa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Rozpoczęcie nowej rozmowy spowoduje nieodwracalne
                        usunięcie aktualnej. Historia rozmów będzie dostępna w
                        kolejnej wersji aplikacji 😊
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Wróć do aktualnej rozmowy
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleNewChatButtonClick}
                        className="cursor-pointer"
                      >
                        Tak, zacznij nową rozmowę
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ) : (
              ""
            )}

            {location.pathname === "/how.html" ||
            location.pathname === "/about.html" ? (
              <li>
                <NavLink to="/">
                  <button className="rounded-full border border-white/60 bg-white px-6 py-2 text-sm font-semibold text-black shadow-lg shadow-cyan-950/35 transition hover:border-sky-500 hover:bg-sky-500 hover:text-black hover:shadow-xl hover:shadow-cyan-950/35 disabled:opacity-50 cursor-pointer">
                    {messages.length !== 0 ? "Wróć do rozmowy" : "Nowa rozmowa"}
                  </button>
                </NavLink>
              </li>
            ) : (
              ""
            )}
            <li>
              <NavLink
                className="top-nav-link top-nav-link-gradient"
                to="how.html"
              >
                Jak to działa?
              </NavLink>
            </li>
            <li>
              <NavLink
                className="top-nav-link top-nav-link-gradient"
                to="about.html"
              >
                O projekcie
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
