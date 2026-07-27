# Tour de Apuseni & Transalpina

Site static, responsiv, fără backend și fără chei API.

## Conținut

- 6 zile de traseu
- plan separat pentru ciclist și familie
- întâlnirile la prânz
- obiective și linkuri Google Maps
- hartă OpenStreetMap pentru fiecare GPX
- profil altimetric
- descărcarea fișierelor GPX
- mod luminos/întunecat
- PWA instalabilă pe telefon

## Previzualizare locală

Din directorul site-ului:

```bash
python -m http.server 8000
```

Apoi deschide `http://localhost:8000`.

## Publicare gratuită

### GitHub Pages

1. Creează un repository nou.
2. Încarcă întregul conținut al acestui folder.
3. Intră în **Settings → Pages**.
4. Selectează **Deploy from a branch**, branch `main`, folder `/root`.

### Cloudflare Pages

1. Creează un proiect Pages și conectează repository-ul.
2. Framework preset: `None`.
3. Build command: gol.
4. Output directory: `/`.

### Netlify

Trage folderul site-ului în Netlify Drop sau conectează repository-ul. Nu este necesar niciun build.

## Note

- Hărțile OpenStreetMap și linkurile Google Maps necesită internet.
- Conținutul principal rămâne disponibil offline după prima încărcare, prin service worker.
- Urcarea este estimată după filtrarea zgomotului altimetric din GPX.
- Verifică vremea, starea drumurilor și programul restaurantelor înaintea fiecărei etape.

Distanță totală calculată: 726.3 km  
Urcare totală estimată: 9967 m
