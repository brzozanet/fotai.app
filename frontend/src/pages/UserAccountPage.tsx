import { useAuthStore } from "@/store/authStore";

export function UserAccountPage() {
  const { user } = useAuthStore();

  return (
    <>
      <div className="info-page relative isolate mx-auto w-full max-w-5xl rounded-3xl px-4 py-5 md:px-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-4 inset-y-0 -z-10 backdrop-blur-2xl md:-inset-x-6"
        />
        <div className="relative z-10">
          <h2 className="mb-10 mt-10 text-5xl leading-15 font-semibold text-white">
            Twoje konto na FOTAI
          </h2>

          <p>
            Twoje imię: <strong>{user?.name}</strong>
          </p>
          <p className="mb-8">
            Twój email: <strong>{user?.email}</strong>
          </p>
          <p className="mb-4">
            <strong>Funkcjonalności będą dostępne niebawem... ⌛︎</strong>
          </p>

          <ul className="mb-4 list-disc pl-8">
            <li>Zmiana danych (email, hasło)</li>
            <li>Historia czatów</li>
            <li>Zarządzanie czatami (zmiana nazw, usuwanie)</li>
            <li>Dostęp do usług premium</li>
            <li>Zarządzanie sposobem płatności (usługi premium)</li>
            <li>Usuwanie konta</li>
            <li>I inne...</li>
          </ul>
        </div>
      </div>
    </>
  );
}
