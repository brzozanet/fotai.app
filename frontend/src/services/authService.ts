//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// async function userAuth(path, body) {
//   try {
//     // Wyślij POST request do backendu
//     const response = await fetch(`${API_URL}${path}`, {
//       method: "POST",
//       headers: { "Content-type": "application/json" },
//       body: JSON.stringify(body),
//     });

//     // Sprawdź czy response jest OK (status 200-299)
//     if (!response.ok) {
//       const errorData = await response
//         .json()
//         .catch(() => ({ error: "Nieznany błąd" }));
//       throw new Error(
//         errorData.error || `HTTP ${response.status}: ${response.statusText}`,
//       );
//     }

//     // Parsuj JSON response
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("[authService] błąd:", error);
//   }
// }

// export function userRegister(name, email, password) {
//   return userAuth("/api/auth/register", { name, email, password });
// }

// export function userLogin(email, password) {
//   return userAuth("/api/user/login", { email, password });
// }
