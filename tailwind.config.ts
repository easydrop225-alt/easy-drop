// Service Worker Easy Drop — gère la réception des notifications push
// (véritables notifications système, visibles même application fermée)
// et l'ouverture de la bonne page au clic.

self.addEventListener("push", (event) => {
  let donnees = { titre: "Easy Drop", message: "Nouvelle notification", lien: "/admin/dashboard" };
  try {
    donnees = event.data.json();
  } catch {
    // format inattendu — on garde les valeurs par défaut
  }

  event.waitUntil(
    self.registration.showNotification(donnees.titre || "Easy Drop", {
      body: donnees.message || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-monochrome.png",
      data: { lien: donnees.lien || "/admin/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const lien = event.notification.data?.lien || "/admin/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(lien);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(lien);
      }
    })
  );
});
