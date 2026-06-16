import type { ReactEventHandler } from "react";

export function LoginPage() {
  console.log("Strona logowania");
  const handleLoginForm = (event) => {
    event.preventDefault();
    console.log(event);
  };
  return (
    <>
      <h1>Zaloguj się, aby korzystać z FOTOAI</h1>
      <form onSubmit={handleLoginForm}>
        <input type="text" name="login" placeholder="Wpisz login" />
        <input type="text" name="password" placeholder="Wpisz hasło" />
        <button type="submit">Zaloguj się</button>
      </form>
      <p>
        Nie Masz jeszcze konta? <a href="#">Zarejestruj się</a>
      </p>
    </>
  );
}
