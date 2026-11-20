# Przedszkole nr 16 w Koszalinie – strona internetowa

Projekt nowej strony Przedszkola nr 16 w Koszalinie (ul. Kornela Makuszyńskiego 9) na podstawie treści z dotychczasowego portalu przedszkola.

## Wersje

| Folder | Opis |
| --- | --- |
| `/` (główny) | **Wersja oficjalna** – stonowany wygląd zgodny z wymaganiami BIP i WCAG 2.1: pasek dostępności (rozmiar tekstu, wysoki kontrast), wyszukiwarka, aktualności z archiwum, plan dnia, opłaty, dokumenty do pobrania, kontakt. |
| `deklaracja-dostepnosci.html` | Deklaracja dostępności (projekt – pola „do uzupełnienia” wypełnia dyrekcja). |
| `tekst-latwy.html` | Informacja o przedszkolu w tekście łatwym do czytania (ETR). |
| `jezyk-migowy.html` | Strona dla osób głuchych: miejsce na nagranie w PJM, kontakt, tłumacz języka migowego. |
| `kolorowa/` | Pierwsza, kolorowa wersja projektu (bez dokumentów i wyszukiwarki). |
| `oficjalna/` | Przekierowanie na stronę główną (dawny adres wersji oficjalnej). |

## Zawartość

- `index.html` – strona główna; `assets/` – wspólne style (`style.css`) i skrypty (`main.js`, `prefs.js` – ułatwienia dostępu) dla wszystkich podstron.
- `img/` – logo przedszkola (`logo.svg`, `logo-negatyw.svg`, `logo-jednobarwne.svg`), logotypy programów i znak BIP.
- `pliki/` – dokumenty do pobrania (PDF, DOCX) przeniesione z dotychczasowego portalu. Nowy lub zaktualizowany dokument podmienia się w tym folderze i w sekcji „Dokumenty do pobrania” w `index.html`.

## Publikacja (GitHub Pages)

Settings → Pages → Source: **Deploy from a branch** → wybierz gałąź i folder **`/ (root)`** → Save.
Strona będzie dostępna pod adresem `https://<nazwa-konta>.github.io/Strony-www/`, a wersja kolorowa pod `…/Strony-www/kolorowa/`.
