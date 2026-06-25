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
import logoFotai from "../../assets/logo/fotai.png";
import { Button } from "@/components/ui/button";
import { NavLink, useLocation } from "react-router-dom";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const location = useLocation();

  const { isAuthenticated, setAuthLogout } = useAuthStore();

  const messages = useChatStore((store) => store.messages);
  const { clearMessages } = useChatStore();
  const handleNewChatButtonClick = () => {
    clearMessages();
  };

  const handleLogoutButton = () => {
    setAuthLogout();
    clearMessages();
  };

  return (
    <header className="material-enter-top sticky top-0 z-50 w-full bg-linear-to-r from-cyan-700 from-10% via-indigo-700 via-30% to-cyan-700 to-99% px-6 py-4 shadow-2xl">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex flex-row gap-3 items-center text-xl font-bold text-black">
          <NavLink to="/">
            <img
              src={logoFotai}
              alt="fotai.app"
              title="fotai.app"
              className="h-8"
            />
          </NavLink>
        </div>
        <nav>
          <ul className="flex flex-row gap-5 items-center font-semibold text-black">
            {messages.length !== 0 &&
            location.pathname !== "/how.html" &&
            location.pathname !== "/wip.html" &&
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
                      <AlertDialogTitle className="text-black">
                        Czy na pewno?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-black">
                        Rozpoczęcie nowej rozmowy spowoduje nieodwracalne
                        usunięcie aktualnej. Historia rozmów będzie dostępna w
                        kolejnej wersji aplikacji 😊
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground">
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
            location.pathname === "/wip.html" ||
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

            {!isAuthenticated ? (
              <>
                <li>
                  <NavLink
                    className="top-nav-link top-nav-link-gradient"
                    to="register.html"
                  >
                    Rejestracja
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    className="top-nav-link top-nav-link-gradient"
                    to="login.html"
                  >
                    Logowanie
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                {/* <li className="text-white">Witaj, {user?.name}</li> */}
                <li>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      {messages.length !== 0 ? (
                        <button className="top-nav-link top-nav-link-gradient">
                          Wyloguj
                        </button>
                      ) : (
                        <button
                          className="top-nav-link top-nav-link-gradient"
                          onClick={handleLogoutButton}
                        >
                          Wyloguj
                        </button>
                      )}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-black">
                          Czy na pewno?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-black">
                          Wylogowanie spowoduje nieodwracalne usunięcie
                          aktualnej rozmowy. Historia rozmów będzie dostępna w
                          kolejnej wersji aplikacji 😊
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground">
                          Wróć do aktualnej rozmowy
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLogoutButton}
                          className="cursor-pointer"
                        >
                          Wyloguj
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
