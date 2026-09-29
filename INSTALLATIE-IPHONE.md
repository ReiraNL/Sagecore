# SageCore op iPhone installeren — zonder Mac

Deze versie is een PWA. Je hebt geen Mac, Xcode of App Store-build nodig.

1. Zet de map online op een HTTPS-host met serverless functions. Het project is voorbereid voor Vercel.
2. Stel op de host `OPENAI_API_KEY` in als geheime environment variable. Zet de sleutel nooit in `app.js`.
3. Open na deployment de SageCore-URL in Safari op je iPhone.
4. Tik op **Deel** en kies **Zet op beginscherm** / **Add to Home Screen**.
5. Open SageCore vanaf het nieuwe icoon.
6. Sta microfoontoegang toe wanneer Safari daarom vraagt.

## Wat werkt offline?
De interface en eerder gecachte bestanden kunnen offline openen. Echte AI-antwoorden vereisen internet omdat deze PWA geen groot taalmodel lokaal op de iPhone uitvoert.

## Spraak
Gesproken antwoorden gebruiken de browser-spraaksynthese. Microfooninput gebruikt beschikbare browser-spraakherkenning; als Safari die functie op jouw versie niet aanbiedt, blijft typen beschikbaar.
